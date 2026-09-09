# iPhone temporary HTTPS test connection

URL: https://train-pens-raised-parade.trycloudflare.com/iphone-test/

- Release: `deff12b426ac925e946c` (compressed save backup/restore)
- Local server: `http://127.0.0.1:4175/iphone-test/`
- Current release verification: public URL WebKit mobile test passed offline preparation, mode → continue → difficulty, settings progression and automatic scrolling. See `mobile-wait-public.json`. Server boundary tests, Edge PWA lifecycle/save restore and WebKit server-stop save restore also passed. Automated WebKit is not a physical iPhone test.
- Cloudflared PID at launch: `41344` (check identity before stopping; PIDs may be reused).
- User approved public access via a third-party temporary tunnel.
- External verification: root and 12 files returned HTTP 200; file SHA-256 hashes matched local PWA output. See `https-tunnel-verification.json`.
- The user reported actual iPhone gameplay, save/load and offline execution success. The new backup/download/share/file-picker flow still needs physical iPhone testing; Edge and desktop WebKit backup tests passed.

Open the URL in iPhone Safari, use Share > Add to Home Screen, then open the home-screen app. Expand the iPhone/offline instructions and press the offline preparation button. Keep the PC and tunnel running until preparation completes. Start the actual game and use only test saves. After saving, close the app and test reopening with airplane mode enabled and Wi-Fi disabled.

This is a temporary public URL, not permanent hosting. It may change on restart. Saves belong to this origin; compressed backup/export and restore are now available. See [backup instructions](../../../docs/web-runtime/save-backup.md). Do not clear site data. Anyone with the link can download the served game files.
