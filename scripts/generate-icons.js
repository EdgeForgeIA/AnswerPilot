#!/usr/bin/env node
/**
 * Regenerates the favicon and app icons in app/ from the VeriQuill logo mark.
 *
 *   node scripts/generate-icons.js
 *   node scripts/generate-icons.js --preview   # also write magnified PNGs to inspect
 *
 * Writes app/favicon.ico (16/32/48 embedded), app/icon.png (512) and
 * app/apple-icon.png (180). Next's App Router picks those filenames up by
 * convention and emits the <link rel="icon"> tags itself — there is no
 * metadata.icons config to keep in sync.
 *
 * Rasterizing needs `sharp`, which is not a direct dependency but arrives
 * transitively via `next` (next 16.2 -> sharp 0.34), so this runs after a plain
 * `npm install` with nothing extra to add. The guard below covers the day that
 * stops being true. Output is deterministic: re-running on the same sharp
 * version reproduces all three files byte for byte.
 *
 * ── Design notes ────────────────────────────────────────────────────────────
 * The mark is lucide-react's `pen-tool` glyph in --on-accent white on an
 * --accent (#0b7a6b) rounded square, i.e. exactly the Wordmark in app/page.tsx.
 *
 * Sizes are optically adjusted rather than one artwork scaled down: smaller
 * canvases get a proportionally larger glyph and a heavier stroke, because a
 * stroke that reads well at 512px disappears at 32px.
 *
 * The 16x16 entry is a different drawing on purpose. The stroked mark at 16px
 * renders as an illegible grey blob (verify for yourself with --preview), and
 * filling the true outline — kite body plus detached nib — just yields a
 * featureless blob with a nub. So 16px uses a simplified filled nib that keeps
 * the original's form: a blunt held end tapering to a writing point along the
 * down-right diagonal, as one continuous shape. Everything from 32px up uses
 * the real glyph.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error(
    "Could not load `sharp`, normally provided transitively by next.\n" +
      "Run `npm install` first; if it is still missing, next no longer bundles it:\n\n" +
      "  npm i -D sharp\n" +
      "  node scripts/generate-icons.js\n"
  );
  process.exit(1);
}

const REPO_ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "app");

const TEAL = "#0b7a6b"; // --accent (light)
const WHITE = "#ffffff"; // --on-accent (light)

/** lucide-react v0.542.0 `pen-tool` node list, stroked. */
const PEN_TOOL_PATHS = [
  "M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z",
  "m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18",
  "m2.3 2.3 7.286 7.286",
];
const PEN_TOOL_CIRCLE = { cx: 11, cy: 11, r: 2 };

/** Simplified filled nib, 16px only. See design notes above. */
const QUILL_SIMPLE_FILL = "M4.77 1.23 L9.36 3.71 L21.03 21.03 L3.71 9.36 L1.23 4.77 Z";

/**
 * Per-size tuning. `glyphFrac` is the glyph's share of the canvas, `strokeWidth`
 * is in the glyph's own 24-unit space, `radiusFrac` is the corner radius as a
 * share of the canvas (0.22 tracks Tailwind's rounded-md on the 28px wordmark).
 */
const SIZES = {
  icon512: { size: 512, glyphFrac: 0.56, strokeWidth: 2.0, radiusFrac: 0.22, style: "stroked" },
  // Full-bleed: iOS applies its own rounded mask, so self-rounding double-rounds.
  apple180: { size: 180, glyphFrac: 0.58, strokeWidth: 2.2, radiusFrac: 0, style: "stroked" },
  ico48: { size: 48, glyphFrac: 0.62, strokeWidth: 2.6, radiusFrac: 0.22, style: "stroked" },
  ico32: { size: 32, glyphFrac: 0.64, strokeWidth: 3.0, radiusFrac: 0.22, style: "stroked" },
  ico16: { size: 16, glyphFrac: 0.74, radiusFrac: 0.19, style: "filled" },
};

function buildSvg({ size, glyphFrac, strokeWidth, radiusFrac, style }) {
  const k = (size * glyphFrac) / 24;
  const offset = (size - size * glyphFrac) / 2;
  const rx = size * radiusFrac;
  const glyph =
    style === "filled"
      ? `<g transform="translate(${offset} ${offset}) scale(${k})" fill="${WHITE}">
      <path d="${QUILL_SIMPLE_FILL}"/>
    </g>`
      : `<g transform="translate(${offset} ${offset}) scale(${k})"
       fill="none" stroke="${WHITE}" stroke-width="${strokeWidth}"
       stroke-linecap="round" stroke-linejoin="round">
      ${PEN_TOOL_PATHS.map((d) => `<path d="${d}"/>`).join("\n      ")}
      <circle cx="${PEN_TOOL_CIRCLE.cx}" cy="${PEN_TOOL_CIRCLE.cy}" r="${PEN_TOOL_CIRCLE.r}"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="${TEAL}"/>
    ${glyph}
  </svg>`;
}

/** Render a spec to a PNG buffer. High density so curves resolve before downsampling. */
async function renderPng(spec) {
  return sharp(Buffer.from(buildSvg(spec)), { density: 384 })
    .resize(spec.size, spec.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Pack PNG payloads into a multi-image .ico. PNG-in-ICO (rather than BMP) is
 * supported by every browser and by Windows since Vista.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const DIR_ENTRY = 16;
  let offset = 6 + entries.length * DIR_ENTRY;
  const dir = [];
  for (const { size, data } of entries) {
    const e = Buffer.alloc(DIR_ENTRY);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette entries
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    dir.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

/** Nearest-neighbour blow-ups so small-size legibility can be judged by eye. */
async function writePreviews(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const shots = [
    ["16-simplified", SIZES.ico16],
    ["16-stroked-rejected", { ...SIZES.ico32, size: 16 }],
    ["32", SIZES.ico32],
    ["48", SIZES.ico48],
  ];
  for (const [name, spec] of shots) {
    const buf = await renderPng(spec);
    await sharp(buf).resize(256, 256, { kernel: "nearest" }).png().toFile(path.join(dir, `${name}.png`));
  }
  return dir;
}

async function main() {
  const wantPreview = process.argv.includes("--preview");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, "icon.png"), await renderPng(SIZES.icon512));
  fs.writeFileSync(path.join(OUT_DIR, "apple-icon.png"), await renderPng(SIZES.apple180));

  // Largest first, which is what picky consumers expect.
  const icoEntries = [];
  for (const spec of [SIZES.ico48, SIZES.ico32, SIZES.ico16]) {
    icoEntries.push({ size: spec.size, data: await renderPng(spec) });
  }
  fs.writeFileSync(path.join(OUT_DIR, "favicon.ico"), buildIco(icoEntries));

  for (const f of ["favicon.ico", "icon.png", "apple-icon.png"]) {
    const p = path.join(OUT_DIR, f);
    console.log(`  app/${f}  ${fs.statSync(p).size} bytes`);
  }

  if (wantPreview) {
    const dir = await writePreviews(path.join(os.tmpdir(), "veriquill-icon-preview"));
    console.log(`\npreviews (256px nearest-neighbour): ${dir}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
