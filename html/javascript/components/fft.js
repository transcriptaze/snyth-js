const FS = 256 // samples/s
const F0 = 16 // Hz
const MARGIN = 8
const RADIUS = 10
const HMAX = 4
const HMIN = 1 / 128

export class FFT extends HTMLElement {
  static get observedAttributes () {
    return ['fs', 'f0']
  }

  constructor () {
    super()

    this.internal = {
      fs: FS,
      f0: F0,
      fft: null
    }

    const template = document.querySelector('#template-fft')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)

    this.appendChild(clone)
  }

  connectedCallback () {
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'fs') {
      this.fs = `${to}`
    }

    if (name === 'f0') {
      this.f0 = `${to}`
    }
  }

  get fs () {
    return this.internal.fs
  }

  set fs (v) {
    const fs = parseFloat(v)
    if (!Number.isNaN(fs) && fs > 0) {
      this.internal.fs = fs

      redraw(this)
    }
  }

  get f0 () {
    return this.internal.f0
  }

  set f0 (v) {
    const f = parseFloat(v)
    if (!Number.isNaN(f) && f > 0) {
      this.internal.f0 = f

      redraw(this)
    }
  }

  get fft () {
    return this.internal.fft
  }

  set fft (v) {
    if (v != null && Array.isArray(v)) {
      this.internal.fft = v

      redraw(this)
    }
  }
}

function redraw (fft) {
  const shadow = fft.shadowRoot
  const canvas = shadow.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const margin = 8

  let w = width - 2 * margin
  let h = height - 2 * margin
  const dw = Math.floor(2 * h / 4)
  const dh = Math.floor(h / 4)

  w = dw * Math.floor(w / dw)
  h = dh * Math.floor(h / dh)

  canvas.width = w + 2 * margin
  canvas.height = h + 2 * margin

  ctx.clearRect(0, 0, width, height)

  drawLogGrid(canvas, ctx, dh, fft.f0)
  setClipRegion(canvas, ctx)

  if (fft.fft != null) {
    drawLogFFT(canvas, ctx, dw, fft.fft, fft.fs, fft.f0)
  }
}

function setClipRegion (canvas, ctx) {
  const w = canvas.width - 2 * MARGIN
  const h = canvas.height - 2 * MARGIN

  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  // .. set clip region
  ctx.beginPath()
  ctx.moveTo(tl.x + RADIUS, tl.y)
  ctx.arcTo(tr.x, tr.y, br.x, br.y, RADIUS)
  ctx.arcTo(br.x, br.y, bl.x, bl.y, RADIUS)
  ctx.arcTo(bl.x, bl.y, tl.x, tl.y, RADIUS)
  ctx.arcTo(tl.x, tl.y, tl.x + RADIUS, tr.y, RADIUS)

  ctx.clip()
}

function drawLogGrid (canvas, ctx, dh, f1) {
  const w = canvas.width - 2 * MARGIN
  const h = canvas.height - 2 * MARGIN

  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  // ... calculate vertical gridlines
  const f0 = f1 / 2
  const vminor = [1, 2, 4, 8, 16, 32, 64, 128].map((v) => [f0 * 1.25 * v, f0 * 1.5 * v, f0 * 1.75 * v]).flat()
  const vmajor = [2, 4, 8, 16, 32, 64, 128].map((v) => f0 * v)

  // ... calculate horizontal
  const m = h / (Math.log(HMAX) - Math.log(HMIN))
  const c = h - m * Math.log(HMAX)
  const hmajor = [HMAX, 1, 0.25, 0.0625, 0.015625, HMIN]
  const hminor = [2, 0.5, 0.125, 0.03125]

  // ... draw vertical gridlines
  const drawv = (ticks, style, width, dash) => {
    const xscale = w / 8
    const at = ticks.map((v) => xscale * Math.log2(v / f0))

    ctx.beginPath()
    ctx.setLineDash(dash)
    ctx.strokeStyle = style
    ctx.lineWidth = width

    for (const x of at) {
      ctx.moveTo(tl.x + x, tl.y)
      ctx.lineTo(tl.x + x, tl.y + h)
    }

    ctx.stroke()
  }

  drawv(vminor, '#ffbf00c0', 1, [2, 2])
  drawv(vmajor, '#ffbf00c0', 2, [])

  // ... draw horizontal gridlines
  const drawh = (ticks, style, width, dash) => {
    const at = ticks.map((v) => m * Math.log(v) + c)

    ctx.beginPath()
    ctx.setLineDash(dash)
    ctx.strokeStyle = style
    ctx.lineWidth = width

    for (const y of at) {
      ctx.moveTo(tl.x, tl.y + h - y)
      ctx.lineTo(tl.x + w, tl.y + h - y)
    }

    ctx.stroke()
  }

  drawh(hmajor, '#ffbf00c0', 2, [])
  drawh(hminor, '#ffbf00c0', 1, [2, 2])

  // ... draw border
  ctx.beginPath()
  ctx.setLineDash([])
  ctx.strokeStyle = '#ffbf00c0'
  ctx.lineWidth = 2

  ctx.moveTo(tl.x + RADIUS, tl.y)
  ctx.arcTo(tr.x, tr.y, br.x, br.y, RADIUS)
  ctx.arcTo(br.x, br.y, bl.x, bl.y, RADIUS)
  ctx.arcTo(bl.x, bl.y, tl.x, tl.y, RADIUS)
  ctx.arcTo(tl.x, tl.y, tl.x + RADIUS, tr.y, RADIUS)
  ctx.stroke()
}

function drawLogFFT (canvas, ctx, dw, dft, fs, f0) {
  const w = canvas.width - 2 * MARGIN
  const h = canvas.height - 2 * MARGIN

  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  const N = dft.length
  const δf = fs / (2 * N)

  const w1 = 1
  const w8 = 4
  const x1 = Math.log2(1 * f0 * δf)
  const x8 = Math.log2(8 * f0 * δf)
  const m = dw * (w8 - w1) / (x8 - x1)
  const c = dw - m * x1
  const mʼ = h / (Math.log(HMAX) - Math.log(HMIN))
  const cʼ = h - mʼ * Math.log(HMAX)

  const xscale = (i) => _logf(i * δf, m, c)
  const yscale = (v) => _dB(v, mʼ, cʼ)

  ctx.beginPath()
  ctx.strokeStyle = '#ffff00'
  ctx.lineWidth = 2

  ctx.moveTo(bl.x, bl.y)
  for (let i = 0; i < N; i++) {
    ctx.lineTo(bl.x + xscale(i), bl.y - yscale(dft[i]))
  }

  ctx.stroke()
}

function _logf (f, m, c) {
  return m * Math.log2(f) + c
}

function _V (v, h) {
  return 0.75 * h * v
}

function _dB (v, m, c) {
  const dBV = m * Math.log(v) + c

  return Math.max(dBV, 0)
}

customElements.define('snyth-fft', FFT)
