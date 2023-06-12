const sin = (v) => { return Math.sin(v * Math.PI / 180) }
const cos = (v) => { return Math.cos(v * Math.PI / 180) }

export class Knob extends HTMLElement {
  static get observedAttributes () {
    return ['label', 'min', 'max', 'step', 'default', 'value']
  }

  constructor () {
    super()

    const template = document.querySelector('#template-knob')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)

    this.drag = {
      dragging: false,
      startX: 0,
      startY: 0,
      startValue: false
    }
  }

  connectedCallback () {
    const shadow = this.shadowRoot
    const overlay = shadow.querySelector('div.overlay')
    const drag = this.drag

    overlay.onpointerdown = (event) => this.onPointerDown(event, drag)
    overlay.onpointerup = (event) => this.onPointerUp(event, drag)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    if (name === 'label') {
      this.label = to
    }

    if (name === 'min') {
      input.min = to
    }

    if (name === 'max') {
      input.max = to
    }

    if (name === 'step') {
      input.step = to
    }

    if (name === 'default') {
      input.dataset.default = to
    }

    if (name === 'value') {
      input.value = to
    }
  }

  get label () {
    const shadow = this.shadowRoot
    const object = shadow.querySelector('object')
    const svg = object.contentDocument
    const label = svg.getElementsByClassName('label')[0]

    return label.innerHTML
  }

  set label (v) {
    const shadow = this.shadowRoot
    const object = shadow.querySelector('object')
    const svg = object.contentDocument
    const label = svg.getElementsByClassName('label')[0]

    label.innerHTML = v
  }

  get min () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return parseFloat(input.min)
  }

  set min (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.min = v
  }

  get max () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return parseFloat(input.max)
  }

  set max (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.max = v
  }

  get step () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return input.step
  }

  set step (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.step = v
  }

  get defval () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return parseFloat(input.dataset.default)
  }

  set defval (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.dataset.default = v
  }

  get value () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return parseFloat(input.value)
  }

  set value (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.value = v
    input.dispatchEvent(new InputEvent('change'))

    this.redraw()
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChange (handler) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.addEventListener('change', () => {
      handler(this.value)
    })
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.addEventListener('changed', () => {
      handler(this.value)
    })
  }

  onPointerDown (event, drag) {
    const overlay = event.currentTarget

    event.preventDefault()

    if (event.button === 0) {
      drag.dragging = true
      drag.startX = event.clientX
      drag.startY = event.clientY
      drag.startValue = parseFloat(this.value)

      overlay.classList.add('dragging')
      overlay.onpointermove = (event) => this.onPointerMove(event, drag)
      overlay.setPointerCapture(event.pointerId)

      return true
    }
  }

  onPointerUp (event, drag) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const overlay = event.currentTarget

    event.preventDefault()

    overlay.onpointermove = null
    overlay.releasePointerCapture(event.pointerId)

    if (drag.dragging) {
      drag.dragging = false
      input.dispatchEvent(new Event('changed'))

      return true
    }
  }

  onPointerMove (event, drag) {
    const overlay = event.currentTarget

    event.preventDefault()

    if (drag.dragging) {
      const w = overlay.clientWidth
      const h = overlay.clientHeight
      const range = this.max - this.min

      const dx = -(drag.startX - event.clientX) / 1.5
      const dy = (drag.startY - event.clientY) / 0.75
      const delta = range * (dx / w + dy / h)

      this.value = clamp(drag.startValue + delta, this.min, this.max)
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
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.value = this.defval

    this.redraw()
  }

  redraw () {
    const shadow = this.shadowRoot
    const object = shadow.querySelector('object')
    const svg = object.contentDocument
    const ring = svg.querySelector('.indicator')

    const value = this.value
    const min = this.min
    const max = this.max
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
    const X0 = -y0 // x0*cos(90) - y0*sin(90)
    const Y0 = x0 // x0*sin(90) + y0*cos(90)
    const X1 = -y1 // x1*cos(90) - y1*sin(90)
    const Y1 = x1 // x1*sin(90) + y1*cos(90)

    if (normalized > 0.5) {
      ring.setAttribute('d', `M${X0},${Y0} A${r},${r},0,0,1,${0},${-r} A${r},${r},0,0,1,${X1},${Y1} `)
    } else {
      ring.setAttribute('d', `M${X0},${Y0} A${r},${r},0,0,1,${X1},${Y1}`)
    }
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-knob', Knob)
