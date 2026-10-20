import { describe, it, expect } from "vitest";
import { isPublicHttpUrl } from "@/lib/safe-url";

describe("isPublicHttpUrl", () => {
  it("accepts ordinary public sites", () => {
    expect(isPublicHttpUrl("https://mm-eight-bay.vercel.app/")).not.toBeNull();
    expect(isPublicHttpUrl("http://client.com/path?q=1")).not.toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(isPublicHttpUrl("file:///etc/passwd")).toBeNull();
    expect(isPublicHttpUrl("ftp://client.com")).toBeNull();
    expect(isPublicHttpUrl("not a url")).toBeNull();
  });

  it("rejects local and private network addresses", () => {
    for (const u of [
      "http://localhost:3000",
      "http://app.localhost",
      "http://127.0.0.1",
      "http://10.0.0.5",
      "http://192.168.1.1",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://printer.local",
      "http://metadata.internal",
      "http://intranet",
    ]) {
      expect(isPublicHttpUrl(u), u).toBeNull();
    }
  });

  it("does not over-block public 172.x addresses", () => {
    expect(isPublicHttpUrl("http://172.32.0.1")).not.toBeNull();
  });
});
