import { describe, expect, it } from "vitest";
import { mewmap } from "./index.js";

describe("mewmap", () => {
  it("should be a function", () => {
    expect(typeof mewmap).toBe("function");
  });
});
