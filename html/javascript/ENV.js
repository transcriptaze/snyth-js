import { suffixes, filters, OID } from './schema.js'
import * as eventbus from './eventbus.js'
import * as envelopes from './synth/envelopes.js'
import { OFFSETS } from './synth/patchbay.js'

class Envelopes {
  constructor () {
    const div = document.querySelector('div#envelopes')

    this.envelopes = div.querySelectorAll('div.grid snyth-envelope')
    this.editor = div.querySelector('.editor')
    this.values = div.querySelector('.values')
    this.text = div.querySelector('.description')

    envelopes.restore()

    Array.from(envelopes.ENVELOPES).forEach((v) => {
      this.restyle(`${v.oid}`)
      this.relabel(`${v.oid}${suffixes.envelope.label}`, v.label)
      this.favourite(`${v.oid}${suffixes.envelope.favourite}`, v.favourite)
    })

    this.internal = {
      animate: document.querySelector('#env-animate')
    }
  }

  get animate () {
    return this.envelope != null && this.internal.animate.checked
  }

  initialise () {
    for (const e of this.envelopes) {
      e.onclick = (event) => {
        if (event.altKey) {
          if (event.currentTarget.classList.contains('favourite')) {
            envelopes.favourite(e.value, false)
          } else {
            envelopes.favourite(e.value, true)
          }
        } else if (event.ctrlKey) {
          envelopes.reset(e.value)
        } else {
          envelopes.select(e.value)
        }
      }

      e.oncontextmenu = (event) => {
        event.preventDefault()
        envelopes.reset(e.value)
      }
    }

    this.envelope = null

    eventbus.subscribe('change', (e) => this.refresh(e.detail.oid, 'editing'), filters.envelopes.any)
    eventbus.subscribe('changed', (e) => this.relabel(e.detail.oid, e.detail.value), filters.envelopes.label)
    eventbus.subscribe('changed', (e) => this.favourite(e.detail.oid, e.detail.value), filters.envelopes.favourite)

    eventbus.subscribe('changed', (e) => {
      envelopes.save()
      this.refresh(e.detail.oid, '')
      this.restyle(e.detail.oid)
    }, filters.envelopes.any)

    eventbus.subscribe('changed', (e) => {
      Array.from(this.envelopes)
        .filter((v) => OID.matches(v.value, e.detail.value))
        .forEach((v) => { v.selected = true })

      Array.from(this.envelopes)
        .filter((v) => !OID.matches(v.value, e.detail.value))
        .forEach((v) => { v.selected = false })

      this.edit(e.detail.value)
    }, filters.synth.envelope)
  }

  restyle (oid) {
    const env = envelopes.get(oid)

    if (env && env.edited) {
      Array.from(this.envelopes)
        .filter((v) => OID.contains(oid, v.value))
        .forEach((v) => { v.edited = true })
    }

    if (env && !env.edited) {
      Array.from(this.envelopes)
        .filter((v) => OID.contains(oid, v.value))
        .forEach((v) => { v.edited = false })
    }
  }

  relabel (oid, label) {
    Array.from(this.envelopes)
      .filter((v) => OID.contains(oid, v.value))
      .forEach((v) => { v.label = label })
  }

  favourite (oid, enabled) {
    if (enabled) {
      Array.from(this.envelopes)
        .filter((v) => oid.startsWith(`${v.value}.`))
        .forEach((v) => { v.favourite = true })
    }

    if (!enabled) {
      Array.from(this.envelopes)
        .filter((v) => oid.startsWith(`${v.value}.`))
        .forEach((v) => { v.favourite = false })
    }
  }

  redraw (patchbay) {
    const envelope = this.envelope

    if (patchbay != null && this.animate) {
      const attack = envelope.attack * patchbay[OFFSETS.attack]
      const decay = envelope.type === 'AR' ? 0 : this.envelope.decay * patchbay[OFFSETS.decay]
      const sustain = envelope.type === 'AR' ? 1 : this.envelope.sustain * patchbay[OFFSETS.sustain]
      const release = envelope.release * patchbay[OFFSETS.release]

      this.editor.animate({ attack, decay, sustain, release })
    } else {
      this.editor.animate(null)
    }
  }

