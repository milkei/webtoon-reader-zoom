import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const browsers = ['chromium', 'firefox'];
const files = ['content.js', 'toolbar.js', 'popup.js', 'popup.html'];

for (const browser of browsers) {
  const dir = join(root, 'extension', browser);
  for (const file of files) {
    assert.ok(existsSync(join(dir, file)), `Missing ${browser}/${file}`);
    if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', join(dir, file)]);
  }
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '0.5.0');
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://comic.naver.com/*']);
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js', 'toolbar.js']);
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.ok(!manifest.host_permissions, 'Host permissions not expected');
  assert.equal(Boolean(manifest.browser_specific_settings), browser === 'firefox');
  for (const name of Object.values(manifest.icons)) assert.ok(existsSync(join(dir, name)), `Missing icon ${name}`);
  const popup = readFileSync(join(dir, 'popup.html'), 'utf8');
  assert.match(popup, /<script src="popup\.js"><\/script>/);
  assert.doesNotMatch(popup, /<script[^>]*src="https?:/);
  const toolbar = readFileSync(join(dir, 'toolbar.js'), 'utf8');
  for (const pct of [25, 50, 75, 100]) assert.ok(toolbar.includes(`data-percent="${pct}"`), `Missing preset ${pct}`);
  assert.match(toolbar, /attachShadow\(\{ mode: 'open' \}\)/);
}
assert.equal(readFileSync(join(root,'extension','chromium','toolbar.js'), 'utf8'), readFileSync(join(root,'extension','firefox','toolbar.js'),'utf8'));
assert.equal(readFileSync(join(root,'extension','chromium','popup.html'), 'utf8'), readFileSync(join(root,'extension','firefox','popup.html'),'utf8'));
console.log('OK: JS syntax, manifests, assets, page toolbar, and shared files');
