const PI = Math.PI
const HMARGIN = 24
const VMARGIN = 24
const RADIUS = 16

const COLUMNS = [112, 112, 112, 24, 112, 112, 24, 112, 112, 24, 112, 112]
const COLOURS = ['#222222ff', '#ffff00ff', '#ff00ffff',
  '#00000000',
  '#ff0000ff', '#ff0000ff',
  '#00000000',
  '#00ff00ff', '#00ff00ff',
  '#00000000',
  '#0000ffff', '#0000ffff'
]

export class PatchPanel extends HTMLElement {
  constructor () {
    super()

    this.internal = {
      onChange: null,
      onChanged: null,
      state: new Map([
        ['lfo.1', false],
        ['lfo.2', false],
        ['lfo.3', false],
        ['lfo.4', false]
      ])
    }

    this.drag = {
      dragging: false,
      interconnect: null,
      start: { x: 0, y: 0 },
      dx: 0,
      dy: 0
    }

    const template = document.querySelector('#template-patch-panel')
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
    this.internal.onChange = listener
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (listener) {
    this.internal.onChanged = listener
  }

  on (tag, on) {
    this.internal.state.set(tag, on)
    this.redraw()
  }

  onPointerDown (event) {
    if (event.button === 0) {
      const shadow = this.shadowRoot
      const canvas = shadow.querySelector('canvas.plugs')
      const overlay = shadow.querySelector('canvas.overlay')

      onMouseDown(event, canvas, overlay, this.drag)

      if (this.drag.dragging) {
        overlay.onpointermove = (event) => {
          onMouseMove(event, canvas, overlay, this.drag)
          this.drawInterconnects(canvas, overlay)
        }

        overlay.setPointerCapture(event.pointerId)
      }
    }
  }

  onPointerUp (event) {
    const shadow = this.shadowRoot
    const canvas = shadow.querySelector('canvas.plugs')
    const overlay = shadow.querySelector('canvas.overlay')

    overlay.onpointermove = null
    overlay.releasePointerCapture(event.pointerId)

    if (this.drag.dragging) {
      const patch = onMouseUp(event, canvas, overlay, this.drag)

      if (patch != null && this.internal.onChanged != null) {
        this.internal.onChanged(patch.tag, patch.plug)
      }

      this.redraw()
    }
  }

  initialise (patches) {
    interconnects.forEach((v) => {
      const tag = v.tag

      if (patches.has(tag)) {
        const plug = patches.get(tag)

        if (plug === '') {
          v.plug = ''
          v.end.row = v.start.row
          v.end.column = 0
        } else {
          for (const p of plugs) {
            if (p.id === plug) {
              v.plug = p.id
              v.end.row = p.row
              v.end.column = p.column
            }
          }
        }
      }
    })

    this.redraw()
  }

  redraw () {
    const shadow = this.shadowRoot
    const canvas = shadow.querySelector('canvas.plugs')
    const overlay = shadow.querySelector('canvas.overlay')

    this.drawPatchBay(canvas)
    this.drawInterconnects(canvas, overlay)
  }

  drawPatchBay (canvas) {
    const width = canvas.width
    const height = canvas.height
    const rect = { w: 104, h: 53, radius: 10 }
    const dh = 64
    const top = (height - 2 * VMARGIN - 3 * dh) / 2
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, width, height)
    ctx.font = '20px sans-serif'

    // draw LFO sources
    ctx.beginPath()
    ctx.fillStyle = '#44444480'
    ctx.roundRect(HMARGIN, top, 64, 3 * dh + rect.h, rect.radius)
    ctx.fill()

    for (const plug of sources) {
      const x = HMARGIN
      const y = top + plug.row * dh
      const w = 64
      const xʼ = x + w / 2

      ctx.beginPath()
      ctx.fillStyle = plug.fill
      ctx.strokeStyle = plug.stroke
      ctx.ellipse(xʼ, y + rect.h / 2, RADIUS, RADIUS, 0, 0, 2 * PI)
      ctx.fill()
      ctx.stroke()
    }

    // draw plugs
    const columns = COLUMNS.map((u, i, m) => m.slice(0, i).reduce((a, v) => a + v, 0))
    const x0 = width - COLUMNS.reduce((w, v) => w + v, 0) - HMARGIN + (112 - rect.w)

    for (const plug of plugs) {
      const x = x0 + columns[plug.column]
      const y = top + plug.row * dh
      const fm = ctx.measureText(plug.label)

      if (plug.style === 'blank') {
        ctx.beginPath()
        ctx.fillStyle = '#44444480'
        ctx.roundRect(x + rect.w - 64, y, 64, rect.h, rect.radius)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.fillStyle = '#44444480'
        ctx.roundRect(x, y, rect.w, rect.h, rect.radius)
        ctx.fill()
      }

      const xʼ = (plug.style === 'label-right') ? x + RADIUS + 20 : x + rect.w - RADIUS - 20
      const dxʼ = (plug.style === 'label-right') ? RADIUS + 12 : -RADIUS - fm.width - 12

      ctx.beginPath()
      ctx.fillStyle = plug.fill
      ctx.strokeStyle = plug.stroke
      ctx.ellipse(xʼ, y + rect.h / 2, RADIUS, RADIUS, 0, 0, 2 * PI)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = plug.text
      ctx.fillText(plug.label, xʼ + dxʼ, y + rect.h / 2 + fm.actualBoundingBoxAscent / 2)
    }
  }

