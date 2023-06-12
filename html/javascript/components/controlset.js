const PI = Math.PI

export class ControlSet extends HTMLElement {
  static get observedAttributes () {
    return ['tag']
  }

  constructor () {
    super()

    const template = document.querySelector('#template-controlset')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)

    this.internal = {
      tag: '',

      controls: {
        eccentricity: shadow.querySelector('div.controls [tag="ε"]'),
        sensitivity: shadow.querySelector('div.controls [tag="𝗌"]'),
        rotation: shadow.querySelector('div.controls [tag="θ"]'),
        amplitude: shadow.querySelector('div.controls [tag="a"]'),
        shiftx: shadow.querySelector('div.controls [tag="δx"]'),
        shifty: shadow.querySelector('div.controls [tag="δy"]'),
        phase: shadow.querySelector('div.controls [tag="Φ"]'),
        psi: shadow.querySelector('div.controls [tag="𝜓"]'),
        balance: shadow.querySelector('div.controls [tag="b"]'),

        shape: shadow.querySelector('div.selectors [tag="shape"]'),
        multiplier: shadow.querySelector('div.selectors [tag="m"]')
      }
    }
  }

  connectedCallback () {
    const shadow = this.shadowRoot
    const icon = shadow.querySelector('img.icon')

    icon.oncontextmenu = (event) => onReset(this, event)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'tag') {
      this.tag = to
    }
  }

  get tag () {
    return this.internal.tag
  }

  set tag (v) {
    this.internal.tag = v
  }

  get multiplier () {
    return Number(this.internal.controls.multiplier.value)
  }

  get eccentricity () {
    return Number(this.internal.controls.eccentricity.value)
  }

  get sensitivity () {
    return Number(this.internal.controls.sensitivity.value)
  }

  get rotation () {
    return Number(this.internal.controls.rotation.value)
  }

  get amplitude () {
    return Number(this.internal.controls.amplitude.value)
  }

  get shiftx () {
    const v = Number(this.internal.controls.shiftx.value)

    return Math.atan(PI * v) / Math.atan(PI)
  }

  get shifty () {
    const v = Number(this.internal.controls.shifty.value)

    return Math.atan(PI * v) / Math.atan(PI)
  }

  get phase () {
    return Number(this.internal.controls.phase.value)
  }

  get psi () {
    return Number(this.internal.controls.psi.value)
  }

  get balance () {
    return Number(this.internal.controls.balance.value)
  }

  get shape () {
    return this.internal.controls.shape.value
  }

  /* eslint-disable-next-line accessor-pairs */
  set defaults ({ m = 1, e = 0, s = 10, θ = 0, h = 1, Φ = 0, balance = 0, 𝜓 = 0, δx = 0, δy = 0, shape = 'ellipse' }) {
    this.internal.controls.multiplier.setAttribute('default', m)
    this.internal.controls.eccentricity.setAttribute('default', e)
    this.internal.controls.sensitivity.setAttribute('default', s)
    this.internal.controls.rotation.setAttribute('default', θ)
    this.internal.controls.amplitude.setAttribute('default', h)
    this.internal.controls.shiftx.setAttribute('default', δx)
    this.internal.controls.shifty.setAttribute('default', δy)
    this.internal.controls.phase.setAttribute('default', Φ)
    this.internal.controls.psi.setAttribute('default', 𝜓)
    this.internal.controls.balance.setAttribute('default', balance)
    this.internal.controls.shape.setAttribute('default', shape)
  }

  /* eslint-disable-next-line accessor-pairs */
  set values ({ m = 1, e = 0, s = 10, θ = 0, h = 1, Φ = 0, balance = 0, 𝜓 = 0, δx = 0, δy = 0, shape = 'ellipse' }) {
    this.internal.controls.multiplier.value = m
    this.internal.controls.eccentricity.value = e
    this.internal.controls.sensitivity.value = s
    this.internal.controls.rotation.value = θ
    this.internal.controls.amplitude.value = h
    this.internal.controls.shiftx.value = δx
    this.internal.controls.shifty.value = δy
    this.internal.controls.phase.value = Φ
    this.internal.controls.psi.value = 𝜓
    this.internal.controls.balance.value = balance
    this.internal.controls.shape.value = shape
  }

  reset () {
    Object.values(this.internal.controls).forEach(c => c.reset())
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchange (handler) {
    Object.values(this.internal.controls).forEach(c => {
      c.onchange = (e) => { handler(this.tag, e.tag, e.value) }
    })
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (handler) {
    Object.values(this.internal.controls).forEach(c => {
      c.onchanged = (e) => { handler(this.tag, e.tag, e.value) }
    })
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChange (handler) {
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
  }
}

function onReset (controlset, event) {
  event.preventDefault()

  Object.values(controlset.internal.controls).forEach(c => c.onReset(event))

  return true
}

customElements.define('snyth-controlset', ControlSet)
