import {
  schema, suffixes,
  SYNTH,
  OSC1, OSC2, OSC3, OSC4, OSC5, OSC6,
  LFO1, LFO2, LFO3, LFO4,
  PLAYLIST
} from '../schema.js'

import { synth } from '../synth.js'
import * as envelopes from './envelopes.js'
import * as SNs from './oscillators.js'
import * as LFOs from './LFOs.js'
import * as patchbay from './patchbay.js'

const settings = new Map()

export function store (oid, value) {
  settings.set(oid, value)
}

export function restore (json) {
  deserialize(json)

  const get = (oid, defval) => {
    return settings.has(oid) ? settings.get(oid) : defval
  }

  // ... gain/volume
  // Ear damage!!
  // synth.volume = get(`${schema.synth}${suffixes.synth.settings.volume}`,synth.volume)
  synth.gain = get(`${schema.synth}${suffixes.synth.settings.gain}`, synth.gain)

  // ... oscillators
  const oscs = [OSC1, OSC2, OSC3].map((base) => {
    return {
      oid: base,
      multiplier: get(`${base}${suffixes.oscillator.multiplier}`, null),
      eccentricity: get(`${base}${suffixes.oscillator.eccentricity}`, null),
      sensitivity: get(`${base}${suffixes.oscillator.sensitivity}`, null),
      rotation: get(`${base}${suffixes.oscillator.rotation}`, null),
      amplitude: get(`${base}${suffixes.oscillator.amplitude}`, null),
      shiftx: get(`${base}${suffixes.oscillator.shiftx}`, null),
      shifty: get(`${base}${suffixes.oscillator.shifty}`, null),
      phase: get(`${base}${suffixes.oscillator.phase}`, null),
      psi: get(`${base}${suffixes.oscillator.psi}`, null),
      balance: get(`${base}${suffixes.oscillator.balance}`, null),
      shape: get(`${base}${suffixes.oscillator.shape}`, null)
    }
  })

  SNs.setSNs(...oscs)

  // ... envelope
  const envelope = {
    oid: get(`${schema.synth}${suffixes.synth.envelope.oid}`, null),
    attack: get(`${schema.synth}${suffixes.synth.envelope.attack}`, null),
    decay: get(`${schema.synth}${suffixes.synth.envelope.decay}`, null),
    sustain: get(`${schema.synth}${suffixes.synth.envelope.sustain}`, null),
    release: get(`${schema.synth}${suffixes.synth.envelope.release}`, null)
  }

  envelopes.set(envelope)
  envelopes.save()

  // ... LFOs
  const lfos = [LFO1, LFO2, LFO3, LFO4].map((base) => {
    return {
      oid: base,
      on: get(`${base}${suffixes.lfo.on}`, null),
      frequency: get(`${base}${suffixes.lfo.frequency}`, null),
      min: get(`${base}${suffixes.lfo.range.min}`, null),
      max: get(`${base}${suffixes.lfo.range.max}`, null),
      plug: patchbay.lookup(get(`${base}${suffixes.lfo.plug}`, ''))
    }
  })

  const sns = [OSC4, OSC5, OSC6].map((base) => {
    return {
      oid: base,
      multiplier: get(`${base}${suffixes.oscillator.multiplier}`, null),
      eccentricity: get(`${base}${suffixes.oscillator.eccentricity}`, null),
      sensitivity: get(`${base}${suffixes.oscillator.sensitivity}`, null),
      rotation: get(`${base}${suffixes.oscillator.rotation}`, null),
      amplitude: get(`${base}${suffixes.oscillator.amplitude}`, null),
      shiftx: get(`${base}${suffixes.oscillator.shiftx}`, null),
      shifty: get(`${base}${suffixes.oscillator.shifty}`, null),
      phase: get(`${base}${suffixes.oscillator.phase}`, null),
      shape: get(`${base}${suffixes.oscillator.shape}`, null)
    }
  })

  LFOs.setLFOs(...lfos)
  LFOs.setSNs(...sns)
  LFOs.save()
}

