/**
 * Programmatic PNG visual-analysis (no native decompression needed — Node zlib
 * inflates the IDAT stream; we de-filter scanlines ourselves).
 *
 * Decodes a PNG to RGBA pixels, downsamples by box-averaging into a small grid,
 * then prints:
 *   - an ASCII luminance map (scaled to the image's own dynamic range)
 *   - an ASCII hue map (accents classified into families)
 *   - per-row / per-column luminance band profiles (100 columns)
 *
 * Usage: node scripts/analyze-png.mjs public/source-art/hrb-legal-ai.png.png
 *
 * The point: the agent cannot view images, so this provides an objective,
 * verifiable description of each artwork's composition to drive reconstruction.
 */
import { inflateSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/analyze-png.mjs <file.png>')
  process.exit(1)
}

const bytes = readFileSync(file)
let off = 8 // skip PNG signature
let width = 0
let height = 0
let bitDepth = 0
let colorType = 0
let interlace = 0
const idat = []

while (off < bytes.length) {
  const len = bytes.readUInt32BE(off)
  const type = bytes.toString('ascii', off + 4, off + 8)
  const data = bytes.subarray(off + 8, off + 8 + len)
  if (type === 'IHDR') {
    width = data.readUInt32BE(0)
    height = data.readUInt32BE(4)
    bitDepth = data[8]
    colorType = data[9]
    interlace = data[12]
  } else if (type === 'IDAT') {
    idat.push(data)
  } else if (type === 'IEND') {
    break
  }
  off += 12 + len
}

if (!width || !height) throw new Error('no IHDR')
if (interlace !== 0) throw new Error(`adam7 interlacing unsupported (interlace=${interlace})`)
if (bitDepth !== 8 && bitDepth !== 16) throw new Error(`bit depth ${bitDepth} unsupported`)

const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType] ?? 2 // gray, rgb, palette(reuses rgb), gray+alpha, rgba
const bytesPerSample = bitDepth / 8
const sampleShift = bitDepth === 16 ? 8 : 0
const mask = bitDepth === 16 ? 0xff : 0xff

let padded = []

function sampleAt(rowBytes, x, idx, ch) {
  // ch indexes into the channel sequence per pixel after (re)packing below
  void rowBytes
  void x
  void idx
  void ch
  return 0
}
void sampleAt

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

if (colorType === 2 || colorType === 6) {
  // 8/16-bit RGB / RGBA
  const ch = channels
  const stride = (ch * bytesPerSample)
  const raw = inflateSync(Buffer.concat(idat))
  let pos = 0
  const rows = []
  for (let y = 0; y < height; y++) {
    const filter = raw[pos]
    pos += 1
    const row = Buffer.alloc(width * ch)
    const prev = y === 0 ? null : rows[y - 1]
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < ch; c++) {
        const rawByte = raw[pos]
        pos += bytesPerSample
        let v = rawByte
        const idx = x * ch + c
        const a = x === 0 ? 0 : row[idx - ch]
        const b = prev ? prev[idx] : 0
        const cc = x === 0 || !prev ? 0 : prev[idx - ch]
        if (filter === 1) v = (v + a) & 0xff
        else if (filter === 2) v = (v + b) & 0xff
        else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff
        else if (filter === 4) v = (v + paeth(a, b, cc)) & 0xff
        row[idx] = v
      }
    }
    rows.push(row)
  }
  void stride
  padded = rows
} else if (colorType === 0 || colorType === 4) {
  // grayscale / gray+alpha
  const ch = colorType === 4 ? 2 : 1
  const raw = inflateSync(Buffer.concat(idat))
  let pos = 0
  const rows = []
  for (let y = 0; y < height; y++) {
    const filter = raw[pos]
    pos += 1
    const row = Buffer.alloc(width * ch)
    const prev = y === 0 ? null : rows[y - 1]
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < ch; c++) {
        let v = raw[pos]
        pos += bytesPerSample
        const idx = x * ch + c
        const a = x === 0 ? 0 : row[idx - ch]
        const b = prev ? prev[idx] : 0
        const cc = x === 0 || !prev ? 0 : prev[idx - ch]
        if (filter === 1) v = (v + a) & 0xff
        else if (filter === 2) v = (v + b) & 0xff
        else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff
        else if (filter === 4) v = (v + paeth(a, b, cc)) & 0xff
        row[idx] = v
      }
    }
    rows.push(row)
  }
  const rgbs = rows.map((row) => {
    const out = Buffer.alloc(width * 4)
    for (let x = 0; x < width; x++) {
      const g = row[x * ch]
      const alpha = colorType === 4 ? row[x * ch + 1] : 255
      out[x * 4] = g
      out[x * 4 + 1] = g
      out[x * 4 + 2] = g
      out[x * 4 + 3] = alpha
    }
    return out
  })
  padded = rgbs
  void sampleShift
  void mask
} else if (colorType === 3) {
  // palette
  // extract PLTE
  off = 8
  let plte = null
  let trns = null
  while (off < bytes.length) {
    const len = bytes.readUInt32BE(off)
    const type = bytes.toString('ascii', off + 4, off + 8)
    const data = bytes.subarray(off + 8, off + 8 + len)
    if (type === 'PLTE') plte = data
    if (type === 'tRNS') trns = data
    if (type === 'IEND') break
    off += 12 + len
  }
  if (!plte) throw new Error('palette PNG without PLTE')
  const raw = inflateSync(Buffer.concat(idat))
  let pos = 0
  const rows = []
  for (let y = 0; y < height; y++) {
    const filter = raw[pos]
    pos += 1
    const rowBytes = Buffer.alloc(width)
    const prev = y === 0 ? null : rows[y - 1]
    for (let x = 0; x < width; x++) {
      let v = raw[pos]
      pos += 1
      const a = x === 0 ? 0 : rowBytes[x - 1]
      const b = prev ? prev[x] : 0
      const cc = x === 0 || !prev ? 0 : prev[x - 1]
      if (filter === 1) v = (v + a) & 0xff
      else if (filter === 2) v = (v + b) & 0xff
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff
      else if (filter === 4) v = (v + paeth(a, b, cc)) & 0xff
      rowBytes[x] = v
    }
    const out = Buffer.alloc(width * 4)
    for (let x = 0; x < width; x++) {
      const idx = rowBytes[x] * 3
      const alpha = trns && rowBytes[x] < trns.length ? trns[rowBytes[x]] : 255
      out[x * 4] = plte[idx]
      out[x * 4 + 1] = plte[idx + 1]
      out[x * 4 + 2] = plte[idx + 2]
      out[x * 4 + 3] = alpha
    }
    rows.push(out)
  }
  padded = rows
} else {
  throw new Error(`colortype ${colorType} unsupported`)
}

