export class ProgressBar extends HTMLElement {
  static get observedAttributes () {
    return []
  }

  constructor () {
    super()

    this.internal = {
      at: 50,
      duration: 100
    }

    const template = document.querySelector('#template-progressbar')
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
    this.redraw()
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
  }

  get at () {
    return this.internal.at
  }

  set at (v) {
    const t = parseFloat(v)

    if (!Number.isNaN(t)) {
      this.internal.at = clamp(t, 0, this.duration)
      this.redraw()
    }
  }

  get duration () {
    return this.internal.duration
  }

  set duration (v) {
    const t = parseFloat(v)

    if (!Number.isNaN(t)) {
      this.internal.duration = clamp(t, 0, 900)
      this.redraw()
    }
  }

  reset () {
    this.at = 0
  }

  redraw () {
    const shadow = this.shadowRoot
    const svg = shadow.querySelector('svg')
    const line = svg.querySelector('.at')

    const at = this.at
    const duration = this.duration
    const x2 = duration === 0 ? 0 : 512 * clamp(at / duration, 0, 1)

    line.setAttribute('x2', `${x2}`)
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-progressbar', ProgressBar)
