export class Worklets extends HTMLElement {
  static get observedAttributes () {
    return []
  }

  constructor () {
    super()

    this.internal = {
      onChange: null,
      onChanged: null
    }

    const template = document.querySelector('#template-controls-worklets')
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
    const wavetable = shadow.querySelector('input#wavetable')
    const dds = shadow.querySelector('input#dds')

    const selected = (e) => {
      if (this.internal.onChanged != null) {
        this.internal.onChanged(e)
      }
    }

    wavetable.onclick = selected
    dds.onclick = selected
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
    this.internal.onChanged = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set enabled (v) {
    const shadow = this.shadowRoot
    const wavetable = shadow.querySelector('input#wavetable')
    const dds = shadow.querySelector('input#dds')

    wavetable.disabled = !v
    dds.disabled = !v
  }

  get selected () {
    const shadow = this.shadowRoot
    const wavetable = shadow.querySelector('input#wavetable')
    const dds = shadow.querySelector('input#dds')

    if (wavetable.checked) {
      return wavetable.value
    } else if (dds.checked) {
      return dds.value
    } else {
      return 'none'
    }
  }

  set selected (v) {
    const shadow = this.shadowRoot
    const wavetable = shadow.querySelector('input#wavetable')
    const dds = shadow.querySelector('input#dds')

    if (v === wavetable.value) {
      wavetable.checked = true
    } else if (v === dds.value) {
      dds.checked = true
    }
  }

  reset () {
  }
}

customElements.define('snyth-worklets', Worklets)