// scale by aspect so cells are ~square
const GRID = 64
const cols = GRID
const rows = Math.max(4, Math.round((height / width) * cols))

const cellW = Math.ceil(width / cols)
const cellH = Math.ceil(height / rows)

const lum = []
const hue = []
for (let gy = 0; gy < rows; gy++) {
  const lr = []
  const hr = []
  for (let gx = 0; gx < cols; gx++) {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    let alphaSum = 0
    const y0 = gy * cellH
    const y1 = Math.min(height, y0 + cellH)
    const x0 = gx * cellW
    const x1 = Math.min(width, x0 + cellW)
    for (let y = y0; y < y1; y++) {
      const row = padded[y]
      for (let x = x0; x < x1; x++) {
        const o = x * 4
        r += row[o]
        g += row[o + 1]
        b += row[o + 2]
        alphaSum += row[o + 3]
        n += 1
      }
    }
    r /= n
    g /= n
    b /= n
    const alpha = alphaSum / n
    let L = (0.2126 * r + 0.7152 * g + 0.0722 * b)
    if (alpha < 128) {
      // transparent: treat as background (dark)
      r = g = b = 8
      L = 8
    }
    lr.push(L)
    // hue family (only where saturation is meaningful)
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    const sat = mx - mn
    hr.push({ L, r, g, b, sat, mx })
  }
  lum.push(lr)
  hue.push(hr)
}

// dynamic-range key based on percentiles
const flat = lum.flat().filter((v) => v >= 0)
flat.sort((a, b) => a - b)
const p = (f) => flat[Math.min(flat.length - 1, Math.floor(f * flat.length))]
const lo = p(0.15)
const mid = p(0.55)
const hi = p(0.92)
const span = Math.max(16, hi - lo)

const LUM_CHARS = ' .:-=+*#%@'
function lumChar(v) {
  const t = (Math.max(lo, Math.min(hi + 16, v)) - lo) / span
  return LUM_CHARS[Math.min(LUM_CHARS.length - 1, Math.floor(t * LUM_CHARS.length))]
}
function hueChar(c, dflt) {
  if (c.sat < 10) return dflt
  // lower sat threshold at low light
  if (c.sat < 22 && c.L < 30) return dflt
  const { r, g, b } = c
  if (b > 70 && b >= r && b > g) return b - g > 50 ? 'V' : 'B' // violet vs blue
  if (g > 60 && g >= r && g > b) return 'G'
  if (r > 60 && r > g && r > b) return 'R'
  if (b > 40 && b > r && g > r * 0.8) return 'C'
  return '?'
}
function tone(dflt) {
  return dflt // reuse lumChar via map
}
void tone

console.log(`\n${file}  ${width}x${height}  bitDepth=${bitDepth} colorType=${colorType}`)
console.log(`luminance key  lo=${lo.toFixed(0)} mid=${mid.toFixed(0)} hi=${hi.toFixed(0)} span=${span.toFixed(0)}`)
console.log('\n--- luminance map (bright = #%@+, dark = space) ---')
for (const r of lum) console.log(r.map(lumChar).join(''))
console.log('\n--- hue/accent map (.=mid grey, V=violet B=blue G=green R=warm C=cyan W=light) ---')
for (const r of hue) {
  console.log(
    r
      .map((c) => {
        if (c.L > hi * 0.85 && c.sat < 26) return 'W'
        return hueChar(c, c.L > mid ? '.' : c.L > lo ? ':' : ' ')
      })
      .join(''),
  )
}

// per-100-column and per-row luminance profiles
const colSamples = 100
const rowSamples = Math.round((height / width) * colSamples)
console.log('\n--- column profile (bottom row = whole-column avg luminance 0..100) ---')
for (let gi = 0; gi < 100; gi++) {
  const cx = Math.floor((gi / 100) * cols)
  let sum = 0
  for (let y = 0; y < rows; y++) sum += lum[y][cx]
  const avg = (sum / rows / 255) * 100
  process.stdout.write(avg < 7 ? ' ' : avg < 16 ? '.' : avg < 30 ? '=' : avg < 50 ? '#' : '@')
}
console.log('')
console.log('\n--- row profile (width-wise avg luminance 0..100) ---')
for (let gy = 0; gy < rowSamples; gy++) {
  const ry = Math.floor((gy / rowSamples) * rows)
  let sum = 0
  for (let x = 0; x < cols; x++) sum += lum[ry][x]
  const avg = (sum / cols / 255) * 100
  process.stdout.write(avg < 7 ? ' ' : avg < 16 ? '.' : avg < 30 ? '=' : avg < 50 ? '#' : '@')
}
console.log('')