  drawInterconnects (canvas, overlay) {
    const drag = this.drag
    const ctx = overlay.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const rect = { w: 104, h: 53, radius: 10 }
    const dw = 64
    const dh = 64
    const top = (height - 2 * VMARGIN - 3 * dh) / 2
    const columns = COLUMNS.map((u, i, m) => m.slice(0, i).reduce((a, v) => a + v, 0))
    const x0 = width - COLUMNS.reduce((w, v) => w + v, 0) - HMARGIN + (112 - rect.w)

    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const draw = function (patch, plug, on) {
      const x = HMARGIN + dw / 2
      const y = top + patch.start.row * dh + rect.h / 2
      const xʼ = (plug.style === 'label-right') ? x0 + columns[patch.end.column] + RADIUS + 20 : x0 + columns[patch.end.column] + rect.w - RADIUS - 20
      const yʼ = top + patch.end.row * dh + rect.h / 2
      let dx = 0
      let dy = 0

      if (drag.dragging && patch === drag.interconnect) {
        dx = drag.dx
        dy = drag.dy
      }

      const gradient = ctx.createLinearGradient(x + 1, y + 1, xʼ + 2 * dx + 1, yʼ + 2 * dy + 1)

      gradient.addColorStop(0.0, `${patch.colour}`)
      gradient.addColorStop(1 / 6, `${patch.colour}`)
      gradient.addColorStop(0.5, COLOURS[patch.end.column])
      gradient.addColorStop(5 / 6, jacks.get(plug.label))
      gradient.addColorStop(1, jacks.get(plug.label))

      const style = on ? gradient : `${patch.colour}80`

      ctx.beginPath()
      ctx.strokeStyle = style
      ctx.lineWidth = 30
      ctx.lineCap = 'round'
      ctx.moveTo(x, y)
      catenary(ctx, x + 1, y + 1, xʼ + dx + 1, yʼ + dy + 1) // +1 is a hack to centre the jacks in the plugs
      ctx.stroke()
    }

    let count = 0
    let col = 0
    while (count < 4 && col < 12) {
      for (const patch of interconnects) {
        if (patch.end.column !== col) {
          continue
        }

        for (const plug of plugs) {
          if (plug.column === patch.end.column && plug.row === patch.end.row) {
            draw(patch, plug, this.internal.state.get(patch.tag))
            count++
            break
          }
        }
      }

      col++
    }
  }
}

function catenary (ctx, x0, y0, x1, y1) {
  const a = 100
  const w = 1
  const h = Math.cosh(w)
  const d = Math.abs(x1 - x0) / 2

  const N = 32
  const dx = (x1 - x0) / N
  const dy = (y1 - y0) / N
  const mx = (x1 + x0) / 2

  ctx.moveTo(x0, y0)

  for (let i = 1; i < N; i++) {
    const x = x0 + i * dx
    const xʼ = (x - mx) / d
    const y = y0 + i * dy + a * (h - (Math.cosh(xʼ)))

    ctx.lineTo(x, y)
  }

  ctx.lineTo(x1, y1)
}

