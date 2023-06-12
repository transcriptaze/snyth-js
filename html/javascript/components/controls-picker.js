export class Picker extends HTMLElement {
  static get observedAttributes () {
    return []
  }

  constructor () {
    super()

    this.internal = {
      onPicked: null,
      onPlaylist: null,
      onUnqueue: null
    }

    const template = document.querySelector('#template-picker')
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
    const div = shadow.querySelector('#midi')
    const clickable = shadow.querySelector('#picker img')
    const file = shadow.querySelector('#file')
    const queued = shadow.querySelector('#queued')
    const slots = shadow.querySelectorAll('snyth-slot')

    div.ondragover = (e) => onDragOver(this, e)
    div.ondragleave = (e) => onDragLeave(this, e)
    div.ondrop = (e) => onDrop(this, e, this.onPicked)

    clickable.onclick = (e) => {
      file.onchange = (e) => onPicked(this, e, this.onPicked)
      onPick(this, e)
    }

    queued.onclick = (e) => onUnqueue(this, e)
    queued.addEventListener('contextmenu', e => onUnqueue(this, e), false)

    slots.forEach((slot) => {
      slot.onPlay = (e, oid, url) => onPlaylist(this, oid, 'play', url)
      slot.onQueue = (e, oid, url) => onPlaylist(this, oid, 'queue', url)
      slot.onUnqueue = (e, oid) => onPlaylist(this, oid, 'unqueue')
      slot.onReset = (e, oid) => onPlaylist(this, oid, 'reset')

      slot.onPick = (e, oid) => {
        file.onchange = (e) => onPicked(this, e, (file) => onPlaylist(this, oid, 'stash::file', file))
        onPick(this, e)
      }

      slot.onPickURL = (e, oid) => onPickURL(this, e, (event) => {
        onPickedURL(this, event, (url) => {
          onPlaylist(this, oid, 'stash::url', url)
        })
      })
    })

    window.addEventListener('click', (event) => {
      const dialog = shadow.getElementById('url-picker')

      if (dialog && dialog.open && event.target !== dialog && !dialog.contains(event.target)) {
        dialog.close()
      }
    })
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
  }

  /* eslint-disable-next-line accessor-pairs */
  set title (v) {
    const shadow = this.shadowRoot
    const title = shadow.querySelector('#title')

    title.value = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set progress (v) {
    const shadow = this.shadowRoot
    const progressBar = shadow.querySelector('#progressbar')

    progressBar.at = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set duration (v) {
    const shadow = this.shadowRoot
    const progressBar = shadow.querySelector('#progressbar')

    progressBar.duration = v
  }

  get onPicked () {
    return this.internal.onPicked
  }

  set onPicked (handler) {
    this.internal.onPicked = handler
  }

  get onPlaylist () {
    return this.internal.onPlaylist
  }

  set onPlaylist (handler) {
    this.internal.onPlaylist = handler
  }

  get onUnqueue () {
    return this.internal.onUnqueue
  }

  set onUnqueue (handler) {
    this.internal.onUnqueue = handler
  }

  queued (oid, v) {
    const shadow = this.shadowRoot
    const slots = shadow.querySelectorAll('snyth-slot')
    const queued = shadow.querySelector('#queued')

    for (const slot of slots) {
      if (slot.oid === oid) {
        slot.queued = v === true
        return
      }
    }

    if (v === true) {
      queued.classList.add('queued')
    } else {
      queued.classList.remove('queued')
    }
  }

  stashed (oid, url, title) {
    const shadow = this.shadowRoot
    const slots = shadow.querySelectorAll('snyth-slot')

    for (const slot of slots) {
      if (slot.oid === oid) {
        slot.url = url
        slot.title = title
      }
    }
  }

  error (oid) {
    const shadow = this.shadowRoot
    const slots = shadow.querySelectorAll('snyth-slot')

    for (const slot of slots) {
      if (slot.oid === oid) {
        slot.error = true
      }
    }
  }
}

function onDragOver (picker, event) {
  event.preventDefault()

  const shadow = picker.shadowRoot
  const clickable = shadow.querySelector('#picker img.clickable')

  clickable.classList.add('hover')
}

function onDragLeave (picker, event) {
  event.preventDefault()

  const shadow = picker.shadowRoot
  const clickable = shadow.querySelector('#picker img.clickable')

  clickable.classList.remove('hover')
}

function onPick (picker, event) {
  const shadow = picker.shadowRoot
  const input = shadow.getElementById('file')
  const queue = event.altKey

  input.value = null
  input.dataset.action = queue ? 'queue' : 'play'
  input.dataset.oid = ''
  input.click()
}

function onPickURL (picker, event, fn) {
  event.stopPropagation()

  const shadow = picker.shadowRoot
  const dialog = shadow.getElementById('url-picker')
  const ok = shadow.getElementById('url-picked')

  if (dialog.open) {
    dialog.close()
  } else {
    dialog.show()

    ok.onclick = (e) => fn(e)
  }
}

function onDrop (picker, event, fn) {
  event.preventDefault()

  const shadow = picker.shadowRoot
  const clickable = shadow.querySelector('#picker img.clickable')
  let files = []

  clickable.classList.remove('hover')

  if (event.dataTransfer.files) {
    files = Array.prototype.map.call(event.dataTransfer.files, f => f)
  } else if (event.dataTransfer.items) {
    files = Array.prototype.filter.call(event.dataTransfer.items, f => f.kind === 'file').map(g => g.getAsFile())
  }

  if (files.length > 0 && fn != null) {
    fn(files[0], 'play')
  }
}

function onPicked (picker, event, fn) {
  const shadow = picker.shadowRoot
  const input = shadow.getElementById('file')
  const files = Array.prototype.map.call(event.target.files, f => f)
  const action = input.dataset.action

  if (files.length > 0 && fn != null) {
    fn(files[0], action)
  }
}

function onPickedURL (picker, event, fn) {
  const shadow = picker.shadowRoot
  const dialog = shadow.getElementById('url-picker')
  const input = dialog.querySelector('input[type="url"]')
  const url = input.value

  input.value = ''
  dialog.close()

  if (url.trim() !== '') {
    fn(url)
  }
}

function onUnqueue (picker, event) {
  event.preventDefault()
  event.stopPropagation()

  if (event.ctrlKey && picker.onUnqueue != null) {
    picker.onUnqueue()
  }

  if (event.altKey && picker.onUnqueue != null) {
    picker.onUnqueue()
  }
}

function onPlaylist (picker, oid, action, file) {
  if (picker.onPlaylist != null) {
    picker.onPlaylist(action, oid, file)
  }
}

customElements.define('snyth-picker', Picker)
