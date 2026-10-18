import { describe, it, expect } from "vitest";
import {
  parseWatermarkConfig,
  parsePreviewConfig,
  projectCreateSchema,
} from "@/lib/validation";

describe("config parsing", () => {
  it("falls back to defaults on invalid JSON", () => {
    const wm = parseWatermarkConfig("not json");
    expect(wm.style).toBe("diagonal");
    expect(wm.opacity).toBeGreaterThan(0);
    expect(wm.text.length).toBeGreaterThan(0);
  });

  it("parses stored config and clamps opacity via schema", () => {
    const wm = parseWatermarkConfig(JSON.stringify({ style: "center", opacity: 0.4, text: "HI" }));
    expect(wm.style).toBe("center");
    expect(wm.opacity).toBe(0.4);
    expect(wm.text).toBe("HI");
  });

  it("rejects out-of-range opacity and uses defaults", () => {
    const wm = parseWatermarkConfig(JSON.stringify({ opacity: 5 }));
    expect(wm.opacity).not.toBe(5);
  });

  it("defaults preview mode to links", () => {
    expect(parsePreviewConfig(null).mode).toBe("links");
  });
});

describe("projectCreateSchema", () => {
  it("accepts a minimal valid project", () => {
    const r = projectCreateSchema.safeParse({ name: "Acme" });
    expect(r.success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(projectCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });
  it("rejects an invalid environment", () => {
    expect(
      projectCreateSchema.safeParse({ name: "A", environment: "staging" }).success,
    ).toBe(false);
  });
});
