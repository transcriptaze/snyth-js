import * as envelopes from '../synth/envelopes.js'

export class ENVEnvelope extends HTMLElement {
  static get observedAttributes () {
    return ['tag', 'envelope', 'icon']
  }

  constructor () {
    super()

    this.internal = {
      tag: ''
    }

    const template = document.querySelector('#template-env-envelope')
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

      const envelope = envelopes.get(to)

      if (envelope != null) {
        this.label = envelope.label
      }
    }

    if (name === 'icon') {
      this.icon = to
    }
  }

  get tag () {
    return this.internal.tag
  }

  set tag (v) {
    this.internal.tag = v
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
  set icon (v) {
    const shadow = this.shadowRoot
    const img = shadow.querySelector('img.env')

    img.src = `./images/envelopes/${v}.svg`
  }

  /* eslint-disable-next-line accessor-pairs */
  set label (v) {
    const shadow = this.shadowRoot
    const label = shadow.querySelector('label')

    label.innerHTML = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set edited (v) {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    if (v) {
      button.classList.add('edited')
    } else {
      button.classList.remove('edited')
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set favourite (v) {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    if (v) {
      button.classList.add('favourite')
    } else {
      button.classList.remove('favourite')
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set selected (v) {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    if (v) {
      button.classList.add('selected')
    } else {
      button.classList.remove('selected')
    }
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
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    button.addEventListener('click', (event) => {
      handler(event)
    })
  }

  update () {
    const envelope = envelopes.get(this.value)

    if (envelope) {
      this.label = envelope.label
    }
  }

  reset () {
    this.value = ''
    this.label = ''
  }
}

customElements.define('snyth-envelope', ENVEnvelope)
