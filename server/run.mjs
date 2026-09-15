// Always-on supervisor for the home-PC deployment (plan §9 "집 PC 상주").
//
// The host decision is "keep the PC on" — so the one thing that must not happen is: the process
// crashes at 3am and stays down. This supervisor spawns the host as a child and respawns it on any
// unexpected exit, with exponential backoff. A tight crash-loop (many failures inside a short
// window) is capped so a genuinely broken build fails loud instead of pinning the CPU forever.
// A clean operator shutdown (SIGINT/SIGTERM) stops the child and does NOT respawn.
//
// Portability (plan §8): no absolute paths. The entry script defaults to ./host.mjs beside this
// file and can be overridden with ERA_SUPERVISOR_ENTRY (used by the headless test to point at a
// throwaway child). Everything the host needs still comes from config.mjs / env.
//
//   node server/run.mjs        # supervise host.mjs forever (restart on crash)
//
// Tunables (env):
//   ERA_SUPERVISOR_ENTRY        entry script to run with `node` (default: ./host.mjs)
//   ERA_SUPERVISOR_BACKOFF_MS   base backoff, doubled each consecutive fast failure (default 1000)
//   ERA_SUPERVISOR_MAX_BACKOFF_MS  backoff ceiling (default 30000)
//   ERA_SUPERVISOR_HEALTHY_MS   uptime after which a run counts as "healthy" and resets backoff (default 10000)
//   ERA_SUPERVISOR_MAX_FAST_FAILS  consecutive sub-healthy failures before giving up (default 8)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const entry = process.env.ERA_SUPERVISOR_ENTRY?.trim()
  || fileURLToPath(new URL('./host.mjs', import.meta.url));
const baseBackoff = Number(process.env.ERA_SUPERVISOR_BACKOFF_MS ?? 1000);
const maxBackoff = Number(process.env.ERA_SUPERVISOR_MAX_BACKOFF_MS ?? 30000);
const healthyMs = Number(process.env.ERA_SUPERVISOR_HEALTHY_MS ?? 10000);
const maxFastFails = Number(process.env.ERA_SUPERVISOR_MAX_FAST_FAILS ?? 8);

let stopping = false;
let child = null;
let fastFails = 0;
let timer = null;

function log(msg) { console.log(`[run ${new Date().toISOString()}] ${msg}`); }

function start() {
  const startedAt = Date.now();
  log(`starting: node ${entry}`);
  child = spawn(process.execPath, [entry], { stdio: 'inherit', env: process.env });

  child.on('exit', (code, signal) => {
    child = null;
    const uptime = Date.now() - startedAt;
    const how = signal ? `signal ${signal}` : `code ${code}`;
    if (stopping) { log(`child exited (${how}) during shutdown; not restarting.`); return; }

    if (uptime >= healthyMs) {
      fastFails = 0;              // ran long enough to be considered healthy; reset the loop guard
    } else {
      fastFails += 1;
    }

    if (fastFails > maxFastFails) {
      log(`child exited (${how}) after ${uptime}ms; ${fastFails} fast failures in a row exceeds ` +
          `ERA_SUPERVISOR_MAX_FAST_FAILS=${maxFastFails}. Giving up so the failure is loud.`);
      process.exit(1);
      return;
    }

    const backoff = fastFails === 0
      ? baseBackoff
      : Math.min(maxBackoff, baseBackoff * 2 ** (fastFails - 1));
    log(`child exited (${how}) after ${uptime}ms; restarting in ${backoff}ms (fast-fail ${fastFails}/${maxFastFails}).`);
    // NOTE: do NOT unref this timer. The supervisor's whole job is to stay alive until the restart
    // fires; unref'ing it would let the event loop drain and the supervisor would quit instead of
    // respawning. Clean shutdown cancels it explicitly in shutdown().
    timer = setTimeout(start, backoff);
  });

  child.on('error', (err) => { log(`failed to spawn child: ${err.message}`); });
}

function shutdown(sig) {
  if (stopping) return;
  stopping = true;
  log(`received ${sig}; stopping supervisor and child.`);
  if (timer) clearTimeout(timer);
  if (child) child.kill(sig === 'SIGINT' ? 'SIGINT' : 'SIGTERM');
  else process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
