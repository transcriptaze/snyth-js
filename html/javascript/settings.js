import { schema, filters, suffixes } from './schema.js'
import * as db from './db.js'
import * as eventbus from './eventbus.js'
import { synth } from './synth.js'
import * as envelopes from './synth/envelopes.js'
import * as SNs from './synth/oscillators.js'
import * as LFOs from './synth/LFOs.js'
import * as SETTINGS from './synth/settings.js'
import { PLUGS } from './synth/patchbay.js'
import * as dsp from './dsp/dsp.js'
import { playlist } from './synth/playlist.js'
import * as midifile from './midi/midifile.js'

class SettingsPage {
  constructor () {
    const fields = Array.from(document.querySelectorAll('#settings input.field'))

    this.fields = new Map(fields.map((e) => [e.dataset.oid, e]))
    this.timestamp = document.querySelector('div#settings label#timestamp input')
    this.wavetable = document.querySelector('div#settings label#wavetable input')
    this.midi = document.querySelector('div#settings label#smf input')

    const preferences = restore()

    this.timestamp.checked = preferences.timestamp
    this.wavetable.checked = preferences.wavetable
    this.midi.checked = preferences.midi

    this.timestamp.onchange = (e) => {
      store(this.timestamp.checked, this.wavetable.checked, this.midi.checked)
    }

    this.wavetable.onchange = (e) => {
      store(this.timestamp.checked, this.wavetable.checked, this.midi.checked)
    }

    this.midi.onchange = (e) => {
      store(this.timestamp.checked, this.wavetable.checked, this.midi.checked)
    }
  }

  initialise () {
    set(this.fields, `${schema.synth}${suffixes.synth.settings.volume}`, synth.volume)
    set(this.fields, `${schema.synth}${suffixes.synth.settings.gain}`, synth.gain)

    const envelope = envelopes.DEFAULT

    if (envelope != null) {
      set(this.fields, `${schema.synth}${suffixes.synth.envelope.oid}`, envelope.oid)
      set(this.fields, `${schema.synth}${suffixes.synth.envelope.attack}`, envelope.attack)
      set(this.fields, `${schema.synth}${suffixes.synth.envelope.decay}`, envelope.decay)
      set(this.fields, `${schema.synth}${suffixes.synth.envelope.sustain}`, envelope.sustain)
      set(this.fields, `${schema.synth}${suffixes.synth.envelope.release}`, envelope.release)
    }

    SNs.SNs.forEach((e) => {
      set(this.fields, `${e.oid}${suffixes.oscillator.multiplier}`, e.multiplier)
      set(this.fields, `${e.oid}${suffixes.oscillator.eccentricity}`, e.eccentricity)
      set(this.fields, `${e.oid}${suffixes.oscillator.sensitivity}`, e.sensitivity)
      set(this.fields, `${e.oid}${suffixes.oscillator.rotation}`, e.rotation)
      set(this.fields, `${e.oid}${suffixes.oscillator.amplitude}`, e.amplitude)
      set(this.fields, `${e.oid}${suffixes.oscillator.shiftx}`, e.shiftx)
      set(this.fields, `${e.oid}${suffixes.oscillator.shifty}`, e.shifty)
      set(this.fields, `${e.oid}${suffixes.oscillator.phase}`, e.phase)
      set(this.fields, `${e.oid}${suffixes.oscillator.psi}`, e.psi)
      set(this.fields, `${e.oid}${suffixes.oscillator.balance}`, e.balance)
      set(this.fields, `${e.oid}${suffixes.oscillator.shape}`, e.shape)
    })

    LFOs.SNs.forEach((e) => {
      set(this.fields, `${e.oid}${suffixes.oscillator.multiplier}`, e.multiplier)
      set(this.fields, `${e.oid}${suffixes.oscillator.eccentricity}`, e.eccentricity)
      set(this.fields, `${e.oid}${suffixes.oscillator.sensitivity}`, e.sensitivity)
      set(this.fields, `${e.oid}${suffixes.oscillator.rotation}`, e.rotation)
      set(this.fields, `${e.oid}${suffixes.oscillator.amplitude}`, e.amplitude)
      set(this.fields, `${e.oid}${suffixes.oscillator.shiftx}`, e.shiftx)
      set(this.fields, `${e.oid}${suffixes.oscillator.shifty}`, e.shifty)
      set(this.fields, `${e.oid}${suffixes.oscillator.phase}`, e.phase)
      set(this.fields, `${e.oid}${suffixes.oscillator.shape}`, e.shape)
    })

    LFOs.LFOs.forEach((e) => {
      set(this.fields, `${e.oid}${suffixes.lfo.on}`, e.on)
      set(this.fields, `${e.oid}${suffixes.lfo.frequency}`, e.frequency)
      set(this.fields, `${e.oid}${suffixes.lfo.range.min}`, e.range.min)
      set(this.fields, `${e.oid}${suffixes.lfo.range.max}`, e.range.max)
      set(this.fields, `${e.oid}${suffixes.lfo.plug}`, e.plug)
    })

    eventbus.subscribe('changed', (e) => {
      set(this.fields, e.detail.oid, e.detail.value)
    }, filters.synth.any)

    eventbus.subscribe('changed', (e) => {
      set(this.fields, e.detail.oid, e.detail.value)
    }, filters.playlist.any)

    eventbus.subscribe('changed', (e) => {
      const envelope = envelopes.selected()

      if (envelope != null) {
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.oid}`, envelope.oid)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.attack}`, envelope.attack)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.decay}`, envelope.decay)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.sustain}`, envelope.sustain)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.release}`, envelope.release)
      }
    }, filters.synth.envelope)

    eventbus.subscribe('changed', (e) => {
      const envelope = envelopes.selected()

      if (envelope != null) {
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.oid}`, envelope.oid)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.attack}`, envelope.attack)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.decay}`, envelope.decay)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.sustain}`, envelope.sustain)
        set(this.fields, `${schema.synth}${suffixes.synth.envelope.release}`, envelope.release)
      }
    }, filters.envelopes.any)

    eventbus.subscribe('changed', (e) => {
      set(this.fields, e.detail.oid, e.detail.value)
    }, filters.SN.any)

    eventbus.subscribe('changed', (e) => {
      set(this.fields, e.detail.oid, e.detail.value)
    }, filters.LFO.any)
  }

  save () {
    const object = {
      version: 1,
      settings: SETTINGS.serialize()
    }

    if (this.wavetable.checked) {
      object.wavetable = dsp.sn(SNs.parameters(), 360).map((v) => round(v))
    }

    if (this.midi.checked && playlist.current != null && playlist.current.data != null && playlist.current.data.length > 0) {
      const song = playlist.current
      const bytes = Array.from(song.data)

      object.midi = {
        name: song.name,
        file: song.file,
        data: [...bytes]
      }
    }

    const json = Object.hasOwn(object, 'midi') ? JSON.stringify(object) : JSON.stringify(object, null, 4)
    const blob = new Blob([json], { type: 'application/json' })

    save(blob, this.timestamp.checked)
  }

  restore (file) {
    file.text()
      .then((json) => JSON.parse(json))
      .then((object) => {
        SETTINGS.restore(object.settings)
        return object
      })
      .then((object) => {
        if (Object.hasOwn(object, 'midi')) {
          const name = object.midi.name
          const file = object.midi.file
          const data = new Uint8Array(object.midi.data)
          const bytes = data.buffer

          const smf = midifile.parse(bytes)
          const song = midifile.toNotes(smf)
          const notes = song.notes

          synth.prepare(file, name, notes, data)
        }
      })
      .catch((err) => console.log(err))
  }

  clear () {
  }
}

export const settings = new SettingsPage()

function set (fields, oid, value) {
  SETTINGS.store(oid, value)

  if (fields.has(oid)) {
    const field = fields.get(oid)
    const format = field.dataset.format

    switch (format) {
      case '%d':
        field.value = (Math.round(value * 1) / 1).toFixed(0)
        return

      case '%°':
        field.value = `${(Math.round(value * 1) / 1).toFixed(0)}°`
        return

      case '%.1f':
        field.value = (Math.round(value * 10) / 10).toFixed(1)
        return

      case '%.2f':
        field.value = (Math.round(value * 100) / 100).toFixed(2)
        return

      case '%.3f':
        field.value = (Math.round(value * 1000) / 1000).toFixed(3)
        return

      case '%%':
        /* eslint-disable-next-line no-irregular-whitespace */
        field.value = `${(Math.round(value * 100)).toFixed(0)} %`
        return

      case '%ms':
        /* eslint-disable-next-line no-irregular-whitespace */
        field.value = `${(Math.round(value * 1000)).toFixed(0)} ms`
        return

      case '%#':
        { const match = value.match(/^(?:.*?)\.([1-9][0-9]*)$/)
          field.value = match == null ? '' : `#${match[1]}`
        }
        return

      case '%b':
        field.value = value === true ? 'ON' : 'OFF'
        return

      case '%s':
        field.value = value
        return

      case '%plug':
        field.value = PLUGS.has(value) ? PLUGS.get(value) : ''
        return

      default:
        field.value = value
    }
  }
}

