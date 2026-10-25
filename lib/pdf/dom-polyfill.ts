/**
 * Pure-JS DOM globals that pdfjs-dist touches at module-evaluation time.
 *
 * pdfjs normally borrows DOMMatrix/Path2D/ImageData from the optional
 * @napi-rs/canvas package. That native dependency is not traced into the
 * Vercel serverless bundle (it is loaded through a try/catch require), so
 * importing pdf-parse there throws `ReferenceError: DOMMatrix is not defined`
 * and takes down the whole function before any route code runs.
 *
 * Server-side usage is text extraction only — never canvas rendering — so
 * Path2D/ImageData only need to exist, while DOMMatrix implements the 2D
 * affine operations pdfjs actually calls (translate/scale/multiply/invert
 * and the a..f components).
 *
 * Every global is installed only when missing, so a real browser
 * implementation or a successfully loaded native canvas always wins.
 */

type MatrixInit = number[] | { a: number; b: number; c: number; d: number; e: number; f: number };

class AffineDOMMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(init?: MatrixInit | AffineDOMMatrix) {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;

    if (init === undefined) return;

    if (Array.isArray(init)) {
      if (init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      } else if (init.length === 16) {
        // Column-major 4x4, matching the DOMMatrix spec.
        this.a = init[0];
        this.b = init[1];
        this.c = init[4];
        this.d = init[5];
        this.e = init[12];
        this.f = init[13];
      } else {
        throw new TypeError("DOMMatrix: expected a 6- or 16-element array");
      }
    } else if (typeof init === "object") {
      ({ a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f } = init);
    }
  }

  get is2D(): boolean {
    return true;
  }

  get isIdentity(): boolean {
    return (
      this.a === 1 &&
      this.b === 0 &&
      this.c === 0 &&
      this.d === 1 &&
      this.e === 0 &&
      this.f === 0
    );
  }

  // Column-major 4x4 component aliases used by the DOMMatrix interface.
  get m11(): number {
    return this.a;
  }
  get m12(): number {
    return this.b;
  }
  get m21(): number {
    return this.c;
  }
  get m22(): number {
    return this.d;
  }
  get m41(): number {
    return this.e;
  }
  get m42(): number {
    return this.f;
  }

  translate(tx = 0, ty = 0): this {
    this.e += this.a * tx + this.c * ty;
    this.f += this.b * tx + this.d * ty;
    return this;
  }

  scale(sx: number, sy: number = sx): this {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
    return this;
  }

  rotate(degrees = 0): this {
    const cos = Math.cos((degrees * Math.PI) / 180);
    const sin = Math.sin((degrees * Math.PI) / 180);
    const { a, b, c, d } = this;
    this.a = a * cos + c * sin;
    this.b = b * cos + d * sin;
    this.c = c * cos - a * sin;
    this.d = d * cos - b * sin;
    return this;
  }

  /** Post-multiply: this = this × other. */
  multiplySelf(other: AffineDOMMatrix): this {
    const { a, b, c, d, e, f } = this;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }

  /** Pre-multiply: this = other × this. */
  preMultiplySelf(other: AffineDOMMatrix): this {
    const { a, b, c, d, e, f } = this;
    this.a = other.a * a + other.c * b;
    this.b = other.b * a + other.d * b;
    this.c = other.a * c + other.c * d;
    this.d = other.b * c + other.d * d;
    this.e = other.a * e + other.c * f + other.e;
    this.f = other.b * e + other.d * f + other.f;
    return this;
  }

  invertSelf(): this {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) {
      throw new DOMException("The matrix is not invertible.", "InvalidStateError");
    }
    const { a, b, c, d, e, f } = this;
    this.a = d / det;
    this.b = -b / det;
    this.c = -c / det;
    this.d = a / det;
    this.e = (c * f - d * e) / det;
    this.f = (b * e - a * f) / det;
    return this;
  }

  toFloat64Array(): Float64Array {
    // Column-major 4x4, per the DOMMatrix spec.
    return Float64Array.from([
      this.a, this.b, 0, 0,
      this.c, this.d, 0, 0,
      0, 0, 1, 0,
      this.e, this.f, 0, 1,
    ]);
  }
}

/** Minimal Path2D stand-in: pdfjs only builds paths during canvas rendering. */
class StubPath2D {
  addPath(): void {}
  moveTo(): void {}
  lineTo(): void {}
  bezierCurveTo(): void {}
  quadraticCurveTo(): void {}
  closePath(): void {}
  rect(): void {}
  ellipse(): void {}
  arc(): void {}
  arcTo(): void {}
  roundRect(): void {}
}

/** Minimal ImageData stand-in (pixel rendering is never used server-side). */
class StubImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    dataOrWidth: Uint8ClampedArray | number,
    width?: number,
    height?: number,
  ) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = height ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = dataOrWidth;
      this.width = width ?? 0;
      this.height = height ?? Math.floor(this.data.length / 4 / Math.max(this.width, 1));
    }
    this.colorSpace = "srgb";
  }
}

const globals = globalThis as Record<string, unknown>;
if (!globals.DOMMatrix) globals.DOMMatrix = AffineDOMMatrix;
if (!globals.Path2D) globals.Path2D = StubPath2D;
if (!globals.ImageData) globals.ImageData = StubImageData;

export { AffineDOMMatrix };
