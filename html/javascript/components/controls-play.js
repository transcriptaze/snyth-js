export class Play extends HTMLElement {
  constructor () {
    super()

    this.state = {
      playing: false,
      looping: false,
      onChanged: null,
      onPlay: null,
      onPause: null
    }

    const template = document.querySelector('#template-controls-play')
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

    button.addEventListener('click', (event) => { onClick(this, event) })
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
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

  get loop () {
    return this.state.looping
  }

  set loop (v) {
    const shadow = this.shadowRoot
    const indicator = shadow.querySelector('img.loop')

    this.state.looping = v

    if (this.state.looping) {
      indicator.classList.add('on')
    } else {
      indicator.classList.remove('on')
    }
  }

  get playing () {
    return this.state.playing
  }

  set playing (v) {
    const shadow = this.shadowRoot
    const icon = shadow.querySelector('img.state')

    this.state.playing = v

    if (this.state.playing) {
      icon.classList.add('playing')
    } else {
      icon.classList.remove('playing')
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
    this.state.onChanged = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set onPlay (handler) {
    this.state.onPlay = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set onPause (handler) {
    this.state.onPause = handler
  }

  reset () {
  }
}

function onClick (button, event) {
  if (event.altKey) {
    button.loop = !button.state.looping

    if (button.state.onChanged) {
      button.state.onChanged()
    }
  } else {
    button.playing = !button.state.playing

    if (button.playing && button.state.onPlay) {
      button.state.onPlay()
    } else if (!button.playing && button.state.onPause) {
      button.state.onPause()
    }
  }
}

customElements.define('snyth-play', Play)
