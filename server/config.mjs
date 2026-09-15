// Server-authoritative runtime configuration (S1).
// See docs/web-runtime/server-runtime-plan.md §8 (portability) and §10 (git/deploy fit).
//
// Portability rule (§8-1,2): NO hardcoded absolute paths. Every path and network binding is read
// from the environment with a repo-relative default, so moving the server to another PC/VPS is a
// folder copy + env change — never a code edit. Secrets/state live under server-config/ and
// server-data/, which .gitignore keeps out of the public `main` Pages line (§10-3, §11).
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Repo root = parent of this server/ directory. Used only to resolve *default* locations; any
// value can be overridden by env so the resolved paths never depend on where the repo is checked
// out. ERA_SERVER_ROOT lets a deployment relocate all state to a single external folder.
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function resolveDir(envValue, fallbackName, base) {
  if (envValue && envValue.trim()) return path.resolve(envValue.trim());
  return path.join(base, fallbackName);
}

export function loadConfig(env = process.env) {
  const base = env.ERA_SERVER_ROOT && env.ERA_SERVER_ROOT.trim()
    ? path.resolve(env.ERA_SERVER_ROOT.trim())
    : repoRoot;
  const port = Number(env.ERA_SERVER_PORT ?? 8787);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('ERA_SERVER_PORT must be a valid port');
  return {
    base,
    // 127.0.0.1 by default: never expose a public port implicitly. Public reach is a deliberate
    // choice via a private overlay / tunnel (plan §9, §12), not an accidental 0.0.0.0 bind.
    host: (env.ERA_SERVER_HOST ?? '127.0.0.1').trim(),
    port,
    // Single-user access token (plan §4, §7). Absent = local-only development; a network-reachable
    // deployment must set it (enforced by the gateway in a later layer, not here).
    token: env.ERA_SERVER_TOKEN?.trim() || null,
    dataDir: resolveDir(env.ERA_SERVER_DATA_DIR, 'server-data', base),   // saves (§8-1,4)
    configDir: resolveDir(env.ERA_SERVER_CONFIG_DIR, 'server-config', base),
    gamesDir: resolveDir(env.ERA_SERVER_GAMES_DIR, 'games', base)        // game bin, read locally (§10-4)
  };
}
