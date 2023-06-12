const SHAPES = [
  {
    shape: 'ellipse',
    image: './images/ellipse.svg'
  },
  {
    shape: 'square',
    image: './images/rectangle.svg'
  },
  {
    shape: 'cowbell',
    image: './images/cowbell.svg'
  }
]

export class Shape extends HTMLElement {
  static get observedAttributes () {
    return ['tag', 'default', 'value']
  }

  constructor () {
    super()

    this.internal = {
      tag: '',
      onChange: null,
      onChanged: null
    }

    const template = document.querySelector('#template-shape')
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

    button.onclick = (event) => this.onClick(event)
    button.oncontextmenu = (event) => this.onReset(event)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    if (name === 'tag') {
      this.tag = to
    }

    if (name === 'default') {
      input.dataset.default = to
    }

    if (name === 'value') {
      input.value = to
    }
  }

  get tag () {
    return this.internal.tag
  }

  set tag (v) {
    this.internal.tag = v
  }

  get defval () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return input.dataset.default
  }

  set defval (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    input.dataset.default = v
  }

  get value () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')

    return input.value
  }

  set value (v) {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const img = shadow.querySelector('img')
    const ix = SHAPES.findIndex((e) => e.shape === v)

    if (ix !== -1) {
      const shape = SHAPES[ix]

      input.value = shape.shape
      img.src = shape.image
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchange (handler) {
    this.internal.onChange = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (handler) {
    this.internal.onChanged = handler
  }

  reset () {
    const shadow = this.shadowRoot
    const input = shadow.querySelector('input')
    const img = shadow.querySelector('img')
    const defval = SHAPES[0]

    if (defval) {
      input.value = defval.shape
      img.src = defval.image
    }
  }

  onReset (event) {
    event.preventDefault()

    this.reset()

    if (this.internal.onChanged != null) {
      this.internal.onChanged(this)
    }

    return true
  }

  onClick (event) {
    if (event.button === 0 && (!event.ctrlKey || event.altKey)) {
      event.preventDefault()

      const value = this.value
      const ix = SHAPES.findIndex(e => e.shape === value)
      const next = ix === -1 ? 0 : (ix + 1) % SHAPES.length
      const shape = SHAPES[next]

      this.value = shape.shape

      if (this.internal.onChanged != null) {
        this.internal.onChanged(this)
      }
    }
  }
}

customElements.define('snyth-shape', Shape)
