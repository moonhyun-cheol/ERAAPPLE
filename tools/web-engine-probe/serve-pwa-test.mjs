import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createStaticServer } from './serve-pwa.mjs';

const approved = 'https://approved.example';
for (const publicOrigin of [undefined, approved]) {
  test(`preview boundary: ${publicOrigin ?? 'local only'}`, async () => {
    const server = createStaticServer(undefined, '/iphone-test/', { publicOrigin });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = server.address().port;
    const local = `http://127.0.0.1:${port}`;
    const request = (headers = {}, path = '/iphone-test/browser.js', method = 'GET') => new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, res => {
        res.resume(); res.on('end', () => resolve(res.statusCode));
      });
      req.on('error', reject); req.end();
    });
    try {
      assert.equal(await request(), 200);
      assert.equal(await request({ Origin: local }), 200);
      assert.equal(await request({ Origin: approved }), publicOrigin ? 200 : 403);
      for (const Origin of ['', 'null', 'https://evil.example', approved + '.evil.example', approved + '/', 'http://approved.example', approved + ':443', `${approved}, ${local}`]) {
        assert.equal(await request({ Origin }), 403, Origin);
      }
      assert.equal(await request({ Host: 'evil.example', Origin: local }), 403);
      assert.equal(await request({ Origin: 'https://evil.example', 'X-Forwarded-Host': 'approved.example', 'X-Forwarded-Proto': 'https' }), 403);
      assert.equal(await request({}, '/iphone-test/browser.js', 'POST'), 405);
      assert.equal(await request({}, '/iphone-test/browser.js', 'HEAD'), 200);
      for (const path of ['/ERB/', '/iphone-test/../ERB/', '/iphone-test/%2e%2e/ERB/', '/iphone-test/.my_agent_remote/', '/iphone-test/emuera.config']) {
        assert.equal(await request({}, path), 404, path);
      }
    } finally {
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
  });
}
test('invalid public origin configuration fails closed', () => {
  for (const publicOrigin of ['', '*', 'null', 'http://approved.example', approved + '/', approved + '/path', approved + '?q=1', 'https://user:pass@approved.example']) {
    assert.throws(() => createStaticServer(undefined, undefined, { publicOrigin }));
  }
});