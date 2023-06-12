export class PushButton extends HTMLElement {
  static get observedAttributes () {
    return ['img', 'tag']
  }

  constructor () {
    super()

    this.internal = {
      tag: ''
    }

    const template = document.querySelector('#template-pushbutton')
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
      this.internal.tag = to
    }

    if (name === 'img') {
      const shadow = this.shadowRoot
      const img = shadow.querySelector('img')

      img.src = to
    }
  }

  get tag () {
    return this.internal.tag
  }

  set tag (v) {
    this.internal.tag = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set onclick (handler) {
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    button.addEventListener('click', (event) => { handler(event) })
  }

  reset () {
  }
}

customElements.define('snyth-pushbutton', PushButton)
