#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/pdf-probe.mjs <path-to-pdf>");
  process.exit(1);
}

const buf = await readFile(file);
const parser = new PDFParse({ data: buf });
try {
  const r = await parser.getText();
  console.log(`Pages: ${r.pages.length}`);
  console.log(`Total chars extracted: ${r.text.length}`);
  console.log("--- First 500 chars ---");
  console.log(r.text.slice(0, 500));
  console.log("--- Last 500 chars ---");
  console.log(r.text.slice(-500));
} finally {
  await parser.destroy();
}
