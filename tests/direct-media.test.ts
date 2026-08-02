import assert from "node:assert/strict";
import test from "node:test";
import { isDirectOriginUrl } from "../app/lib/direct-media.ts";

const endpoint = "https://clipchak-direct-resolver.example/";

test("allows an origin CDN URL", () => {
  assert.equal(isDirectOriginUrl("https://cdn.example.net/video/file.mp4?token=abc", endpoint), true);
});

test("blocks resolver-origin and tunnel or proxy URLs", () => {
  assert.equal(isDirectOriginUrl("https://clipchak-direct-resolver.example/file.mp4", endpoint), false);
  assert.equal(isDirectOriginUrl("https://other.example/tunnel?id=1", endpoint), false);
  assert.equal(isDirectOriginUrl("https://other.example/api/proxy/file", endpoint), false);
  assert.equal(isDirectOriginUrl("https://other.example/%74unnel/file", endpoint), false);
});

test("blocks malformed and non-http URLs", () => {
  assert.equal(isDirectOriginUrl("not-a-url", endpoint), false);
  assert.equal(isDirectOriginUrl("data:video/mp4;base64,AAAA", endpoint), false);
});
