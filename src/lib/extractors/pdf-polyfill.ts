// pdf-parse v2 → pdfjs-dist references DOMMatrix/Path2D at module evaluation.
// Node.js serverless (Vercel) has no DOM globals, so we stub the minimal surface
// pdfjs needs for text-only extraction (no rendering).
// DOMMatrix etc. are already typed via lib.dom.d.ts — we just assign at runtime.

const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.DOMMatrix === "undefined") {
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
    multiply() {
      return this;
    }
    inverse() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
    transformPoint(p: unknown) {
      return p;
    }
  }
  g.DOMMatrix = DOMMatrixStub;
}

if (typeof g.Path2D === "undefined") {
  class Path2DStub {
    addPath() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
  }
  g.Path2D = Path2DStub;
}

if (typeof g.ImageData === "undefined") {
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
  g.ImageData = ImageDataStub;
}

export {};
