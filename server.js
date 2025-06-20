const WebSocket = require('ws');
const url = require('url');

// Dynamic port for Render
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const clients = {};

// Extract peer ID from query params
function getPeerIDFromURL(reqUrl) {
  const query = url.parse(reqUrl, true).query;
  return query.peerid || null;
}

// Handle new connection
wss.on('connection', (ws, req) => {
  const peerID = getPeerIDFromURL(req.url);
  if (!peerID) {
    console.warn("⚠️ Connection attempted without peerID. Connection closed.");
    return ws.close();
  }

  console.log("✅ Peer connected:", peerID);
  clients[peerID] = ws;

  // Handle messages
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      const { from, to, text } = data;

      if (!from || !to || !text) {
        console.warn("⚠️ Incomplete message received:", data);
        return;
      }

      const target = clients[to];
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify(data));
        console.log(`➡️ Message: ${from} ➡️ ${to} | Text: ${text}`);
      } else {
        console.warn(`⚠️ Target peer '${to}' is not connected.`);
      }

    } catch (err) {
      console.error("❌ Invalid message format:", err.message);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    delete clients[peerID];
    console.log("❌ Peer disconnected:", peerID);
  });

  // Optional: Handle ping/pong manually if needed
  ws.on('error', (err) => {
    console.error("❌ WebSocket error:", err.message);
  });
});

// Optional: Keep-alive ping to prevent Render shutdown
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000); // every 30 seconds

console.log(`🚀 PeerChat WebSocket Server running on port ${PORT}`);

