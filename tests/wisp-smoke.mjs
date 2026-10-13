import assert from "node:assert/strict";
import WebSocket from "ws";

const endpoint = "wss://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/";
const ws = new WebSocket(endpoint);
ws.binaryType = "nodebuffer";

const timeout = setTimeout(() => {
  console.error("Timed out waiting for Wisp TCP response");
  ws.terminate();
  process.exitCode = 1;
}, 20000);

let connected = false;
let succeeded = false;
let response = Buffer.alloc(0);
ws.on("open", () => console.log("Wisp WebSocket connected."));
ws.on("error", (error) => {
  console.error("Wisp WebSocket error:", error.message);
  clearTimeout(timeout);
  process.exitCode = 1;
});
ws.on("message", (raw) => {
  const packet = Buffer.from(raw);
  if (packet.length < 5) return;
  const type = packet.readUInt8(0);
  const streamId = packet.readUInt32LE(1);
  if (succeeded) return;
  if (type === 3 && streamId === 0 && !connected) {
    connected = true;
    const hostname = Buffer.from("example.com");
    const payload = Buffer.alloc(3 + hostname.length);
    payload.writeUInt8(1, 0);
    payload.writeUInt16LE(80, 1);
    hostname.copy(payload, 3);
    const header = Buffer.alloc(5);
    header.writeUInt8(1, 0);
    header.writeUInt32LE(1, 1);
    ws.send(Buffer.concat([header, payload]));
    setTimeout(() => {
      const request = Buffer.from("GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n");
      const dataHeader = Buffer.alloc(5);
      dataHeader.writeUInt8(2, 0);
      dataHeader.writeUInt32LE(1, 1);
      ws.send(Buffer.concat([dataHeader, request]));
    }, 250);
    return;
  }
  if (streamId === 1 && type === 4) {
    if (succeeded) return;
    console.error("Wisp TCP connect was rejected.");
    clearTimeout(timeout);
    ws.close();
    process.exitCode = 1;
    return;
  }
  if (streamId === 1 && type === 2) {
    response = Buffer.concat([response, packet.subarray(5)]);
    if (response.includes(Buffer.from("HTTP/1."))) {
      try {
        assert.match(response.toString("latin1"), /HTTP\/1\.[01] \d{3}/);
        succeeded = true;
        console.log("Wisp TCP smoke test passed:", response.toString("latin1").split("\r\n")[0]);
        clearTimeout(timeout);
        ws.close();
      } catch (error) {
        console.error(error);
        clearTimeout(timeout);
        process.exitCode = 1;
        ws.terminate();
      }
    }
  }
});
