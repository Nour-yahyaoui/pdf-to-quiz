import { describe, expect, it } from "vitest";
import "@/lib/pdf/dom-polyfill";

const globals = globalThis as Record<string, unknown>;

describe("pdf DOM polyfill", () => {
  it("installs the missing DOM globals", () => {
    expect(globals.DOMMatrix).toBeTypeOf("function");
    expect(globals.Path2D).toBeTypeOf("function");
    expect(globals.ImageData).toBeTypeOf("function");
  });

  it("builds an identity matrix by default", () => {
    const Matrix = globals.DOMMatrix as new () => {
      a: number;
      b: number;
      c: number;
      d: number;
      e: number;
      f: number;
      isIdentity: boolean;
    };
    const m = new Matrix();
    expect([m.a, m.b, m.c, m.d, m.e, m.f]).toEqual([1, 0, 0, 1, 0, 0]);
    expect(m.isIdentity).toBe(true);
  });

  it("accepts the 6-element affine form pdfjs constructs", () => {
    const Matrix = globals.DOMMatrix as new (init: number[]) => {
      a: number;
      b: number;
      c: number;
      d: number;
      e: number;
      f: number;
    };
    const m = new Matrix([2, 0, 0, 3, 10, 20]);
    expect([m.a, m.b, m.c, m.d, m.e, m.f]).toEqual([2, 0, 0, 3, 10, 20]);
  });

  it("translates and scales using the affine formulas pdfjs relies on", () => {
    const Matrix = globals.DOMMatrix as new (init?: number[]) => {
      a: number;
      b: number;
      c: number;
      d: number;
      e: number;
      f: number;
      translate(tx: number, ty: number): unknown;
      scale(sx: number, sy?: number): unknown;
    };
    const m = new Matrix().translate(5, 7).scale(2, 4);
    expect([m.a, m.b, m.c, m.d, m.e, m.f]).toEqual([2, 0, 0, 4, 5, 7]);
  });

  it("inverts and restores the original matrix on a round trip", () => {
    const Matrix = globals.DOMMatrix as new (init: number[]) => {
      a: number;
      b: number;
      c: number;
      d: number;
      e: number;
      f: number;
      invertSelf(): {
        multiplySelf(other: unknown): { a: number; b: number; c: number; d: number; e: number; f: number };
      };
    };
    const original = [2, 0.5, 0.25, 3, 8, -4];
    const inverse = new Matrix(original).invertSelf();
    const restored = inverse.multiplySelf(new Matrix(original));
    expect(restored.a).toBeCloseTo(1);
    expect(restored.d).toBeCloseTo(1);
    expect(restored.b).toBeCloseTo(0);
    expect(restored.c).toBeCloseTo(0);
    expect(restored.e).toBeCloseTo(0);
    expect(restored.f).toBeCloseTo(0);
  });
});
