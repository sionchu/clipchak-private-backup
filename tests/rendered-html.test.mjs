import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the ClipChak landing page", async () => {
  const response = await render();
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /영상도 사진도/);
  assert.match(html, /유튜브/);
  assert.match(html, /스레드/);
  assert.match(html, /링크드인/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("renders every platform SEO page", async () => {
  for (const path of ["/youtube-video-download", "/tiktok-video-download", "/threads-video-download", "/linkedin-video-download", "/instagram-video-download", "/tiktok-photo-download", "/threads-photo-download", "/linkedin-image-download", "/instagram-photo-download"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /영상|사진|이미지|릴스/);
  }
});

test("publishes crawl metadata", async () => {
  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.match(xml, /youtube-video-download/);
  assert.match(xml, /threads-video-download/);
  assert.match(xml, /instagram-photo-download/);
});
