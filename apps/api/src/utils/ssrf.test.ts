import { describe, it, expect, afterEach } from "vitest";
import { assertPublicHost, assertPublicUrl, SsrfBlockedError } from "./ssrf.js";

describe("ssrf guard", () => {
  afterEach(() => {
    delete process.env.ALLOW_PRIVATE_TARGETS;
  });

  it("blocks IPv4 loopback", async () => {
    await expect(assertPublicHost("127.0.0.1")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("127.0.0.5")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("blocks RFC1918 private ranges", async () => {
    await expect(assertPublicHost("10.0.0.1")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("172.16.5.5")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("192.168.1.1")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("blocks the AWS/GCP metadata IP", async () => {
    await expect(assertPublicHost("169.254.169.254")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("blocks IPv6 loopback and link-local", async () => {
    await expect(assertPublicHost("::1")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("fe80::1")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("fc00::1")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("blocks IPv4-mapped IPv6 to private ranges", async () => {
    await expect(assertPublicHost("::ffff:127.0.0.1")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("::ffff:169.254.169.254")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("blocks suspicious hostnames without DNS", async () => {
    await expect(assertPublicHost("localhost")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("foo.localhost")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("bar.internal")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicHost("metadata.google.internal")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects non-http(s) URL schemes", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertPublicUrl("gopher://127.0.0.1/")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects malformed URLs", async () => {
    await expect(assertPublicUrl("not a url")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("bypasses the guard when ALLOW_PRIVATE_TARGETS=1", async () => {
    process.env.ALLOW_PRIVATE_TARGETS = "1";
    await expect(assertPublicHost("127.0.0.1")).resolves.toBeUndefined();
    await expect(assertPublicHost("169.254.169.254")).resolves.toBeUndefined();
  });
});
