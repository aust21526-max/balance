import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

// Bundled fonts only, so every machine renders identical frames.
const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fonts');
const FONT_FILES = readdirSync(FONT_DIR).filter((f) => /\.(otf|ttf)$/.test(f)).map((f) => join(FONT_DIR, f));

function resvg(svg, width) {
  return new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: 'Inter' },
  }).render();
}

// Deterministic SVG -> PNG. Same SVG always gives the same bytes.
export const svgToPng = (svg, width) => resvg(svg, width).asPng();

// Raw RGBA pixels for piping straight into ffmpeg.
export const svgToRgba = (svg) => resvg(svg).pixels;
