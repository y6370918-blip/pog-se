#!/usr/bin/env node
"use strict"

/**
 * Add visible text labels to each <rect inkscape:label="..."> in layout.svg.
 * Labels appear centered on each rectangle so you can identify them in Inkscape.
 *
 * Usage:
 *   node tools/add-labels-to-layout.js          # add labels
 *   node tools/add-labels-to-layout.js --remove # remove labels
 *
 * After editing in Inkscape, run export-layout-from-svg.js to generate layout.js.
 * The export script ignores <text> elements and only reads <rect> coordinates.
 */

const fs = require("fs")
const path = require("path")

const LABEL_NS = "http://www.w3.org/2000/svg"
const LABEL_CLASS = "layout-label"

function findAttr(text, name) {
  const re = new RegExp(String.raw`\b${name}\s*=\s*"([^"]*)"`)
  const m = text.match(re)
  return m ? m[1] : null
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function addLabels(svgText) {
  // Match each <rect ... /> block (including multiline)
  const rectRegex = /<rect\b([\s\S]*?)\/>/g
  let result = svgText
  let count = 0

  result = result.replace(rectRegex, (match, attrs) => {
    const label = findAttr(attrs, "inkscape:label")
    if (!label) return match

    const xs = findAttr(attrs, "x")
    const ys = findAttr(attrs, "y")
    const ws = findAttr(attrs, "width")
    const hs = findAttr(attrs, "height")
    if (xs == null || ys == null || ws == null || hs == null) return match

    const x = Number.parseFloat(xs)
    const y = Number.parseFloat(ys)
    const w = Number.parseFloat(ws)
    const h = Number.parseFloat(hs)
    if (![x, y, w, h].every(Number.isFinite)) return match

    const cx = x + w / 2
    const cy = y + h / 2
    const fontSize = Math.min(w, h) * 0.5
    const safeLabel = escapeXml(label)

    const textEl = `\n   <text class="${LABEL_CLASS}" x="${cx}" y="${cy}" font-size="${Math.max(6, fontSize)}" text-anchor="middle" dominant-baseline="middle" fill="white" stroke="black" stroke-width="1" style="pointer-events:none">${safeLabel}</text>`

    count++
    return match + textEl
  })

  return { text: result, count }
}

function removeLabels(svgText) {
  // Remove <text ... class="...layout-label..." ...>...</text>
  const textRegex = new RegExp(
    `\\s*<text[^>]*class="[^"]*${LABEL_CLASS}[^"]*"[^>]*>[\\s\\S]*?</text>`,
    "g"
  )
  const result = svgText.replace(textRegex, "")
  const count = (svgText.match(textRegex) || []).length
  return { text: result, count }
}

function main() {
  const remove = process.argv.includes("--remove") || process.argv.includes("-r")
  const inPath = path.resolve(process.cwd(), "tools/layout.svg")

  let svgText
  try {
    svgText = fs.readFileSync(inPath, "utf8")
  } catch (e) {
    console.error(`Cannot read ${inPath}:`, e.message)
    process.exit(1)
  }

  let result
  if (remove) {
    result = removeLabels(svgText)
    console.log(`Removed ${result.count} labels from layout.svg`)
  } else {
    // Remove existing labels first so re-running doesn't duplicate
    const cleaned = removeLabels(svgText)
    if (cleaned.count > 0) {
      console.log(`Removed ${cleaned.count} existing labels`)
      svgText = cleaned.text
    }
    result = addLabels(svgText)
    console.log(`Added ${result.count} labels to layout.svg`)
  }

  fs.writeFileSync(inPath, result.text, "utf8")
  console.log("Done. Reopen layout.svg in Inkscape to see changes.")
}

main()