  refresh (oid, editing) {
    if (this.envelope && oid.startsWith(this.envelope.oid)) {
      this.editor.redraw(editing)

      const inflections = this.envelope.inflections()
      const label = this.text.querySelector('input#envelope-tag')
      const text = this.text.querySelector('input#envelope-text')

      label.value = this.envelope.label
      text.value = this.envelope.text

      inflections.attack.forEach(p => {
        this.values.querySelector(`snyth-range-ms[data-id="${p.tag}"]`).value = p.value
      })

      inflections.sustain.forEach(p => {
        this.values.querySelector(`snyth-range-float[data-id="${p.tag}"]`).value = p.value
      })

      inflections.release.forEach(p => {
        this.values.querySelector(`snyth-range-ms[data-id="${p.tag}"]`).value = p.value
      })
    }
  }

  edit (oid) {
    const env = envelopes.get(oid)
    const editor = this.editor
    const label = this.text.querySelector('input#envelope-tag')
    const text = this.text.querySelector('input#envelope-text')

    if (oid === envelopes.DEFAULT.oid) {
      this.clear()
    } else if (env) {
      this.envelope = env

      editor.edit(env)
      label.value = env.label
      text.value = env.text

      editor.onchange = (e) => {
        env.update(e.detail.tag, null, e.detail.at, e.detail.level)
      }

      editor.onchanged = (e) => {
        env.commit(e.detail.tag, null, e.detail.at, e.detail.level)
      }

      label.oninput = (e) => {
        env.label = label.value
      }

      text.oninput = (e) => {
        env.text = text.value
      }

      this.values.querySelectorAll('snyth-range-ms').forEach((field) => {
        field.classList.remove('visible')
        field.value = ''
        field.enabled = false
      })

      this.values.querySelectorAll('snyth-range-float').forEach((field) => {
        field.classList.remove('visible')
        field.value = ''
        field.enabled = false
      })

      const inflections = env.inflections()

      for (const p of inflections.attack) {
        const field = this.values.querySelector(`snyth-range-ms[data-id="${p.tag}"]`)

        if (field) {
          field.enabled = true
          field.dataset.tag = p.tag
          field.value = p.value
          field.classList.add('visible')

          field.onChange = (v) => env.update(p.tag, v, null, null)
          field.onChanged = (v) => env.commit(p.tag, v, null, null)
        }
      }

      for (const p of inflections.sustain) {
        const field = this.values.querySelector(`snyth-range-float[data-id="${p.tag}"]`)

        if (field) {
          field.enabled = true
          field.dataset.tag = p.tag
          field.value = p.value
          field.classList.add('visible')

          field.onChange = (v) => env.update(p.tag, v, null, null)
          field.onChanged = (v) => env.commit(p.tag, v, null, null)
        }
      }

      for (const p of inflections.release) {
        const field = this.values.querySelector(`snyth-range-ms[data-id="${p.tag}"]`)

        if (field) {
          field.enabled = true
          field.dataset.tag = p.tag
          field.value = p.value
          field.classList.add('visible')

          field.onChange = (v) => env.update(p.tag, v, null, null)
          field.onChanged = (v) => env.commit(p.tag, v, null, null)
        }
      }

      if (env.type === 'AR') {
        const A = this.values.querySelector('snyth-range-ms[data-id="A"]')
        const D = this.values.querySelector('snyth-range-ms[data-id="D"]')
        const S = this.values.querySelector('snyth-range-float[data-id="S"]')
        const R = this.values.querySelector('snyth-range-ms[data-id="R"]')

        A.style.gridRow = '1 / span 1'
        R.style.gridRow = '2 / span 1'
        D.style.gridRow = '3 / span 1'
        S.style.gridRow = '4 / span 1'
      }

      if (env.type === 'ADSR') {
        const A = this.values.querySelector('snyth-range-ms[data-id="A"]')
        const D = this.values.querySelector('snyth-range-ms[data-id="D"]')
        const S = this.values.querySelector('snyth-range-float[data-id="S"]')
        const R = this.values.querySelector('snyth-range-ms[data-id="R"]')

        A.style.gridRow = '1 / span 1'
        D.style.gridRow = '2 / span 1'
        S.style.gridRow = '3 / span 1'
        R.style.gridRow = '4 / span 1'
      }
    }
  }

  clear () {
    const editor = this.editor
    const label = this.text.querySelector('input#envelope-tag')
    const text = this.text.querySelector('input#envelope-text')

    editor.edit(null)

    label.value = ''
    text.value = ''

    this.values.querySelectorAll('snyth-range-ms').forEach((field) => {
      field.classList.remove('visible')
      field.value = ''
      field.enabled = false
    })

    this.values.querySelectorAll('snyth-range-float').forEach((field) => {
      field.classList.remove('visible')
      field.value = ''
      field.enabled = false
    })
  }
}

export const ENV = new Envelopes()

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 60) === 0) {
    console.log(v)
  }

  _log.count++
}