async function save (blob, timestamp, wavetable) {
  const now = new Date()
  const year = `${now.getFullYear()}`.padStart(4, '0')
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  const hour = `${now.getHours()}`.padStart(2, '0')
  const minute = `${now.getMinutes()}`.padStart(2, '0')
  const second = `${now.getSeconds()}`.padStart(2, '0')
  const filename = timestamp ? `snyth ${year}-${month}-${day} ${hour}.${minute}.${second}.json` : 'snyth.json'

  if (window.showSaveFilePicker) {
    saveWithPicker(blob, filename)
  } else {
    const url = URL.createObjectURL(blob)
    const anchor = document.querySelector('div#settings a#settings-download')

    anchor.href = url
    anchor.download = 'snyth.json'
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
          description: 'snyth settings',
          accept: { 'application/json': ['.json'] }
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

function store (timestamp, wavetable, midi) {
  const object = {
    timestamp,
    wavetable,
    midi
  }

  db.store('settings', object)
}

function restore () {
  const preferences = {
    timestamp: false,
    wavetable: false,
    midi: false
  }

  try {
    const object = db.retrieve('settings')

    if (object != null) {
      if (Object.hasOwn(object, 'timestamp')) {
        preferences.timestamp = object.timestamp === true
      }

      if (Object.hasOwn(object, 'wavetable')) {
        preferences.wavetable = object.wavetable === true
      }

      if (Object.hasOwn(object, 'midi')) {
        preferences.midi = object.midi === true
      }
    }
  } catch (err) {
    console.error(err)
  }

  return preferences
}

function round (v) {
  return Math.round(100000 * v) / 100000
}
