const AUTO = 1
const MANUAL = 0

export class Load extends HTMLElement {
  static get observedAttributes () {
    return ['auto']
  }

  constructor () {
    super()

    this.internal = {
      mode: MANUAL,
      handler: null
    }

    const template = document.querySelector('#template-controls-load')
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
    const button = shadow.querySelector('button')

    button.onclick = (event) => onClick(this, event)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'auto') {
      this.autoLoad = true
    }
  }

  get disabled () {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    return button.disabled
  }

  /* eslint-disable-next-line accessor-pairs */
  set disabled (v) {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    button.disabled = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set highlight (v) {
    if (v) {
      this.classList.add('highlight')
    } else {
      this.classList.remove('highlight')
    }
  }

  get autoLoad () {
    return this.internal.mode === AUTO
  }

  set autoLoad (v) {
    const shadow = this.shadowRoot
    const dot = shadow.querySelector('img.dot')

    this.internal.mode = v ? AUTO : MANUAL

    if (this.internal.mode === AUTO) {
      dot.classList.add('auto')
    } else {
      dot.classList.remove('auto')
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set onLoad (handler) {
    this.internal.handler = handler
  }

  reset () {
  }
}

function onClick (load, event) {
  if (event.altKey) {
    load.autoLoad = load.internal.mode === MANUAL
  } else if (load.internal.handler) {
    load.internal.handler(event)
  }
}

customElements.define('snyth-controls-load', Load)