function onMouseDown (event, canvas, overlay, drag) {
  event.preventDefault()

  const width = canvas.width
  const height = canvas.height
  const x = event.offsetX * 1200 / 600
  const y = (event.offsetY - (overlay.offsetHeight - overlay.clientHeight)) * 300 / 150

  for (const patch of interconnects) {
    for (const plug of plugs) {
      if (plug.column === patch.end.column && plug.row === patch.end.row) {
        if (hittest(x, y, patch, plug, { width, height })) {
          drag.start = { x, y }
          drag.dx = 0
          drag.dy = 0
          drag.interconnect = patch
          drag.dragging = true
          return
        }
      }
    }
  }
}

function onMouseMove (event, canvas, overlay, drag) {
  const x = event.offsetX * 1200 / 600
  const y = (event.offsetY - (overlay.offsetHeight - overlay.clientHeight)) * 300 / 150

  drag.dx = x - drag.start.x
  drag.dy = y - drag.start.y
}

function hittest (x, y, patch, plug, { width, height }) {
  const rect = { w: 104, h: 53, radius: 10 }
  const dh = 64
  const top = (height - 2 * VMARGIN - 3 * dh) / 2
  const columns = COLUMNS.map((u, i, m) => m.slice(0, i).reduce((a, v) => a + v, 0))
  const x0 = width - COLUMNS.reduce((w, v) => w + v, 0) - HMARGIN + (112 - rect.w)

  const xʼ = (plug.style === 'label-right') ? x0 + columns[patch.end.column] + RADIUS + 20 : x0 + columns[patch.end.column] + rect.w - RADIUS - 20
  const yʼ = top + patch.end.row * dh + rect.h / 2

  const dx = x - xʼ
  const dy = y - yʼ
  const dr = Math.hypot(dx, dy)

  return dr < RADIUS
}

function onMouseUp (event, canvas, overlay, drag) {
  drag.dragging = false

  const cursor = {
    x: event.offsetX * 1200 / 600,
    y: (event.offsetY - (overlay.offsetHeight - overlay.clientHeight)) * 300 / 150
  }

  const width = canvas.width
  const height = canvas.height
  const dh = 64
  const top = (height - 2 * VMARGIN - 3 * dh) / 2
  const radius = RADIUS

  const rect = { w: 104, h: 53, radius: 10 }
  const columns = COLUMNS.map((u, i, m) => m.slice(0, i).reduce((a, v) => a + v, 0))
  const x0 = width - COLUMNS.reduce((w, v) => w + v, 0) - HMARGIN + (112 - rect.w)

  /* eslint-disable-next-line no-labels */
  loop:
  for (const plug of plugs) {
    const x = x0 + columns[plug.column]
    const y = top + plug.row * dh

    const xʼ = (plug.style === 'label-right') ? x + RADIUS + 20 : x + rect.w - RADIUS - 20
    const yʼ = y + rect.h / 2

    const dx = cursor.x - xʼ
    const dy = cursor.y - yʼ
    const dr = Math.hypot(dx, dy)

    if (dr <= radius + 12) {
      for (const patch of interconnects) {
        if (patch !== drag.interconnect) {
          if (patch.end.row === plug.row && patch.end.column === plug.column) {
            /* eslint-disable-next-line no-labels */
            break loop
          }
        }
      }

      drag.interconnect.end.row = plug.row
      drag.interconnect.end.column = plug.column
      drag.interconnect.plug = plug.id

      break
    }
  }

  return drag.interconnect
}

/* eslint-disable no-multi-spaces */
const sources = [
  { row: 0, fill: '#ffb300c0', stroke: '#ffb30080', text: '#4eccffd0' },
  { row: 1, fill: '#ff0000c0', stroke: '#ff000080', text: '#4eccffd0' },
  { row: 2, fill: '#00ff00c0', stroke: '#00ff0080', text: '#4eccffd0' },
  { row: 3, fill: '#0080fec0', stroke: '#0080fe80', text: '#4eccffd0' }
]

