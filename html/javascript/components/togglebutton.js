export class ToggleButton extends HTMLElement {
  static get observedAttributes () {
    return ['tag', 'states', 'state', 'img']
  }

  constructor () {
    super()

    this.internal = {
      tag: '',
      state: '',
      states: [],

      onChanged: null
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
    const shadow = this.shadowRoot
    const button = shadow.querySelector('button')

    button.onclick = (event) => {
      const state = this.internal.state
      const states = this.internal.states
      const ix = states.findIndex((e) => e === state)
      const next = (ix + 1) % states.length

      this.state = states[next]

      if (this.internal.onChanged != null) {
        this.internal.onChanged(this.tag, this.state)
      }
    }
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'tag') {
      this.internal.tag = `${to}`
    }

    if (name === 'states') {
      this.internal.states = to.split('|')
    }

    if (name === 'state') {
      this.state = to
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

  get state () {
    return this.internal.state
  }

  set state (v) {
    this.internal.state = v

    for (const state of this.internal.states) {
      if (state === v) {
        this.classList.add(state)
      } else {
        this.classList.remove(state)
      }
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (handler) {
    this.internal.onChanged = handler
  }

  reset () {
  }
}

customElements.define('snyth-togglebutton', ToggleButton)
