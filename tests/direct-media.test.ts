import assert from "node:assert/strict";
import test from "node:test";
import { isDirectOriginUrl, isSignedResolverDownloadUrl } from "../app/lib/direct-media.ts";

const endpoint = "https://clipchak-direct-resolver.example/";

test("allows an origin CDN URL", () => {
  assert.equal(isDirectOriginUrl("https://cdn.example.net/video/file.mp4?token=abc", endpoint), true);
  assert.equal(isDirectOriginUrl("https://scontent.example.net/gallery/photo-01.jpg?token=abc", endpoint), true);
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

test("only allows signed resolver download routes for the YouTube relay", () => {
  const ticket = "a".repeat(60);
  assert.equal(isSignedResolverDownloadUrl(`${endpoint}download?ticket=${ticket}`, endpoint), true);
  assert.equal(isSignedResolverDownloadUrl(`${endpoint}download?ticket=short`, endpoint), false);
  assert.equal(isSignedResolverDownloadUrl(`${endpoint}proxy?ticket=${ticket}`, endpoint), false);
  assert.equal(isSignedResolverDownloadUrl(`https://other.example/download?ticket=${ticket}`, endpoint), false);
});
