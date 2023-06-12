const PI = Math.PI

export class GenFN extends HTMLElement {
  static get observedAttributes () {
    return ['grid-colour', 'grid-color']
  }

  constructor () {
    super()

    this.internal = {
      gridColour: '#ffbf00c0'
    }

    const template = document.querySelector('#template-genfn')
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

  redraw (shapes, styles, scale) {
    const shadow = this.shadowRoot
    const canvas = shadow.querySelector('canvas')
    const ctx = canvas.getContext('2d')

    drawGrid(this, canvas, ctx)
    setClipRegion(canvas, ctx)

    for (const [ix, shape] of shapes.entries()) {
      drawShape(canvas, ctx, shape, styles[ix], scale)
    }
  }
}

function drawGrid (genfn, canvas, ctx) {
  const width = canvas.width
  const height = canvas.height
  const margin = 8
  const radius = 10

  const w = width - 2 * margin
  const h = height - 2 * margin
  const dw = w / 4
  const dh = h / 4

  const tl = { x: margin, y: margin }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  ctx.clearRect(0, 0, width, height)

  ctx.beginPath()
  ctx.strokeStyle = genfn.gridColour
  ctx.lineWidth = 2

  ctx.moveTo(tl.x + radius, tl.y)
  ctx.arcTo(tr.x, tr.y, br.x, br.y, radius)
  ctx.arcTo(br.x, br.y, bl.x, bl.y, radius)
  ctx.arcTo(bl.x, bl.y, tl.x, tl.y, radius)
  ctx.arcTo(tl.x, tl.y, tl.x + radius, tr.y, radius)

  for (let i = 1; i < 4; i++) {
    const y = tl.y + i * dh

    ctx.moveTo(tl.x, y)
    ctx.lineTo(tl.x + w, y)
  }

  for (let i = 1; i < 4; i++) {
    const x = tl.x + i * dw

    ctx.moveTo(x, tl.y)
    ctx.lineTo(x, tl.y + h)
  }

  ctx.stroke()
}

function setClipRegion (canvas, ctx) {
  const width = canvas.width
  const height = canvas.height
  const margin = 8
  const radius = 10

  const w = width - 2 * margin
  const h = height - 2 * margin

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

function drawShape (canvas, ctx, shape, STYLE, scale) {
  const width = canvas.width
  const height = canvas.height
  const margin = 8

  const w = width - 2 * margin
  const h = height - 2 * margin

  const lineWidth = 4
  const cx = width / 2
  const cy = height / 2
  const r = width / 2 - margin
  const xscale = scale * (w - lineWidth) / w
  const yscale = scale * (h - lineWidth) / h

  const xy = function (p) {
    return {
      x: cx + xscale * r * p.x,
      y: cy - yscale * r * p.y
    }
  }

  for (const style of STYLE.colours) {
    const start = xy(shape[0])
    const list = [...shape.slice(1), shape.slice(1)[0]]

    ctx.beginPath()
    ctx.strokeStyle = style.colour
    ctx.lineWidth = style.width

    ctx.moveTo(start.x, start.y)
    list.forEach((v, i) => {
      const { x, y } = xy(v)

      ctx.lineTo(x, y)
    })

    ctx.stroke()

    // ... draw phase indicator
    const x = cx + 0.96 * (start.x - cx)
    const y = cy + 0.96 * (start.y - cy)
    const r = Math.hypot(x - cx, y - cy)

    if (r > 20) {
      ctx.beginPath()
      ctx.fillStyle = style.colour
      ctx.strokeStyle = style.colour
      ctx.lineWidth = 1
      ctx.ellipse(x, y, 3, 3, 0, 0, 2 * PI)
      ctx.fill()
    }
  }
}

customElements.define('snyth-genfn', GenFN)
