const PACKET = { CONNECT: 1, DATA: 2, CONTINUE: 3, CLOSE: 4 };

function parseFrame(data: Uint8Array) {
  if (data.byteLength < 5) throw new Error("Short Wisp frame");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { type: view.getUint8(0), streamID: view.getUint32(1, true), payload: data.slice(5) };
}
function makeFrame(type: number, id: number, payload = new Uint8Array()) {
  const out = new Uint8Array(5 + payload.byteLength);
  const view = new DataView(out.buffer);
  view.setUint8(0, type);
  view.setUint32(1, id, true);
  out.set(payload, 5);
  return out;
}
function makeClose(id: number, reason = 1) {
  const out = makeFrame(PACKET.CLOSE, id, new Uint8Array(4));
  out[5] = reason;
  return out;
}
function makeContinue(id: number, queue: number) {
  const payload = new Uint8Array(4);
  new DataView(payload.buffer).setUint32(0, queue, true);
  return makeFrame(PACKET.CONTINUE, id, payload);
}
function isPublicIPv4(ip: string) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a,b,c] = p;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168 || (b === 0 && c === 2))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113) || (a === 255));
}
async function resolvePublicIPv4(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    if (!isPublicIPv4(host)) throw new Error("Private or reserved address blocked");
    return host;
  }
  if (!host || host.includes("/") || host.includes("\\") || host.endsWith(".local") ||
      host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("Invalid or local hostname blocked");
  }
  const answers = await Deno.resolveDns(host, "A");
  const ip = answers.find(isPublicIPv4);
  if (!ip) throw new Error("No public IPv4 address available");
  return ip;
}
async function writeAll(conn: Deno.Conn, bytes: Uint8Array) {
  let offset = 0;
  while (offset < bytes.length) {
    const written = await conn.write(bytes.subarray(offset));
    if (written <= 0) throw new Error("TCP write failed");
    offset += written;
  }
}

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/healthz")) {
    if (url.searchParams.get("tcp") === "1") {
      return (async () => {
        try {
          const ip = await resolvePublicIPv4("example.com");
          const conn = await Deno.connect({ hostname: ip, port: 80 });
          conn.close();
          return Response.json({ status: "ok", outboundTcp: true });
        } catch (error) {
          return Response.json({ status: "degraded", outboundTcp: false, error: String(error) }, { status: 503 });
        }
      })();
    }
    return Response.json({ status: "ok", transport: "wisp-tcp" });
  }
  if (!(req.headers.get("upgrade") || "").toLowerCase().includes("websocket")) {
    return new Response("Wisp WebSocket endpoint", { status: 426, headers: { "Upgrade": "websocket" } });
  }

  const { socket: ws, response } = Deno.upgradeWebSocket(req);
  const connections = new Map<number, { conn: Deno.Conn; writes: number; closed: boolean }>();
  let shuttingDown = false;

  const closeStream = (id: number, reason = 2, notify = true) => {
    const stream = connections.get(id);
    if (!stream) return;
    connections.delete(id);
    stream.closed = true;
    try { stream.conn.close(); } catch {}
    if (notify && ws.readyState === WebSocket.OPEN) {
      try { ws.send(makeClose(id, reason)); } catch {}
    }
  };

  ws.binaryType = "arraybuffer";
  ws.onopen = () => ws.send(makeContinue(0, 127));
  ws.onmessage = async (event) => {
    try {
      let bytes: Uint8Array;
      if (event.data instanceof ArrayBuffer) bytes = new Uint8Array(event.data);
      else if (event.data instanceof Blob) bytes = new Uint8Array(await event.data.arrayBuffer());
      else throw new Error("Wisp expects binary frames");
      await handleFrame(parseFrame(bytes));
    } catch (error) {
      console.error("Wisp frame error:", String(error));
      try { ws.close(1003, "Invalid Wisp frame"); } catch {}
    }
  };

  async function handleFrame(frame: { type: number; streamID: number; payload: Uint8Array }) {
    if (frame.type === PACKET.CONNECT) {
      if (connections.has(frame.streamID) || frame.payload.length < 4 || connections.size >= 64) {
        ws.send(makeClose(frame.streamID, 1));
        return;
      }
      const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
      const streamType = view.getUint8(0);
      const port = view.getUint16(1, true);
      const host = new TextDecoder().decode(frame.payload.subarray(3));
      if (streamType !== 1 || (port !== 80 && port !== 443)) {
        ws.send(makeClose(frame.streamID, 1));
        return;
      }
      try {
        const ip = await resolvePublicIPv4(host);
        const conn = await Deno.connect({ hostname: ip, port });
        const stream = { conn, writes: 0, closed: false };
        connections.set(frame.streamID, stream);
        (async () => {
          const buffer = new Uint8Array(16 * 1024);
          try {
            while (!stream.closed && !shuttingDown) {
              const n = await conn.read(buffer);
              if (n === null) break;
              if (ws.readyState !== WebSocket.OPEN) break;
              ws.send(makeFrame(PACKET.DATA, frame.streamID, buffer.slice(0, n)));
            }
          } catch (error) {
            console.error("TCP read failed:", String(error));
          } finally {
            if (connections.has(frame.streamID)) closeStream(frame.streamID, 2, true);
          }
        })();
      } catch (error) {
        console.warn("TCP connect rejected:", host, port, String(error));
        ws.send(makeClose(frame.streamID, 1));
      }
      return;
    }
    if (frame.type === PACKET.DATA) {
      const stream = connections.get(frame.streamID);
      if (!stream || stream.closed) return;
      try {
        await writeAll(stream.conn, frame.payload);
        stream.writes++;
        if (stream.writes >= 127) {
          stream.writes = 0;
          ws.send(makeContinue(frame.streamID, 127));
        }
      } catch {
        closeStream(frame.streamID, 1, true);
      }
      return;
    }
    if (frame.type === PACKET.CLOSE) closeStream(frame.streamID, 2, false);
  }

  ws.onclose = () => {
    shuttingDown = true;
    for (const id of [...connections.keys()]) closeStream(id, 2, false);
  };
  ws.onerror = () => {
    shuttingDown = true;
    for (const id of [...connections.keys()]) closeStream(id, 1, false);
  };
  return response;
});
