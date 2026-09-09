# Local PWA preview verification

- URL: http://127.0.0.1:4175/iphone-test/
- Started with normal Node.js process, PID 42972 at launch.
- No antivirus settings, exclusions, execution policy, or firewall settings changed.
- Port 4174 was occupied; /iphone-test/ returned 404 there. Existing processes were left running.
- `node tools/web-engine-probe/check-preview.mjs` passed: index.html, pwa-build.json and sw.js all returned HTTP 200 and matched local pwa-dist bytes exactly.
- Release: f771a86b4ce95bb71926
- This verifies local HTTP serving only, not a new browser gameplay test or iPhone access.
- Loopback-only preview. No public HTTPS deployment performed.
- The cause of the earlier AhnLab warning is still unconfirmed.
