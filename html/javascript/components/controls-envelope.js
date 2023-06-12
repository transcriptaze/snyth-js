import * as envelopes from '../synth/envelopes.js'

const CHANGE = new Event('change')
const CHANGED = new Event('changed')

export class ControlsEnvelope extends HTMLElement {
  static get observedAttributes () {
    return ['tag', 'envelope', 'icon']
  }

  constructor () {
    super()

    const template = document.querySelector('#template-controls-envelope')
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
    if (name === 'tag') {
      this.tag = to
    }

    if (name === 'envelope') {
      this.value = to
    }

    if (name === 'icon') {
      this.icon = to
    }
  }

  get disabled () {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    return button.disabled
  }

  set disabled (v) {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    button.disabled = v
  }

  get value () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return input.value
  }

  set value (oid) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.value = oid
  }

  /* eslint-disable-next-line accessor-pairs */
  set label (v) {
    const shadow = this.shadowRoot
    const label = shadow.querySelector('label')

    label.innerHTML = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set icon (icon) {
    const shadow = this.shadowRoot
    const img = shadow.querySelector('img.env')

    img.src = `./images/envelopes/${icon}.svg`
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChange (handler) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.addEventListener('change', () => {
      handler(this.tag, this.value)
    })
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.addEventListener('changed', () => {
      handler(this.tag, this.value)
    })
  }

  /* eslint-disable-next-line accessor-pairs */
  set onClick (handler) {
    this.addEventListener('click', (event) => {
      handler(event)
    })
  }

  update () {
    const shadow = this.shadowRoot
    const label = shadow.querySelector('label')
    const envelope = envelopes.get(this.value)

    if (envelope) {
      label.innerHTML = envelope.label
    }
  }

  reset () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const label = shadow.querySelector('label')
    const defval = ''

    input.value = defval
    label.innerHTML = ''

    input.dispatchEvent(CHANGE)
    input.dispatchEvent(CHANGED)
  }
}

customElements.define('snyth-controls-envelope', ControlsEnvelope)
