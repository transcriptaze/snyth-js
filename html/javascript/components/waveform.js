export class Waveform extends HTMLElement {
  static get observedAttributes () {
    return ['grid-colour', 'grid-color']
  }

  constructor () {
    super()

    this.internal = {
      gridColour: '#ffbf00c0'
    }

    const template = document.querySelector('#template-waveform')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)
  }

  connectedCallback () {
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'grid-colour' || name === 'grid-color') {
      this.gridColour = to
    }
  }

  get gridColour () {
    return this.internal.gridColour
  }

  set gridColour (v) {
    this.internal.gridColour = v
  }

  get gridColor () {
    return this.internal.gridColour
  }

  set gridColor (v) {
    this.internal.gridColour = v
  }

  redraw (paths, styles, scale) {
    const shadow = this.shadowRoot
    const canvas = shadow.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const margin = 8

    let w = width - 2 * margin
    let h = height - 2 * margin
    const dw = Math.floor(h / 4)
    const dh = Math.floor(h / 4)

    w = dw * Math.floor(w / dw)
    h = dh * Math.floor(h / dh)

    canvas.width = w + 2 * margin
    canvas.height = h + 2 * margin

    drawGrid(this, canvas, ctx)
    setClipRegion(canvas, ctx)

    for (const [ix, path] of paths.entries()) {
      drawWaveForm(canvas, ctx, path, styles[ix], scale)
    }
  }
}

function drawGrid (waveform, canvas, ctx) {
  const width = canvas.width
  const height = canvas.height
  const margin = 8
  const radius = 10

  let w = width - 2 * margin
  let h = height - 2 * margin
  const dw = Math.floor(h / 4)
  const dh = Math.floor(h / 4)

  w = dw * Math.floor(w / dw)
  h = dh * Math.floor(h / dh)

  const tl = { x: margin, y: margin }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  ctx.clearRect(0, 0, width, height)

  ctx.beginPath()
  ctx.strokeStyle = waveform.gridColour
  ctx.lineWidth = 2

  ctx.moveTo(tl.x + radius, tl.y)
  ctx.arcTo(tr.x, tr.y, br.x, br.y, radius)
  ctx.arcTo(br.x, br.y, bl.x, bl.y, radius)
  ctx.arcTo(bl.x, bl.y, tl.x, tl.y, radius)
  ctx.arcTo(tl.x, tl.y, tl.x + radius, tr.y, radius)

  for (let i = 1; i < 4; i++) {
    ctx.moveTo(tl.x, tl.y + i * dh)
    ctx.lineTo(tl.x + w, tl.y + i * dh)
  }

  let x = dw
  while (x < w) {
    ctx.moveTo(tl.x + x, tl.y)
    ctx.lineTo(tl.x + x, tl.y + h)

    x += dw
  }

  ctx.stroke()
}

function setClipRegion (canvas, ctx) {
  const width = canvas.width
  const height = canvas.height
  const margin = 8
  const radius = 10

  let w = width - 2 * margin
  let h = height - 2 * margin
  const dw = Math.floor(h / 4)
  const dh = Math.floor(h / 4)

  w = dw * Math.floor(w / dw)
  h = dh * Math.floor(h / dh)

  const tl = { x: margin, y: margin }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  ctx.beginPath()
  ctx.moveTo(tl.x + radius, tl.y)
  ctx.arcTo(tr.x, tr.y, br.x, br.y, radius)
  ctx.arcTo(br.x, br.y, bl.x, bl.y, radius)
  ctx.arcTo(bl.x, bl.y, tl.x, tl.y, radius)
  ctx.arcTo(tl.x, tl.y, tl.x + radius, tr.y, radius)

  ctx.clip()
}

function drawWaveForm (canvas, ctx, shape, STYLE, scale) {
  const width = canvas.width
  const height = canvas.height
  const margin = 8

  let w = width - 2 * margin
  let h = height - 2 * margin
  const dw = Math.floor(h / 4)
  const dh = Math.floor(h / 4)

  w = dw * Math.floor(w / dw)
  h = dh * Math.floor(h / dh)

  const tl = { x: margin, y: margin }

  const lineWidth = 4
  const cx = tl.x
  const cy = tl.y + h / 2
  const R = h / 2
  const xscale = (w - lineWidth) / w
  const yscale = scale * (h - lineWidth) / h

  for (const style of STYLE.colours) {
    ctx.beginPath()
    ctx.strokeStyle = style.colour
    ctx.lineWidth = style.width

    const N = shape.length
    const sn = shape[0]
    const α = 0
    const t = w * α
    const v = R * sn

    ctx.moveTo(cx + xscale * t, cy - yscale * v)

    shape.slice(1).forEach((sn, i) => {
      const α = (i + 1) / N
      const t = w * α
      const v = R * sn

      ctx.lineTo(cx + xscale * t, cy - yscale * v)
    })

    ctx.lineTo(cx + xscale * w, cy - yscale * v)
    ctx.stroke()
  }
}

customElements.define('snyth-waveform', Waveform)
