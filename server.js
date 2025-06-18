
const WebSocket = require('ws');
const url = require('url');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const clients = {};

function getPeerIDFromURL(reqUrl) {
  const query = url.parse(reqUrl, true).query;
  return query.peerid || null;
}

wss.on('connection', (ws, req) => {
  const peerID = getPeerIDFromURL(req.url);
  if (!peerID) return ws.close();

  console.log("✅ Peer connected:", peerID);
  clients[peerID] = ws;

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      const target = clients[data.to];
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify(data));
        console.log(`➡️ ${data.from} ➡️ ${data.to}: ${data.text}`);
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  ws.on('close', () => {
    delete clients[peerID];
    console.log("❌ Peer disconnected:", peerID);
  });
});

console.log(`🚀 PeerChat WebSocket Server running on port ${PORT}`);