export function serialize () {
  const clone = structuredClone(serializable)

  populate(clone)

  return clone
}

export function deserialize (object) {
  const clone = structuredClone(serializable)
  const p = object2map(object)
  const q = object2map(clone);

  [...q]
    .filter(([k, oid]) => p.has(k))
    .forEach(([k, oid]) => settings.set(oid, p.get(k)))
}

function populate (object) {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'object') {
      if (value !== null) {
        populate(value)
      }
    } else {
      object[key] = settings.has(value) ? settings.get(value) : undefined
    }
  }
}

function object2map (object) {
  const map = new Map()

  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'object') {
      if (value !== null) {
        object2map(value).forEach((v, k) => map.set(`${key}.${k}`, v))
      }
    } else {
      map.set(`${key}`, value)
    }
  }

  return map
}

const serializable = {
  synth: {
    song: `${PLAYLIST}${suffixes.playlist.song.title}`,
    file: `${PLAYLIST}${suffixes.playlist.song.file}`,
    gain: `${SYNTH}${suffixes.synth.settings.gain}`,
    volume: `${SYNTH}${suffixes.synth.settings.volume}`
  },

  oscillators: {
    red: {
      multiplier: `${OSC1}${suffixes.oscillator.multiplier}`,
      eccentricity: `${OSC1}${suffixes.oscillator.eccentricity}`,
      sensitivity: `${OSC1}${suffixes.oscillator.sensitivity}`,
      rotation: `${OSC1}${suffixes.oscillator.rotation}`,
      amplitude: `${OSC1}${suffixes.oscillator.amplitude}`,
      shiftx: `${OSC1}${suffixes.oscillator.shiftx}`,
      shifty: `${OSC1}${suffixes.oscillator.shifty}`,
      phase: `${OSC1}${suffixes.oscillator.phase}`,
      psi: `${OSC1}${suffixes.oscillator.psi}`,
      balance: `${OSC1}${suffixes.oscillator.balance}`,
      shape: `${OSC1}${suffixes.oscillator.shape}`
    },

    green: {
      multiplier: `${OSC2}${suffixes.oscillator.multiplier}`,
      eccentricity: `${OSC2}${suffixes.oscillator.eccentricity}`,
      sensitivity: `${OSC2}${suffixes.oscillator.sensitivity}`,
      rotation: `${OSC2}${suffixes.oscillator.rotation}`,
      amplitude: `${OSC2}${suffixes.oscillator.amplitude}`,
      shiftx: `${OSC2}${suffixes.oscillator.shiftx}`,
      shifty: `${OSC2}${suffixes.oscillator.shifty}`,
      phase: `${OSC2}${suffixes.oscillator.phase}`,
      psi: `${OSC2}${suffixes.oscillator.psi}`,
      balance: `${OSC2}${suffixes.oscillator.balance}`,
      shape: `${OSC2}${suffixes.oscillator.shape}`
    },

    blue: {
      multiplier: `${OSC3}${suffixes.oscillator.multiplier}`,
      eccentricity: `${OSC3}${suffixes.oscillator.eccentricity}`,
      sensitivity: `${OSC3}${suffixes.oscillator.sensitivity}`,
      rotation: `${OSC3}${suffixes.oscillator.rotation}`,
      amplitude: `${OSC3}${suffixes.oscillator.amplitude}`,
      shiftx: `${OSC3}${suffixes.oscillator.shiftx}`,
      shifty: `${OSC3}${suffixes.oscillator.shifty}`,
      phase: `${OSC3}${suffixes.oscillator.phase}`,
      psi: `${OSC3}${suffixes.oscillator.psi}`,
      balance: `${OSC3}${suffixes.oscillator.balance}`,
      shape: `${OSC3}${suffixes.oscillator.shape}`
    }
  },

  envelope: {
    oid: `${SYNTH}${suffixes.synth.envelope.oid}`,
    attack: `${SYNTH}${suffixes.synth.envelope.attack}`,
    decay: `${SYNTH}${suffixes.synth.envelope.decay}`,
    sustain: `${SYNTH}${suffixes.synth.envelope.sustain}`,
    release: `${SYNTH}${suffixes.synth.envelope.release}`
  },

  LFOs: {
    lfo1: {
      on: `${LFO1}${suffixes.lfo.on}`,
      frequency: `${LFO1}${suffixes.lfo.frequency}`,
      min: `${LFO1}${suffixes.lfo.range.min}`,
      max: `${LFO1}${suffixes.lfo.range.max}`,
      plug: `${LFO1}${suffixes.lfo.plug}`
    },

    lfo2: {
      on: `${LFO2}${suffixes.lfo.on}`,
      frequency: `${LFO2}${suffixes.lfo.frequency}`,
      min: `${LFO2}${suffixes.lfo.range.min}`,
      max: `${LFO2}${suffixes.lfo.range.max}`,
      plug: `${LFO2}${suffixes.lfo.plug}`
    },

    lfo3: {
      on: `${LFO3}${suffixes.lfo.on}`,
      frequency: `${LFO3}${suffixes.lfo.frequency}`,
      min: `${LFO3}${suffixes.lfo.range.min}`,
      max: `${LFO3}${suffixes.lfo.range.max}`,
      plug: `${LFO3}${suffixes.lfo.plug}`
    },

    lfo4: {
      on: `${LFO4}${suffixes.lfo.on}`,
      frequency: `${LFO4}${suffixes.lfo.frequency}`,
      min: `${LFO4}${suffixes.lfo.range.min}`,
      max: `${LFO4}${suffixes.lfo.range.max}`,
      plug: `${LFO4}${suffixes.lfo.plug}`
    },

    oscillators: {
      red: {
        multiplier: `${OSC4}${suffixes.oscillator.multiplier}`,
        eccentricity: `${OSC4}${suffixes.oscillator.eccentricity}`,
        sensitivity: `${OSC4}${suffixes.oscillator.sensitivity}`,
        rotation: `${OSC4}${suffixes.oscillator.rotation}`,
        amplitude: `${OSC4}${suffixes.oscillator.amplitude}`,
        shiftx: `${OSC4}${suffixes.oscillator.shiftx}`,
        shifty: `${OSC4}${suffixes.oscillator.shifty}`,
        phase: `${OSC4}${suffixes.oscillator.phase}`,
        shape: `${OSC4}${suffixes.oscillator.shape}`
      },

      green: {
        multiplier: `${OSC5}${suffixes.oscillator.multiplier}`,
        eccentricity: `${OSC5}${suffixes.oscillator.eccentricity}`,
        sensitivity: `${OSC5}${suffixes.oscillator.sensitivity}`,
        rotation: `${OSC5}${suffixes.oscillator.rotation}`,
        amplitude: `${OSC5}${suffixes.oscillator.amplitude}`,
        shiftx: `${OSC5}${suffixes.oscillator.shiftx}`,
        shifty: `${OSC5}${suffixes.oscillator.shifty}`,
        phase: `${OSC5}${suffixes.oscillator.phase}`,
        shape: `${OSC5}${suffixes.oscillator.shape}`
      },

      blue: {
        multiplier: `${OSC6}${suffixes.oscillator.multiplier}`,
        eccentricity: `${OSC6}${suffixes.oscillator.eccentricity}`,
        sensitivity: `${OSC6}${suffixes.oscillator.sensitivity}`,
        rotation: `${OSC6}${suffixes.oscillator.rotation}`,
        amplitude: `${OSC6}${suffixes.oscillator.amplitude}`,
        shiftx: `${OSC6}${suffixes.oscillator.shiftx}`,
        shifty: `${OSC6}${suffixes.oscillator.shifty}`,
        phase: `${OSC6}${suffixes.oscillator.phase}`,
        shape: `${OSC6}${suffixes.oscillator.shape}`
      }
    }
  }
}
