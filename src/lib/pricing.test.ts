import { describe, expect, it } from "vitest";
import { breakPrice, bestMethod, nextBreak, quote, savings, SCREEN_BREAKS } from "./pricing";
import type { Design, Member } from "./types";

const members = (n: number): Member[] =>
  Array.from({ length: n }, (_, i) => ({ id: String(i), name: `P${i}`, number: String(i), size: "M" }));

const base: Design = {
  garment: "tee", shirtColor: "#1d3557", graphic: "robot", teamName: "Gear Up",
  frontInks: ["#ffffff", "#f6b83f"], backStyle: "none", slogan: "", backInk: "#ffffff", members: members(24),
};

describe("breakPrice", () => {
  it("uses the highest break reached", () => {
    expect(breakPrice(SCREEN_BREAKS, 12)).toBe(3.0);
    expect(breakPrice(SCREEN_BREAKS, 30)).toBe(2.2);
    expect(breakPrice(SCREEN_BREAKS, 100)).toBe(1.2);
  });
});

describe("bestMethod", () => {
  it("uses DTG below the screen printing minimum", () => {
    expect(bestMethod(2, 8).method).toBe("dtg");
  });
  it("uses screen printing for bigger simple orders", () => {
    expect(bestMethod(1, 48).method).toBe("screen");
  });
});

describe("quote", () => {
  it("adds garment, setup and print costs correctly", () => {
    const q = quote(base, 24);
    // front: 2 colours screen = setup 80, 2 x 2.20 = 4.40 per shirt; tee 15
    expect(q.locations[0]).toMatchObject({ method: "screen", setup: 80, perShirt: 4.4 });
    expect(q.total).toBeCloseTo(80 + (15 + 4.4) * 24, 2);
    expect(q.eachAllIn).toBeCloseTo(q.total / 24, 2);
  });
  it("charges names per shirt", () => {
    const q = quote({ ...base, backStyle: "names" }, 24);
    expect(q.namesEach).toBe(8);
  });
  it("is zero for zero shirts", () => {
    expect(quote(base, 0).total).toBe(0);
  });
  it("prices a blank shirt as garment only", () => {
    const q = quote({ ...base, graphic: "none", teamName: "" }, 12);
    expect(q.locations).toHaveLength(0);
    expect(q.total).toBe(15 * 12);
  });
});

describe("savings", () => {
  it("finds fewer ink colours as a saving", () => {
    const s = savings(base, 24);
    expect(s.find((x) => x.id === "fewer-inks")?.saves).toBeGreaterThan(0);
  });
  it("lists the biggest saving first", () => {
    const s = savings({ ...base, garment: "hoodie", backStyle: "names" }, 24);
    for (let i = 1; i < s.length; i++) expect(s[i - 1].saves).toBeGreaterThanOrEqual(s[i].saves);
  });
});

describe("nextBreak", () => {
  it("suggests reaching the next price break when it lowers the price per shirt", () => {
    const nb = nextBreak(base, 20);
    expect(nb?.atQty).toBe(24);
    expect(nb!.eachAllIn).toBeLessThan(nb!.eachNow);
  });
});
