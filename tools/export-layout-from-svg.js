#!/usr/bin/env node
"use strict"

/**
 * Export `const layout = {...}` from an Inkscape SVG overlay (tools/layout.svg).
 *
 * The SVG is expected to contain <rect> elements with an `inkscape:label`
 * attribute. We read x/y/width/height from each rect and emit `layout.js`.
 *
 * Usage:
 *   node tools/export-layout-from-svg.js
 *   node tools/export-layout-from-svg.js --in tools/layout.svg --out layout.js
 *
 * Notes:
 * - Values are rounded to nearest integer (Inkscape often stores 999.99994 etc).
 * - Order follows the order of <rect> tags in the SVG file.
 */

const fs = require("fs")
const path = require("path")

function parseArgs(argv) {
  const args = { in: "tools/layout.svg", out: "layout.js" }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--in" && argv[i + 1]) {
      args.in = argv[++i]
    } else if (a === "--out" && argv[i + 1]) {
      args.out = argv[++i]
    } else if (a === "-h" || a === "--help") {
      args.help = true
    } else {
      args.unknown = args.unknown || []
      args.unknown.push(a)
    }
  }
  return args
}

function findAttr(tag, name) {
  // Require attribute name to be preceded by space or start - avoids matching
  // "originy", "spacingy", "cy", "window-y" etc. when looking for "y"
  const re = new RegExp(String.raw`(?:^|[\s"])${name}\s*=\s*"([^"]*)"`)
  const m = tag.match(re)
  return m ? m[1] : null
}

function parseRects(svgText) {
  const rectTags = svgText.match(/<rect\b[^>]*>/g) || []
  const out = []

  for (const tag of rectTags) {
    const label = findAttr(tag, "inkscape:label")
    if (!label) continue

    const xs = findAttr(tag, "x")
    const ys = findAttr(tag, "y")
    const ws = findAttr(tag, "width")
    const hs = findAttr(tag, "height")
    if (xs == null || ys == null || ws == null || hs == null) continue

    const x = Math.round(Number.parseFloat(xs))
    const y = Math.round(Number.parseFloat(ys))
    const w = Math.round(Number.parseFloat(ws))
    const h = Math.round(Number.parseFloat(hs))
    if (![x, y, w, h].every(Number.isFinite)) continue

    out.push({ label, rect: [x, y, w, h] })
  }

  return out
}

function escapeKey(k) {
  // JSON-style escaping for quotes/backslashes/newlines.
  return k
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
}

function formatLayout(rects) {
  const lines = []
  lines.push("const layout = {")
  for (let i = 0; i < rects.length; i++) {
    const { label, rect } = rects[i]
    const key = escapeKey(label)
    lines.push(`\t"${key}": [${rect.join(",")}],`)
  }
  // remove trailing comma on last entry to match existing style
  if (rects.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,\s*$/, "")
  }
  lines.push("}")
  lines.push("")
  return lines.join("\n")
}

function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    process.stdout.write(
      [
        "Export layout.js from tools/layout.svg",
        "",
        "Usage:",
        "  node tools/export-layout-from-svg.js",
        "  node tools/export-layout-from-svg.js --in tools/layout.svg --out layout.js",
        "",
      ].join("\n")
    )
    process.exit(0)
  }
  if (args.unknown && args.unknown.length) {
    console.error(`Unknown args: ${args.unknown.join(" ")}`)
    process.exit(2)
  }

  const inPath = path.resolve(process.cwd(), args.in)
  const outPath = path.resolve(process.cwd(), args.out)

  const svgText = fs.readFileSync(inPath, "utf8")
  const rects = parseRects(svgText)
  if (rects.length === 0) {
    console.error(`No <rect inkscape:label="..."> found in ${inPath}`)
    process.exit(1)
  }

  const content = formatLayout(rects)
  fs.writeFileSync(outPath, content, "utf8")
  console.log(`Wrote ${rects.length} entries to ${outPath}`)
}

main()

