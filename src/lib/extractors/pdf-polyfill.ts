// pdf-parse v2 → pdfjs-dist references DOMMatrix/Path2D at module evaluation.
// Node.js serverless (Vercel) has no DOM globals, so we stub the minimal surface
// pdfjs needs for text-only extraction (no rendering).

type MatrixCtor = new (init?: unknown) => object;

declare global {
  var DOMMatrix: MatrixCtor | undefined;
  var Path2D: (new () => object) | undefined;
  var ImageData:
    | (new (data: Uint8ClampedArray, w: number, h?: number) => object)
    | undefined;
}

if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixStub {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m21 = 0;
    m22 = 1;
    m41 = 0;
    m42 = 0;
    constructor(_init?: unknown) {}
    multiply(): this {
      return this;
    }
    inverse(): this {
      return this;
    }
    translate(): this {
      return this;
    }
    scale(): this {
      return this;
    }
    rotate(): this {
      return this;
    }
    transformPoint(p: unknown) {
      return p;
    }
  }
  globalThis.DOMMatrix = DOMMatrixStub as unknown as MatrixCtor;
}

if (typeof globalThis.Path2D === "undefined") {
  class Path2DStub {
    addPath() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
  }
  globalThis.Path2D = Path2DStub as unknown as new () => object;
}

if (typeof globalThis.ImageData === "undefined") {
  class ImageDataStub {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, w: number, h = 0) {
      this.data = data;
      this.width = w;
      this.height = h || data.length / (4 * w);
    }
  }
  globalThis.ImageData = ImageDataStub as unknown as new (
    data: Uint8ClampedArray,
    w: number,
    h?: number
  ) => object;
}

export {};
