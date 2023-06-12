const sin = (v) => { return Math.sin(v * Math.PI / 180) }
const cos = (v) => { return Math.cos(v * Math.PI / 180) }

export class KnobF extends HTMLElement {
  static get observedAttributes () {
    return ['oid', 'tag', 'label', 'min', 'max', 'steps', 'default', 'value', 'dot-colour', 'dot-color']
  }

  constructor () {
    super()

    this.internal = {
      tag: '',
      oid: '',
      label: '',
      min: 0.1,
      max: 10,
      steps: 20,
      default: 0.1,

      dotColour: '#4eccffff'
    }

    this.drag = {
      dragging: false,
      startX: 0,
      startY: 0,
      startValue: false
    }

    const template = document.querySelector('#template-lfo-frequency')
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
    const object = shadow.querySelector('object')
    const overlay = shadow.querySelector('div.overlay')
    const drag = this.drag

    overlay.onpointerdown = (event) => this.onPointerDown(event, drag)
    overlay.onpointerup = (event) => this.onPointerUp(event, drag)
    overlay.oncontextmenu = (event) => this.onReset(event)

    // ... redraw when svg has loaded
    object.onload = (e) => {
      this.redraw()
    }
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'oid') {
      this.oid = to
    }

    if (name === 'tag') {
      this.tag = to
    }

    if (name === 'label') {
      this.label = to
    }

    if (name === 'min') {
      this.min = to
    }

    if (name === 'max') {
      this.max = to
    }

    if (name === 'steps') {
      this.steps = to
    }

    if (name === 'default') {
      this.defval = to
    }

    if (name === 'value') {
      this.value = to
    }