const plugs = [
  { id: '', row: 0, column: 0, style: 'blank', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '' },
  { id: '', row: 1, column: 0, style: 'blank', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '' },
  { id: '', row: 2, column: 0, style: 'blank', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '' },
  { id: '', row: 3, column: 0, style: 'blank', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '' },

  { id: 'volume', row: 0, column: 1, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'V' },
  { id: 'gain',   row: 1, column: 1, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'G' },
  { id: '',       row: 2, column: 1, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '' },
  { id: '',       row: 3, column: 1, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '' },

  { id: 'attack',  row: 0, column: 2, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'A' },
  { id: 'decay',   row: 1, column: 2, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'D' },
  { id: 'sustain', row: 2, column: 2, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'S' },
  { id: 'release', row: 3, column: 2, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'R' },

  { id: 'R.ε', row: 0, column: 4, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'ε' },
  { id: 'R.𝗌', row: 1, column: 4, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '𝗌' },
  { id: 'R.θ', row: 2, column: 4, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'θ' },
  { id: 'R.a', row: 3, column: 4, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'a' },

  { id: 'R.δx', row: 0, column: 5, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'δx' },
  { id: 'R.δy', row: 1, column: 5, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'δy' },
  { id: 'R.𝜓',  row: 2, column: 5, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '𝜓' },
  { id: 'R.b',  row: 3, column: 5, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'b' },

  { id: 'G.ε', row: 0, column: 7, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'ε' },
  { id: 'G.𝗌', row: 1, column: 7, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '𝗌' },
  { id: 'G.θ', row: 2, column: 7, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'θ' },
  { id: 'G.a', row: 3, column: 7, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'a' },

  { id: 'G.δx', row: 0, column: 8, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'δx' },
  { id: 'G.δy', row: 1, column: 8, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'δy' },
  { id: 'G.𝜓',  row: 2, column: 8, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '𝜓' },
  { id: 'G.b',  row: 3, column: 8, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'b' },

  { id: 'B.ε', row: 0, column: 10, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'ε' },
  { id: 'B.𝗌', row: 1, column: 10, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '𝗌' },
  { id: 'B.θ', row: 2, column: 10, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'θ' },
  { id: 'B.a', row: 3, column: 10, style: 'label-left', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'a' },

  { id: 'B.δx', row: 0, column: 11, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'δx' },
  { id: 'B.δy', row: 1, column: 11, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'δy' },
  { id: 'B.𝜓',  row: 2, column: 11, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: '𝜓' },
  { id: 'B.b',  row: 3, column: 11, style: 'label-right', fill: '#808080c0', stroke: '#808080ff', text: '#4eccffd0', label: 'b' }
]

const interconnects = [
  { tag: 'lfo.1', plug: 'volume', start: { row: 0 }, end: { row: 0, column: 1 }, colour: '#cc8f00' }, // '#ffb300'
  { tag: 'lfo.2', plug: 'gain',   start: { row: 1 }, end: { row: 1, column: 1 }, colour: '#cc0000' }, // '#ff0000'
  { tag: 'lfo.3', plug: null,     start: { row: 2 }, end: { row: 2, column: 0 }, colour: '#2f9c02' }, // '#3bc403'
  { tag: 'lfo.4', plug: null,     start: { row: 3 }, end: { row: 3, column: 0 }, colour: '#0044cb' }  // '#0080fe'
]

const jacks = new Map([
  ['',  '#444444ff'], // black
  ['V', '#9c27b0ff'], // purple
  ['G', '#e91e63ff'], // pink
  ['A', '#ffeb3bff'], // yellow
  ['D', '#00bcd4ff'], // cyan
  ['S', '#009688ff'], // teal
  ['R', '#795548ff'], // brown
  ['ε', '#3f51b5ff'], // indigo
  ['𝗌', '#673ab7ff'], // violet
  ['θ', '#ff00ffff'], // magenta
  ['a', '#ffd700ff'], // gold
  ['δx', '#40e0d0ff'], // turquoise
  ['δy', '#dda0ddff'], // plum
  ['𝜓', '#ff7f50ff'], // coral
  ['b', '#808000ff'] // olive
])

/* eslint-enable no-multi-spaces */

customElements.define('snyth-patch-panel', PatchPanel)
