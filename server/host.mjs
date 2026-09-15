// S3 host entry point: the actual runnable server. It wires the pieces verified headlessly in
// S1/S2 into one process — load the real game source off disk, compile it, and expose the
// server-authoritative session over WebSocket while serving the thin client shell from the SAME
// origin so a phone loads the page and the socket from one tunnel/wss host (plan §3, §9, §10-4).
//
// Portability (plan §8): every path/binding comes from config.mjs (env with repo-relative defaults),
// so relocating the server is a folder copy + env change, never a code edit. No absolute paths here.
//
//   node server/host.mjs                     # local, 127.0.0.1:8787, thin client at http://127.0.0.1:8787/
//   ERA_SERVER_HOST=0.0.0.0 ERA_SERVER_TOKEN=... node server/host.mjs   # reachable via overlay/tunnel
//
// If the real game folder is absent (a fresh checkout on another machine), it falls back to the
// neutral fixture so the host still boots and the thin client can be exercised.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { loadConfig } from './config.mjs';
import { loadGameSource } from './game-source.mjs';
import { createSaveStore } from './save-store.mjs';
import { createWsServer } from './ws-server.mjs';

const config = loadConfig();
const staticDir = fileURLToPath(new URL('./public', import.meta.url));

// Game directory: explicit env wins; otherwise the tracked '에라마왕 개조판 1.28' beside the repo root.
const gameDir = process.env.ERA_SERVER_GAME_DIR?.trim()
  || fileURLToPath(new URL('../에라마왕 개조판 1.28', import.meta.url));

async function resolveSource() {
  try {
    const { files, counts, totalBytes } = await loadGameSource(gameDir);
    console.log(`[host] loaded real game: ${files.size} files, ${(totalBytes / 1048576).toFixed(2)} MiB from ${gameDir}`);
    console.log(`[host] source counts:`, counts);
    return files;
  } catch (error) {
    // Portability fallback: boot on the neutral fixture so the transport/client can still be run.
    const { files } = await import('../tools/web-engine-probe/fixture.mjs');
    console.warn(`[host] real game unavailable (${error.message}); falling back to the neutral fixture.`);
    return files;
  }
}

const source = await resolveSource();

const server = createWsServer({
  compile,
  source,
  // Single user: all sessions share one save folder (config.dataDir); a reconnect resumes the live
  // in-memory session, and a fresh session reloads whatever is on disk.
  createStore: () => createSaveStore(config.dataDir),
  config,
  staticDir
});

server.listen(config.port, config.host, () => {
  const shown = config.host === '0.0.0.0' ? '<this-host>' : config.host;
  console.log(`[host] thin client + WS on http://${shown}:${config.port}/`);
  console.log(`[host] saves: ${config.dataDir}`);
  if (!config.token && config.host !== '127.0.0.1')
    console.warn('[host] WARNING: bound beyond localhost with no ERA_SERVER_TOKEN — set one before exposing (plan §4/§7).');
});

const shutdown = () => { console.log('\n[host] shutting down…'); server.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
