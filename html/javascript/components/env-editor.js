const MARGIN = 8

const INSETS = {
  left: 64,
  right: 40,
  top: 24,
  bottom: 40,
  tick: 10
}

/* eslint-disable no-multi-spaces */
const HLINE = [
  { h: 0,    colour: '#ffbf00ff', width: 2, dash: []    },
  { h: 1,    colour: '#ffbf00ff', width: 2, dash: []    },
  { h: 0.5,  colour: '#ffbf00c0', width: 2, dash: [2, 4] },
  { h: 0.25, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { h: 0.75, colour: '#ffbf00c0', width: 1, dash: [2, 4] }
]

const VLINE = [
  { w: 0,   colour: '#ffbf00ff', width: 2, dash: []    },
  { w: 1,   colour: '#ffbf00ff', width: 2, dash: []    },
  { w: 0.4, colour: '#ffbf00ff', width: 2, dash: [3, 6] },
  { w: 0.6, colour: '#ffbf00ff', width: 2, dash: [3, 6] },
  { w: 0.1, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { w: 0.2, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { w: 0.3, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { w: 0.5, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { w: 0.7, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { w: 0.8, colour: '#ffbf00c0', width: 1, dash: [2, 4] },
  { w: 0.9, colour: '#ffbf00c0', width: 1, dash: [2, 4] }
]

const YLABELS = [
  { text: '0.0', colour: '#ffbf00ff', h: 0   },
  { text: '1.0', colour: '#ffbf00ff', h: 1   },
  { text: '0.5', colour: '#ffbf00c0', h: 0.5 }
]

const XLABELS = [
  { text: 'O',    colour: '#ffbf00ff', w: 0   },
  { text: '1000', colour: '#ffbf00ff', w: 0.4 },
  { text: 'R',    colour: '#ffbf00ff', w: 0.6 },
  { text: '1000', colour: '#ffbf00ff', w: 1   }
]
/* eslint-enable no-multi-spaces */

const ANIMATE = { alpha: 'ff' }
const STATIC = { alpha: 'a0' }

export class ENVEditor extends HTMLElement {
  constructor () {
    super()

    this.internal = {
      envelope: null
    }

    this.listeners = new Map([
      ['change', []],
      ['changed', []]
    ])

    this.drag = {
      dragging: false,
      inflection: null,
      start: { x: 0, y: 0 },
      range: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
      icon: null,
      context: {
        xscale: 1,
        yscale: 1,
        X: 0,
        Xʼ: 600,
        Y: 0,
        Yʼ: 300
      }
    }

    const template = document.querySelector('#template-env-editor')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)

    window.addEventListener('load', () => {
      this.redraw()
    })
  }

  connectedCallback () {
    const shadow = this.shadowRoot
    const overlay = shadow.querySelector('canvas.overlay')

    overlay.onpointerdown = (event) => this.onPointerDown(event)
    overlay.onpointerup = (event) => this.onPointerUp(event)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchange (listener) {
    this.#setEventListener('change', listener)
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (listener) {
    this.#setEventListener('changed', listener)
  }

  #setEventListener (tag, listener) {
    if (this.listeners.has(tag)) {
      this.listeners.get(tag).forEach((l) => this.removeEventListener(tag, l))
    }

    if (listener) {
      this.addEventListener(tag, listener)
    }

    this.listeners.set(tag, listener ? [listener] : [])
  }

  edit (env) {
    this.internal.envelope = env

    this.redraw()
  }

  redraw (v) {
    const shadow = this.shadowRoot
    const canvas = shadow.querySelector('canvas.envelope')
    const animation = shadow.querySelector('canvas.animation')
    const overlay = shadow.querySelector('canvas.overlay')
    const width = canvas.width
    const height = canvas.height
    const envelope = this.internal.envelope

    if (v === 'editing') {
      this.redrawOverlay(envelope, overlay, width, height, ANIMATE)
    } else {
      let w = width - 2 * MARGIN
      let h = height - 2 * MARGIN
      const dw = Math.floor(h / 4)
      const dh = Math.floor(h / 4)

      w = dw * Math.floor(w / dw)
      h = dh * Math.floor(h / dh)

      canvas.width = w + 2 * MARGIN
      canvas.height = h + 2 * MARGIN

      animation.width = canvas.width
      animation.height = canvas.height

      overlay.width = canvas.width
      overlay.height = canvas.height

      this.redrawUnderlay(envelope, canvas, width, height)
      this.redrawOverlay(envelope, overlay, width, height, STATIC)
    }
  }

  animate (adsr) {
    const shadow = this.shadowRoot
    const canvas = shadow.querySelector('canvas.animation')
    const width = canvas.width
    const height = canvas.height

    let w = width - 2 * MARGIN
    let h = height - 2 * MARGIN
    const dw = Math.floor(h / 4)
    const dh = Math.floor(h / 4)

    w = dw * Math.floor(w / dw)
    h = dh * Math.floor(h / dh)

    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, width, height)

    if (adsr != null) {
      drawEnvelopeX(ctx, w, h, adsr, STATIC)
    }
  }

  redrawUnderlay (envelope, canvas, width, height) {
    let w = width - 2 * MARGIN
    let h = height - 2 * MARGIN
    const dw = Math.floor(h / 4)
    const dh = Math.floor(h / 4)

    w = dw * Math.floor(w / dw)
    h = dh * Math.floor(h / dh)

    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, width, height)
    drawGrid(ctx, w, h)

    if (envelope) {
      drawEnvelope(ctx, w, h, envelope, STATIC)
    }
  }

  redrawOverlay (envelope, overlay, width, height, style) {
    let w = width - 2 * MARGIN
    let h = height - 2 * MARGIN
    const dw = Math.floor(h / 4)
    const dh = Math.floor(h / 4)

    w = dw * Math.floor(w / dw)
    h = dh * Math.floor(h / dh)

    const ctx = overlay.getContext('2d')

    ctx.clearRect(0, 0, width, height)

    if (envelope) {
      drawEnvelope(overlay.getContext('2d'), w, h, envelope, style)
    }
  }

  onPointerDown (event) {
    const envelope = this.internal.envelope

    if (event.button === 0 && envelope) {
      const overlay = event.currentTarget

      onMouseDown(overlay, event, envelope, this.drag)

      if (this.drag.dragging) {
        overlay.onpointermove = (event) => onMouseMove(this, event, envelope, this.drag)
        overlay.setPointerCapture(event.pointerId)
      }
    }
  }

  onPointerUp (event) {
    const overlay = event.currentTarget

    overlay.onpointermove = null
    overlay.releasePointerCapture(event.pointerId)

    if (this.drag.dragging) {
      onMouseUp(this, event, this.drag)
      this.redraw()
    }
  }
}

function drawGrid (ctx, w, h) {
  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  const X = bl.x + INSETS.left
  const Y = bl.y - INSETS.bottom
  const Xʼ = br.x - INSETS.right
  const Yʼ = tl.y + INSETS.top

  // ... hatch sustain area
  const hatch = function () {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 32
    canvas.height = 32

    ctx.beginPath()
    ctx.strokeStyle = '#ffbf00c0'
    ctx.setLineDash([2, 2])
    ctx.moveTo(0, 32)
    ctx.lineTo(32, 0)
    ctx.stroke()

    return canvas
  }

  ctx.fillStyle = ctx.createPattern(hatch(), 'repeat')
  ctx.fillRect(X + 0.4 * (Xʼ - X), Y, 0.2 * (Xʼ - X), Yʼ - Y)
  ctx.fill()

  // horizontals
  for (const line of HLINE) {
    ctx.beginPath()
    ctx.strokeStyle = line.colour
    ctx.lineWidth = line.width
    ctx.setLineDash(line.dash)
    ctx.moveTo(X - INSETS.tick, Y + line.h * (Yʼ - Y))
    ctx.lineTo(Xʼ + INSETS.tick, Y + line.h * (Yʼ - Y))
    ctx.stroke()
  }

  // ... verticals
  for (const line of VLINE) {
    ctx.beginPath()
    ctx.strokeStyle = line.colour
    ctx.lineWidth = line.width
    ctx.setLineDash(line.dash)
    ctx.moveTo(X + line.w * (Xʼ - X), Y + INSETS.tick)
    ctx.lineTo(X + line.w * (Xʼ - X), Yʼ - INSETS.tick)
    ctx.stroke()
  }

  // ... labels
  ctx.font = '20px sans-serif'

  for (const label of XLABELS) {
    const fm = ctx.measureText(label.text)
    ctx.fillStyle = label.colour
    ctx.fillText(label.text, X + label.w * (Xʼ - X) - fm.width / 2, Y + INSETS.tick + fm.fontBoundingBoxAscent)
  }

  for (const label of YLABELS) {
    const fm = ctx.measureText(label.text)
    ctx.fillStyle = label.colour
    ctx.fillText(label.text, X - INSETS.tick - 8 - fm.width, Y + label.h * (Yʼ - Y) + fm.actualBoundingBoxAscent / 2)
  }
}

function drawEnvelope (ctx, w, h, envelope, style) {
  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  const X = bl.x + INSETS.left
  const Y = bl.y - INSETS.bottom
  const Xʼ = br.x - INSETS.right
  const Yʼ = tl.y + INSETS.top

  const xscale = 0.4 * (Xʼ - X)
  const yscale = Yʼ - Y
  let x = X
  let y = Y

  const inflections = envelope.inflections()

  // ... attack
  ctx.beginPath()
  ctx.setLineDash([])
  ctx.strokeStyle = `#ff0000${style.alpha}`
  ctx.lineWidth = 4
  ctx.moveTo(x, y)

  for (const p of inflections.attack) {
    x = X + xscale * p.at
    y = Y + yscale * p.v

    ctx.lineTo(x, y)
  }

  ctx.stroke()

  // ... sustain
  ctx.beginPath()
  ctx.strokeStyle = `#00c0c0${style.alpha}`
  ctx.lineWidth = 4
  ctx.setLineDash([])
  ctx.moveTo(x, y)

  x = X + 0.6 * (Xʼ - X)
  //  y = y

  ctx.lineTo(x, y)
  ctx.stroke()

  // ... release

  ctx.beginPath()
  ctx.strokeStyle = `#ffff00${style.alpha}`
  ctx.lineWidth = 4
  ctx.setLineDash([])
  ctx.moveTo(x, y)

  for (const p of inflections.release) {
    x += xscale * p.at
    y = Y + yscale * p.v

    ctx.lineTo(x, y)
  }

  ctx.stroke()

  // ... inflection points
  for (const p of inflections.attack) {
    x = X + xscale * p.at
    y = Y + yscale * p.v

    if (p.tag === 'A') {
      triangle(ctx, x, y, style)
    } else if (p.tag === 'D') {
      square(ctx, x, y, style)
    } else {
      triangle(ctx, x, y, style)
    }
  }

  for (const p of inflections.release) {
    x = X + 0.6 * (Xʼ - X) + xscale * p.at
    y = Y + yscale * p.v

    if (p.tag === 'R') {
      diamond(ctx, x, y, style)
    } else {
      diamond(ctx, x, y, style)
    }
  }
}

function drawEnvelopeX (ctx, w, h, { attack, decay, sustain, release }, style) {
  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  const X = bl.x + INSETS.left
  const Y = bl.y - INSETS.bottom
  const Xʼ = br.x - INSETS.right
  const Yʼ = tl.y + INSETS.top

  const xscale = 0.4 * (Xʼ - X)
  const yscale = Yʼ - Y
  let x = X
  let y = Y

  // ... attack
  ctx.beginPath()
  ctx.setLineDash([])
  ctx.strokeStyle = `#ff0000${style.alpha}`
  ctx.lineWidth = 4
  ctx.moveTo(x, y)

  x = X + xscale * attack
  y = Y + yscale * 1

  ctx.lineTo(x, y)
  ctx.stroke()

  // ... decay
  ctx.beginPath()
  ctx.setLineDash([])
  ctx.strokeStyle = `#ff0000${style.alpha}`
  ctx.lineWidth = 4
  ctx.moveTo(x, y)

  x += xscale * decay
  y = Y + yscale * sustain

  ctx.lineTo(x, y)
  ctx.stroke()

  // ... sustain
  ctx.beginPath()
  ctx.strokeStyle = `#00c0c0${style.alpha}`
  ctx.lineWidth = 4
  ctx.setLineDash([])
  ctx.moveTo(x, y)

  x = X + 0.6 * (Xʼ - X)
  y = Y + yscale * sustain

  ctx.lineTo(x, y)
  ctx.stroke()

  // ... release

  ctx.beginPath()
  ctx.strokeStyle = `#ffff00${style.alpha}`
  ctx.lineWidth = 4
  ctx.setLineDash([])
  ctx.moveTo(x, y)

  x += xscale * release
  y = Y + yscale * 0

  ctx.lineTo(x, y)
  ctx.stroke()
}

function onMouseDown (canvas, event, envelope, drag) {
  event.preventDefault()

  const width = canvas.width
  const height = canvas.height

  let w = width - 2 * MARGIN
  let h = height - 2 * MARGIN
  const dw = Math.floor(h / 4)
  const dh = Math.floor(h / 4)

  w = dw * Math.floor(w / dw)
  h = dh * Math.floor(h / dh)

  const tl = { x: MARGIN, y: MARGIN }
  const tr = { x: tl.x + w, y: tl.y }
  const br = { x: tr.x, y: tl.y + h }
  const bl = { x: tl.x, y: br.y }

  const X = bl.x + INSETS.left
  const Y = bl.y - INSETS.bottom
  const Xʼ = br.x - INSETS.right
  const Yʼ = tl.y + INSETS.top
  const xscale = 0.4 * (Xʼ - X)
  const yscale = Yʼ - Y

  const gotcha = function (origin, p, icon) {
    drag.dragging = true
    drag.origin = origin
    drag.start = { x: event.offsetX, y: event.offsetY }
    drag.inflection = p
    drag.icon = icon
    drag.context.xscale = xscale
    drag.context.yscale = yscale
    drag.context.X = X
    drag.context.Xʼ = Xʼ
    drag.context.Y = Y
    drag.context.Yʼ = Yʼ
  }

  const inflections = envelope.inflections()

  for (const p of inflections.attack) {
    const x = X + xscale * p.at
    const y = Y + yscale * p.v
    const dx = (canvas.width / 600) * event.offsetX - x // FIXME: 600 is the overlay width in browser units
    const dy = (canvas.height / 308) * event.offsetY - y // FIXME: 308 is the overlay height in browser units
    const r = Math.hypot(dx, dy)

    if (r < 16) {
      gotcha({ x: X, y: Y }, p, triangle)
      drawEnvelope(canvas.getContext('2d'), w, h, envelope, ANIMATE)
      return true
    }
  }

  for (const p of inflections.sustain) {
    const x = X + xscale * p.start
    const y = Y + yscale * p.level
    const dx = (canvas.width / 600) * event.offsetX - x // FIXME: 600 is the overlay width in browser units
    const dxʼ = X + 0.6 * (Xʼ - X) - (canvas.width / 600) * event.offsetX // FIXME: 600 is the overlay width in browser units
    const dy = (canvas.height / 308) * event.offsetY - y // FIXME: 308 is the overlay height in browser units
    const r = dy

    if (dx >= 0 && dxʼ >= 0 && r < 16) {
      gotcha({ x: X, y: Y }, p, circle)
      drawEnvelope(canvas.getContext('2d'), w, h, envelope, ANIMATE)
      return true
    }
  }

  for (const p of inflections.release) {
    const x = X + 0.6 * (Xʼ - X) + xscale * p.at
    const y = Y + yscale * p.v
    const dx = (canvas.width / 600) * event.offsetX - x // FIXME: 600 is the overlay width in browser units
    const dy = (canvas.height / 308) * event.offsetY - y // FIXME: 308 is the overlay height in browser units
    const r = Math.hypot(dx, dy)

    if (r < 16) {
      gotcha({ x: X + 0.6 * (Xʼ - X), y: Yʼ }, p, diamond)
      drawEnvelope(canvas.getContext('2d'), w, h, envelope, ANIMATE)
      return true
    }
  }

  return true
}

function onMouseUp (editor, event, drag) {
  drag.dragging = false

  const p = drag.inflection
  const canvas = event.currentTarget

  const xscale = drag.context.xscale
  const yscale = drag.context.yscale
  const X = drag.origin.x
  const Y = drag.context.Y

  const x = X + xscale * p.at
  const dx = (canvas.width / 600) * (event.offsetX - drag.start.x)
  const xʼ = x + dx
  const at = (xʼ - X) / xscale

  const y = Y + yscale * p.level
  const dy = (canvas.height / 308) * (event.offsetY - drag.start.y)
  const yʼ = y + dy
  const level = (yʼ - Y) / yscale

  const evt = new CustomEvent('changed', {
    detail: {
      tag: drag.inflection.tag,
      at,
      level
    }
  })

  editor.dispatchEvent(evt)
}

function onMouseMove (editor, event, envelope, drag) {
  const p = drag.inflection
  const canvas = event.currentTarget

  const xscale = drag.context.xscale
  const yscale = drag.context.yscale
  const X = drag.origin.x
  const Y = drag.context.Y

  const x = X + xscale * p.at
  const dx = (canvas.width / 600) * (event.offsetX - drag.start.x)
  const xʼ = x + dx
  const at = (xʼ - X) / xscale

  const y = Y + yscale * p.level
  const dy = (canvas.height / 308) * (event.offsetY - drag.start.y)
  const yʼ = y + dy
  const level = (yʼ - Y) / yscale

  const evt = new CustomEvent('change', {
    detail: {
      tag: drag.inflection.tag,
      at,
      level
    }
  })

  editor.dispatchEvent(evt)
}

function triangle (ctx, x, y, style) {
  ctx.beginPath()
  ctx.fillStyle = `#ff0000${style.alpha}`
  ctx.moveTo(x, y - 12)
  ctx.lineTo(x - 12, y + 12)
  ctx.lineTo(x + 12, y + 12)
  ctx.fill()
}

function square (ctx, x, y, style) {
  ctx.beginPath()
  ctx.fillStyle = `#e000e0${style.alpha}`
  ctx.moveTo(x - 12, y - 12)
  ctx.lineTo(x + 12, y - 12)
  ctx.lineTo(x + 12, y + 12)
  ctx.lineTo(x - 12, y + 12)
  ctx.fill()
}

function diamond (ctx, x, y, style) {
  ctx.beginPath()
  ctx.fillStyle = `#ffff00${style.alpha}`
  ctx.moveTo(x, y - 12)
  ctx.lineTo(x + 12, y)
  ctx.lineTo(x, y + 12)
  ctx.lineTo(x - 12, y)
  ctx.fill()
}

function circle (ctx, x, y, style) {
  ctx.beginPath()
  ctx.fillStyle = `#00c0c0${style.alpha}`
  ctx.circle(x, y, 12)
  ctx.fill()
}

customElements.define('snyth-envelope-editor', ENVEditor)
