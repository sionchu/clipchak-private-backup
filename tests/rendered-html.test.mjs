import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

async function resolve(url) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${url}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/api/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the ClipChak landing page", async () => {
  const response = await render();
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /영상도 사진도/);
  assert.doesNotMatch(html, /유튜브|YouTube|youtube-video-download/i);
  assert.match(html, /틱톡/);
  assert.match(html, /스레드/);
  assert.match(html, /X\(트위터\)/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("renders every platform SEO page", async () => {
  for (const path of ["/tiktok-video-download", "/instagram-video-download", "/threads-video-download", "/linkedin-video-download", "/x-video-download", "/facebook-video-download", "/reddit-video-download", "/pinterest-video-download", "/naver-video-download", "/vimeo-video-download", "/dailymotion-video-download", "/twitch-clip-download", "/bluesky-video-download", "/tiktok-photo-download", "/threads-photo-download", "/linkedin-image-download", "/instagram-photo-download", "/x-photo-download"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /영상|사진|이미지|릴스/);
  }
});

test("publishes crawl metadata", async () => {
  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.doesNotMatch(xml, /youtube-video-download/);
  assert.match(xml, /threads-video-download/);
  assert.match(xml, /instagram-photo-download/);
  assert.match(xml, /naver-video-download/);
  assert.match(xml, /bluesky-video-download/);
});

test("rejects removed platform links and accepts direct signed media URLs", async () => {
  const removed = await resolve("https://www.youtube.com/watch?v=removed");
  assert.equal(removed.status, 400);

  const direct = await resolve("https://v16-webapp-prime.tiktok.com/video/file/?mime_type=video_mp4&signature=test");
  assert.equal(direct.status, 200);
  const result = await direct.json();
  assert.equal(result.direct, true);
  assert.equal(result.items[0].kind, "video");
});
