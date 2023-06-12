export class Slot extends HTMLElement {
  static get observedAttributes () {
    return ['oid', 'href', 'title']
  }

  constructor () {
    super()

    this.internal = {
      oid: '',
      href: '',
      title: '',
      queued: false,
      onPick: null,
      onPickURL: null,
      onPlay: null,
      onQueue: null,
      onUnqueue: null,
      onReset: null
    }

    const template = document.querySelector('#template-slot')
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
    const div = shadow.querySelector('div')

    div.oncontextmenu = (event) => onReset(this, event)
    div.onclick = (event) => onClick(this, event)
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div')

    if (name === 'oid') {
      this.internal.oid = to
    }

    if (name === 'href') {
      this.internal.href = to.trim()

      if (this.url !== '') {
        div.classList.add('enabled')
      } else {
        div.classList.remove('enabled')
      }
    }

    if (name === 'title') {
      this.internal.title = to.trim()
    }
  }

  get oid () {
    return this.internal.oid
  }

  get url () {
    const href = this.internal.href

    if (href && href !== '') {
      return href
    }

    return ''
  }

  set url (href) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div')

    if (href && href !== '') {
      this.internal.href = href
    } else {
      this.internal.href = ''
    }

    if (this.url !== '') {
      div.classList.add('enabled')
    } else {
      div.classList.remove('enabled')
    }
  }

  get title () {
    const title = this.internal.title

    if (title && title !== '') {
      return title.trim()
    }

    return ''
  }

  set title (v) {
    const shadow = this.shadowRoot
    const host = shadow.host

    if (v) {
      this.internal.title = `${v}`.trim()

      host.setAttribute('title', this.title)
    }
  }

  get queued () {
    return this.internal.queued
  }

  set queued (v) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div')

    this.internal.queued = v === true

    if (this.queued) {
      div.classList.add('queued')
    } else {
      div.classList.remove('queued')
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set error (v) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div')

    if (v === true) {
      div.classList.add('error')
    } else {
      div.classList.remove('error')
    }
  }

  get onPick () {
    return this.internal.onPick
  }

  set onPick (handler) {
    this.internal.onPick = handler
  }

  get onPickURL () {
    return this.internal.onPickURL
  }

  set onPickURL (handler) {
    this.internal.onPickURL = handler
  }

  get onPlay () {
    return this.internal.onPlay
  }

  set onPlay (handler) {
    this.internal.onPlay = handler
  }

  get onQueue () {
    return this.internal.onQueue
  }

  set onQueue (handler) {
    this.internal.onQueue = handler
  }

  get onUnqueue () {
    return this.internal.onUnqueue
  }

  set onUnqueue (handler) {
    this.internal.onUnqueue = handler
  }

  get onReset () {
    return this.internal.onReset
  }

  set onReset (handler) {
    this.internal.onReset = handler
  }

  initialise (url, title) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div')

    this.internal.href = url
    this.title = title

    if (this.url !== '') {
      div.classList.add('enabled')
    } else {
      div.classList.remove('enabled')
    }
  }

  reset () {
    const shadow = this.shadowRoot
    const host = shadow.host
    const div = shadow.querySelector('div')

    this.internal.href = ''
    this.internal.title = ''

    host.setAttribute('title', '')
    div.classList.remove('enabled')
    div.classList.remove('queued')
  }
}

function onClick (slot, event) {
  event.stopPropagation()

  slot.error = false

  switch (true) {
    case slot.url !== '' && !event.altKey && slot.onPlay != null:
      slot.onPlay(event, slot.oid, slot.url)
      break

    case slot.url !== '' && event.altKey && slot.onQueue && !slot.queued:
      slot.onQueue(event, slot.oid)
      break

    case slot.url !== '' && event.altKey && slot.onUnqueue && slot.queued:
      slot.onUnqueue(event, slot.oid)
      break

    case slot.url === '' && slot.onPickURL != null && event.altKey:
      slot.onPickURL(event, slot.oid)
      break

    case slot.url === '' && slot.onPick != null:
      slot.onPick(event, slot.oid)
      break
  }

  return true
}

function onReset (slot, event) {
  event.preventDefault()

  if (slot.internal.onReset != null) {
    slot.internal.onReset(event, slot.oid)
  }
}

customElements.define('snyth-slot', Slot)
