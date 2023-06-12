export class Recording extends HTMLElement {
  static get observedAttributes () {
    return []
  }

  constructor () {
    super()

    this.internal = {
      enabled: false,
      recording: false,
      title: 'snyth',
      blob: null
    }

    const template = document.querySelector('#template-recording')
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
    const record = shadow.querySelector('label')
    const download = shadow.querySelector('button')
    const anchor = shadow.querySelector('a#download')

    record.onclick = (e) => {
      onRecord(this, e)
    }

    download.onclick = (e) => {
      onDownload(this, anchor)
    }
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
  }

  get enabled () {
    return this.internal.enabled
  }

  set enabled (v) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div.record')

    this.internal.enabled = !!v

    if (this.internal.enabled) {
      div.classList.add('enabled')
    } else {
      div.classList.remove('enabled')
    }
  }

  get ready () {
    return this.internal.enabled && this.internal.ready
  }

  set ready (v) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div.record')

    this.internal.ready = v

    if (this.ready) {
      div.classList.add('ready')
    } else {
      div.classList.remove('ready')
    }
  }

  get recording () {
    return this.internal.enabled && this.internal.recording
  }

  set recording (v) {
    const shadow = this.shadowRoot
    const div = shadow.querySelector('div.record')

    this.internal.recording = !!(this.internal.enabled && v)

    if (this.recording) {
      div.classList.add('recording')
    } else {
      div.classList.remove('recording')
    }
  }

  get blob () {
    return this.internal.blob
  }

  get title () {
    return this.internal.title
  }

  /* eslint-disable-next-line accessor-pairs */
  set recorded ({ title, blob }) {
    const shadow = this.shadowRoot
    const download = shadow.querySelector('button')

    this.internal.title = title
    this.internal.blob = blob

    if (blob != null) {
      download.disabled = false
    } else {
      download.disabled = true
    }
  }

  reset () {
  }
}

function onRecord (record, event) {
  if (record.enabled) {
    record.recording = !record.recording
  }
}

function onDownload (record, anchor) {
  if (record.blob != null) {
    save(record.title, record.blob, anchor)
  }
}

async function save (title, blob, anchor) {
  if (window.showSaveFilePicker) {
    saveWithPicker(blob, title === '' ? 'snyth.ogg' : `${title}.ogg`)
  } else {
    const url = URL.createObjectURL(blob)

    anchor.href = url
    anchor.download = title === '' ? 'snyth.ogg' : `${title}.ogg`
    anchor.click()

    URL.revokeObjectURL(url)
  }
}

async function saveWithPicker (blob, filename) {
  try {
    const options = {
      suggestedName: filename,
      types: [
        {
          description: 'OGG audio',
          accept: { 'audio/ogg': ['.ogg'] }
        }
      ]
    }

    const handle = await window.showSaveFilePicker(options)
    const stream = await handle.createWritable()

    await stream.write(blob)
    await stream.close()
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err)
    }
  }
}

customElements.define('snyth-recording', Recording)