    if (name === 'dot-colour' || name === 'dot-color') {
      this.dotColour = to
    }
  }

  get oid () {
    return this.internal.oid
  }

  set oid (v) {
    this.internal.oid = v
  }

  get tag () {
    return this.internal.tag
  }

  set tag (v) {
    this.internal.tag = v
  }

  get label () {
    return this.internal.label
  }

  set label (v) {
    this.internal.label = v

    this.redraw()
  }

  get min () {
    return this.internal.min
  }

  set min (v) {
    this.internal.min = parseFloat(v)
  }

  get max () {
    return this.internal.max
  }

  set max (v) {
    this.internal.max = parseFloat(v)
  }

  get steps () {
    return this.internal.steps
  }

  set steps (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    if (v === 'any') {
      input.step = 'any'
    } else {
      this.internal.steps = parseInt(v)

      input.step = (input.max - input.min) / this.internal.steps
    }
  }

  get defval () {
    return this.internal.default
  }

  set defval (v) {
    this.internal.default = parseFloat(v)
  }

  get value () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    const min = Math.log10(this.min)
    const max = Math.log10(this.max)
    const m = (max - min) / (input.max - input.min)
    const c = min - m * input.min
    const expv = Math.pow(10, m * input.value + c)

    return expv
  }

  set value (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    const min = Math.log10(this.min)
    const max = Math.log10(this.max)
    const m = (max - min) / (input.max - input.min)
    const c = min - m * input.min
    const logv = (Math.log10(v) - c) / m

    input.value = logv

    this.redraw()
  }

  get dotColour () {
    return this.internal.dotColour
  }

  set dotColour (v) {
    this.internal.dotColour = v
  }

  get dotColor () {
    return this.internal.gridColour
  }

  set dotColor (v) {
    this.internal.gridColour = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchange (handler) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.addEventListener('change', () => {
      handler(this.tag, this.value)
    })
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (handler) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.addEventListener('changed', () => {
      handler(this.tag, this.value)
    })
  }

  onReset (event) {
    event.preventDefault()

    this.reset()

    if (this.internal.onChanged != null) {
      this.internal.onChanged(this)
    }

    return true
  }

  onPointerDown (event, drag) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const overlay = event.currentTarget

    if (event.button === 0 && (!event.ctrlKey || event.altKey)) {
      event.preventDefault()

      drag.dragging = true
      drag.startX = event.clientX
      drag.startY = event.clientY
      drag.startValue = parseFloat(input.value)

      overlay.classList.add('dragging')
      overlay.onpointermove = (event) => this.onPointerMove(event, drag)
      overlay.setPointerCapture(event.pointerId)

      return true
    }
  }

  onPointerUp (event, drag) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const overlay = shadow.querySelector('div.overlay')

    if (event.button === 0 && (!event.ctrlKey || event.altKey)) {
      event.preventDefault()

      overlay.onpointermove = null
      overlay.releasePointerCapture(event.pointerId)

      if (drag.dragging) {
        drag.dragging = false

        const w = overlay.clientWidth
        const h = overlay.clientHeight
        const range = this.max - this.min

        const dx = -(drag.startX - event.clientX) / 2.5 // 1.5
        const dy = (drag.startY - event.clientY) / 5 // 0.75
        const delta = range * (dx / w + dy / h)

        input.value = clamp(drag.startValue + delta, input.min, input.max)
        input.dispatchEvent(new InputEvent('changed'))

        this.redraw()

        return true
      }
    }
  }

  onPointerMove (event, drag) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const overlay = shadow.querySelector('div.overlay')

    event.preventDefault()

    if (drag.dragging) {
      const w = overlay.clientWidth
      const h = overlay.clientHeight
      const range = this.max - this.min

      const dx = -(drag.startX - event.clientX) / 2.5 // 1.5
      const dy = (drag.startY - event.clientY) / 5 // 0.75
      const delta = range * (dx / w + dy / h)
      const previous = input.value

      input.value = clamp(drag.startValue + delta, input.min, input.max)

      if (input.value !== previous) {
        input.dispatchEvent(new InputEvent('change'))
      }

      this.redraw()

      return true
    }
  }

  get radius () {
    const shadow = this.shadowRoot
    const object = shadow.querySelector('object')
    const svg = object.contentDocument
    const indicator = svg.getElementsByClassName('indicator')[0]
    const indicatorBG = svg.getElementsByClassName('indicator-bg')[0]
    const radius = parseFloat(indicatorBG.attributes.r.value)
    const edge = parseFloat(indicatorBG.attributes['stroke-width'].value)
    const stroke = parseFloat(indicator.attributes['stroke-width'].value)

    return radius - edge / 2 - stroke / 2
  }

  reset () {
    this.value = this.defval
  }

  redraw () {
    try {
      const shadow = this.shadowRoot
      const input = shadow.querySelector('input')
      const object = shadow.querySelector('object')
      const svg = object.contentDocument
      const ring = svg.querySelector('.indicator')
      const dot = svg.querySelector('.dot')
      const label = svg.querySelector('.label')

      label.innerHTML = this.internal.label

      const value = input.value
      const min = input.min
      const max = input.max
      const normalized = (value - min) / (max - min)
      const r = this.radius
      const wedge = 30 // degrees

      const theta = normalized * (360 - wedge)
      const angle = wedge / 2 + theta
      const x0 = r * cos(wedge / 2)
      const y0 = r * sin(wedge / 2)
      const x1 = r * cos(angle)
      const y1 = r * sin(angle)

      // .. rotate by 90° and flip horizontally
      const X0 = -y0
      const Y0 = +x0
      const X1 = -y1
      const Y1 = +x1

      if (normalized > 0.5) {
        ring.setAttribute('d', `M${X0},${Y0} A${r},${r},0,0,1,${0},${-r} A${r},${r},0,0,1,${X1},${Y1} `)
      } else {
        ring.setAttribute('d', `M${X0},${Y0} A${r},${r},0,0,1,${X1},${Y1}`)
      }

      dot.style.transform = `rotate(${angle}deg)`
      dot.setAttribute('fill', this.internal.dotColour)
    } catch (err) {
      // IGNORE (not loaded yet)
    }
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-lfo-frequency', KnobF)
