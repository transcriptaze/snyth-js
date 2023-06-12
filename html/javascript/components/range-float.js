const MARKERS = new Map([
  ['triangle', './images/markers/triangle.svg'],
  ['square', './images/markers/square.svg'],
  ['diamond', './images/markers/diamond.svg'],
  ['circle', './images/markers/circle.svg']
])

export class RangeFloat extends HTMLElement {
  static get observedAttributes () {
    return ['value', 'icon', 'min', 'max', 'default']
  }

  constructor () {
    super()

    this.internal = {
      value: Number.NaN,
      min: 0,
      max: 1,
      defval: 0,
      enabled: false,
      onChange: null,
      onChanged: null
    }

    this.drag = {
      dragging: false,
      start: { x: 0, y: 0, value: 0 },
      last: { x: 0, y: 0, value: 0, timestamp: 0 }
    }

    const template = document.querySelector('#template-range')
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
    const overlay = shadow.querySelector('div.overlay')

    overlay.onpointerdown = (event) => this.onPointerDown(event)
    overlay.onpointerup = (event) => this.onPointerUp(event)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'icon' && MARKERS.has(to)) {
      this.icon = MARKERS.get(to)
    }

    if (name === 'min') {
      this.min = to
    }

    if (name === 'max') {
      this.max = to
    }

    if (name === 'default') {
      this.defval = to
    }

    if (name === 'value') {
      this.value = to
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set enabled (v) {
    this.internal.enabled = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set icon (url) {
    const shadow = this.shadowRoot
    const img = shadow.querySelector('img')

    img.src = url
  }

  get min () {
    return this.internal.min
  }

  set min (v) {
    const val = Number.parseFloat(v)

    if (val && !Number.isNaN(val)) {
      this.internal.min = Math.round(val * 100) / 100
    }
  }

  get max () {
    return this.internal.max
  }

  set max (v) {
    const val = Number.parseFloat(v)

    if (val && !Number.isNaN(val)) {
      this.internal.max = Math.round(val * 100) / 100
    }
  }

  get default () {
    return this.internal.defval
  }

  set default (v) {
    const val = Number.parseFloat(v)

    if (val && !Number.isNaN(val)) {
      this.internal.defval = Math.round(val * 100) / 100
    }
  }

  get value () {
    return Number.isNaN(this.internal.value) ? null : this.internal.value
  }

  set value (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    const val = Number.parseFloat(v)

    this.internal.value = Number.isNaN(val) ? Number.NaN : Math.round(100 * clamp(val, this.min, this.max)) / 100

    input.value = fmt`${this.internal.value} ms`
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChange (handler) {
    this.internal.onChange = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
    this.internal.onChanged = handler
  }

  reset () {
    this.value = this.internal.defval
  }

  onPointerDown (event) {
    const overlay = event.currentTarget
    const v = this.value

    if (this.internal.enabled && !Number.isNaN(v) && event.button === 0) {
      this.drag.dragging = true
      this.drag.start = { x: event.offsetX, y: event.offsetY, value: v }
      this.drag.last = { x: event.offsetX, y: event.offsetY, value: v, timestamp: event.timeStamp }

      overlay.onpointermove = (event) => this.onPointerMove(event)
      overlay.setPointerCapture(event.pointerId)
    }
  }

  onPointerUp (event) {
    if (this.drag.dragging) {
      this.drag.dragging = false

      const overlay = event.currentTarget

      const range = 500 * (this.max - this.min)
      const sx = 2.0 / range
      const sy = 0.5 / range

      const x = this.drag.last.x
      const y = this.drag.last.y

      const dx = x - this.drag.start.x
      const dy = y - this.drag.start.y
      const dv = ((dx * sx) - (dy * sy))
      const v = this.drag.start.value + dv

      this.value = clamp(v, this.min, this.max)

      if (this.internal.onChanged) {
        this.internal.onChanged(this.value)
      }

      overlay.onpointermove = null
      overlay.releasePointerCapture(event.pointerId)
    }
  }

  onPointerMove (event) {
    if (this.drag.dragging) {
      const range = 500 * (this.max - this.min)
      const sx = 2.0 / range
      const sy = 0.5 / range
      const dt = event.timeStamp - this.drag.last.timestamp

      if (dt > 0) {
        const vx = Math.abs(event.movementX / dt)
        const vy = Math.abs(event.movementY / dt)

        const x = this.drag.last.x + Math.min(2, vx / 2) * (event.offsetX - this.drag.last.x)
        const y = this.drag.last.y + Math.min(1.5, vy / 2) * (event.offsetY - this.drag.last.y)

        const dx = x - this.drag.start.x
        const dy = y - this.drag.start.y
        const dv = (dx * sx - dy * sy)
        const v = this.drag.start.value + dv

        this.drag.last.x = x
        this.drag.last.y = y
        this.drag.last.timestamp = event.timeStamp

        this.value = clamp(v, this.min, this.max)

        if (this.internal.onChange) {
          this.internal.onChange(this.value)
        }
      }
    }
  }
}

function fmt (strings, val) {
  if (!Number.isNaN(val)) {
    return `${Math.round(100 * val) / 100}`
  }

  return ''
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-range-float', RangeFloat)
