import 'dotenv/config';
import { httpServer } from './api/server.js';

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║      On-chain Security Guardian  –  Backend       ║
╠═══════════════════════════════════════════════════╣
║  HTTP  →  http://localhost:${PORT}                   ║
║  WS    →  ws://localhost:${PORT}                     ║
╚═══════════════════════════════════════════════════╝
`);
});
