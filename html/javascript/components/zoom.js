export class Zoom extends HTMLElement {
  static get observedAttributes () {
    return ['oid']
  }

  constructor () {
    super()

    this.internal = {
      oid: '',
      scale: 1,
      onChanged: null
    }

    const template = document.querySelector('#template-zoom')
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
    const plus = shadow.querySelector('snyth-pushbutton.plus')
    const minus = shadow.querySelector('snyth-pushbutton.minus')

    plus.onclick = (e) => {
      this.scale = clamp(this.scale * Math.sqrt(2), 0.25, 4)
    }

    minus.onclick = (e) => {
      this.scale = clamp(this.scale / Math.sqrt(2), 0.25, 4)
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
  }

  get oid () {
    return this.internal.oid
  }

  set oid (v) {
    this.internal.oid = v
  }

  get scale () {
    return this.internal.scale
  }

  set scale (v) {
    this.internal.scale = v

    if (this.internal.onChanged != null) {
      this.internal.onChanged(this.scale)
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (handler) {
    this.internal.onChanged = handler
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-zoom', Zoom)
