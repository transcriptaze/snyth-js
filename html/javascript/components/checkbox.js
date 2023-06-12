export class Checkbox extends HTMLElement {
  static get observedAttributes () {
    return ['label']
  }

  constructor () {
    super()

    this.internal = {
      label: 'A',
      onChange: null
    }

    const template = document.querySelector('#template-checkbox')
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
    const checkbox = shadow.querySelector('input')

    checkbox.onchange = (e) => {
      if (checkbox.checked) {
        this.classList.add('enabled')
      } else {
        this.classList.remove('enabled')
      }

      if (this.internal.onChange != null) {
        this.internal.onChange(e)
      }
    }
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'label') {
      this.label = to
    }
  }

  get label () {
    return this.internal.label
  }

  set label (v) {
    const shadow = this.shadowRoot
    const span = shadow.querySelector('span')

    this.internal.label = `${v}`

    span.innerHTML = this.label
  }

  get checked () {
    const shadow = this.shadowRoot
    const checkbox = shadow.querySelector('input')

    return checkbox.checked
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchange (handler) {
    this.internal.onChange = handler
  }

  reset () {
  }
}

customElements.define('snyth-checkbox', Checkbox)
