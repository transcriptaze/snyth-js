import * as db from '../db.js'
import { SN } from './SN.js'
import { LFO } from './lfo.js'
import { lookup } from './patchbay.js'
import { OID, LFO1, LFO2, LFO3, LFO4, OSC4, OSC5, OSC6, VOLUME, GAIN } from '../schema.js'

export const SNR = new SN(OSC4, 1, 0, 10, 0, 0.5, 0, 0, 0, 0, 0, 'ellipse')
export const SNG = new SN(OSC5, 2, 0, 10, 0, 0.3, 0, 0, 0, 0, 0, 'ellipse')
export const SNB = new SN(OSC6, 4, 0, 10, 0, 0.2, 0, 0, 0, 0, 0, 'ellipse')

export const SNs = new Map([
  ['sn.R', SNR],
  ['sn.G', SNG],
  ['sn.B', SNB]
])

export const LFOs = new Map([
  ['lfo.1', new LFO(LFO1, 0.1, { min: -1, max: +1 }, VOLUME)],
  ['lfo.2', new LFO(LFO2, 0.1, { min: -1, max: +1 }, GAIN)],
  ['lfo.3', new LFO(LFO3, 0.1, { min: -1, max: +1 }, null)],
  ['lfo.4', new LFO(LFO4, 0.1, { min: -1, max: +1 }, null)]
])

export function parameters () {
  return [SNR, SNG, SNB].map((sn) => {
    return {
      m: sn.multiplier,
      e: sn.eccentricity,
      s: sn.sensitivity,
      θ: sn.rotation,
      h: sn.amplitude,
      Φ: sn.phase,
      𝜓: 0,
      δx: sn.shiftx,
      δy: sn.shifty,
      shape: sn.shape
    }
  })
}

export function get (tag) {
  return LFOs.get(tag)
}

export function set (tag, param, value, event) {
  if (SNs.has(tag)) {
    const sn = SNs.get(tag)

    switch (param) {
      case 'm':
        sn.multiplier = [value, event]
        break

      case 'ε':
        sn.eccentricity = [value, event]
        break

      case '𝗌':
        sn.sensitivity = [value, event]
        break

      case 'θ':
        sn.rotation = [value, event]
        break

      case 'a':
        sn.amplitude = [value, event]
        break

      case 'δx':
        sn.shiftx = [value, event]
        break

      case 'δy':
        sn.shifty = [value, event]
        break

      case 'Φ':
        sn.phase = [value, event]
        break

      case 'shape':
        sn.shape = [value, event]
        break
    }
  }

  if (LFOs.has(tag)) {
    const lfo = get(tag)

    switch (true) {
      case param === 'on':
        lfo.on = value
        break

      case param === 'frequency':
        lfo.frequency = value
        break

      case param === 'range':
        lfo.range = value
        break

      case param === 'plug':
        lfo.plug = lookup(value)
        break
    }
  }
}

export function setLFOs (...objects) {
  for (const object of objects) {
    for (const lfo of LFOs.values()) {
      if (OID.matches(object.oid, lfo.oid)) {
        lfo.on = object.on
        lfo.frequency = object.frequency
        lfo.range = { min: object.min, max: object.max }
        lfo.plug = object.plug
      }
    }
  }
}

export function setSNs (...objects) {
  for (const object of objects) {
    for (const sn of SNs.values()) {
      if (OID.matches(object.oid, sn.oid)) {
        sn.multiplier = object.multiplier
        sn.eccentricity = object.eccentricity
        sn.sensitivity = object.sensitivity
        sn.rotation = object.rotation
        sn.amplitude = object.amplitude
        sn.shiftx = object.shiftx
        sn.shifty = object.shifty
        sn.phase = object.phase
        sn.shape = object.shape
      }
    }
  }
}

export function patches () {
  const patches = [...LFOs.entries()].map(([tag, v]) => {
    return [tag, lookup(v.plug)]
  })

  return new Map(patches)
}

export function save () {
  const object = {
    SNs: [...SNs.values()].map((v) => v.serialise()),
    LFOs: [...LFOs.values()].map((v) => v.serialise())
  }

  db.store('LFOs', object)
}

export function restore () {
  try {
    const objects = db.retrieve('LFOs')

    if (objects != null) {
      const map = new Map([...LFOs.values(), ...SNs.values()].map(v => [v.oid, v]))

      if (Object.hasOwn(objects, 'SNs')) {
        for (const v of objects.SNs) {
          if (map.has(v.oid)) {
            map.get(v.oid).deserialise(v)
          }
        }
      }

      if (Object.hasOwn(objects, 'LFOs')) {
        for (const v of objects.LFOs) {
          if (map.has(v.oid)) {
            map.get(v.oid).deserialise(v)
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
}
