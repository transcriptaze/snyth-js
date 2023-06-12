const PI = Math.PI
const sin = (v) => { return Math.sin(v * Math.PI / 180) }
const cos = (v) => { return Math.cos(v * Math.PI / 180) }

export class Volume extends HTMLElement {
  static get observedAttributes () {
    return ['level-width', 'min', 'max', 'step', 'default', 'value']
  }

  constructor () {
    super()

    this.internal = {
      loaded: false,
      innerRadius: 16.75,
      outerRadius: 39,
      levelWidth: 1.5,
      level: 1,
      dropping: 0
    }

    this.drag = {
      dragging: false,
      startX: 0,
      startY: 0,
      startValue: false
    }

    const template = document.querySelector('#template-controls-knob')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)

    window.addEventListener('load', () => {
      const { inner, outer } = radii(shadow)

      this.internal.innerRadius = inner
      this.internal.outerRadius = outer
      this.internal.loaded = true

      this.redraw()
    })
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
    try {
      if (this.internal.loaded) {
        const shadow = this.shadowRoot
        const { inner, outer } = radii(shadow)

        this.internal.innerRadius = inner
        this.internal.outerRadius = outer
      }
    } catch (err) {
      console.error(err)
    }
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'level-width') {
      this.levelWidth = to
    }

    if (name === 'min') {
      this.min = to
    }

    if (name === 'max') {
      this.max = to
    }

    if (name === 'step') {
      this.step = to
    }

    if (name === 'default') {
      this.defval = to
    }

    if (name === 'value') {
      this.value = to
    }
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

  get level () {
    return this.internal.level
  }

  set level (v) {
    this.internal.level = v
    this.redraw('level')
  }

  get dropping () {
    return this.internal.dropping
  }

  set dropping (v) {
    this.internal.dropping = v

    const shadow = this.shadowRoot
    const svg = shadow.querySelector('svg')
    const led = svg.querySelector('#led')
    const brightness = clamp(1.0 * this.internal.dropping, 0, 1.0)

    led.setAttribute('opacity', `${brightness}`)
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
    const overlay = shadow.querySelector('div.overlay')

    overlay.addEventListener('mouseup', () => {
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

  reset () {
    this.value = this.defval
  }

  redraw (scope) {
    const shadow = this.shadowRoot

    if (!this.internal.loaded) {
      return
    }

    if (scope == null || scope !== 'level') {
      const svg = shadow.querySelector('svg')
      const ring = svg.querySelector('.indicator')
      const dot = svg.querySelector('.dot')

      // ... calculate rotation stuff
      const value = this.value
      const min = this.min
      const max = this.max
      const normalized = (value - min) / (max - min)
      const r = this.internal.innerRadius
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
        ring.setAttribute('d', `M${X0},${Y0} A${r},${r},0,0,1,${0},${-r} A${r},${r},0,0,1,${X1},${Y1}`)
      } else {
        ring.setAttribute('d', `M${X0},${Y0} A${r},${r},0,0,1,${X1},${Y1}`)
      }

      dot.style.transform = `rotate(${angle}deg)`
    }

    // ... update canvas
    const canvas = shadow.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const x = width / 2
    const y = height / 2
    const scale = 208 / 100
    const rʼ = scale * (this.internal.outerRadius + this.internal.levelWidth)
    const θ0 = PI * (90 + 15) / 180
    const θ1 = PI * (360 + 90 - 15) / 180
    const dθ = this.level * this.value * (θ1 - θ0)
    const gradient = ctx.createConicGradient(θ0, x, y)

    gradient.addColorStop(0.0, 'green')
    gradient.addColorStop(0.5 * 330 / 360, 'yellow')
    gradient.addColorStop(0.75 * 330 / 360, 'orange')
    gradient.addColorStop(1.0 * 330 / 360, 'red')
    gradient.addColorStop(1.0, 'red')

    ctx.clearRect(0, 0, width, height)

    ctx.beginPath()
    ctx.fillStyle = '#222222ff'
    ctx.ellipse(x, y, rʼ, rʼ, 0, 0, 2 * PI)
    ctx.fill()

    ctx.beginPath()
    ctx.fillStyle = gradient
    ctx.moveTo(x, y)
    ctx.arc(x, y, rʼ, θ0, θ0 + dθ)
    ctx.fill()
  }
}

function radii (shadow) {
  const svg = shadow.querySelector('svg')
  const bg = svg.querySelector('.bg')
  const indicator = svg.getElementsByClassName('indicator')[0]
  const indicatorBG = svg.getElementsByClassName('indicator-bg')[0]
  const radius = parseFloat(indicatorBG.attributes.r.value)
  const edge = parseFloat(indicatorBG.attributes['stroke-width'].value)
  const stroke = parseFloat(indicator.attributes['stroke-width'].value)

  const inner = radius - edge / 2 - stroke / 2
  const outer = bg.getBBox({ stroke: true }).width + 1

  return { inner, outer }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-volume', Volume)
