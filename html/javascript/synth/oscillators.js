import * as db from '../db.js'
import { OID, OSC1, OSC2, OSC3 } from '../schema.js'
import { SN } from './SN.js'
import { Parameters } from './parameters.js'

export const SNR = new SN(OSC1, 1, 0.1, 10, 30, 0.7, 0, 0, 0, 0, 0, 'ellipse')
export const SNG = new SN(OSC2, 2, 0.0, 10, 0, 0.5, 0, 0, 0, 0, 0, 'ellipse')
export const SNB = new SN(OSC3, 4, 0.0, 10, 0, 0.3, 0, 0, 0, 0, 0, 'ellipse')

export const SNs = new Map([
  ['sn.R', SNR],
  ['sn.G', SNG],
  ['sn.B', SNB]
])

export function parameters () {
  return [SNR, SNG, SNB]
    .map((v) => {
      return new Parameters(
        {
          m: v.multiplier,
          e: v.eccentricity,
          s: v.sensitivity,
          θ: v.rotation,
          h: v.amplitude,
          δx: v.shiftx,
          δy: v.shifty,
          Φ: v.phase,
          balance: v.balance,
          𝜓: -v.psi,
          shape: v.shape
        })
    })
}

export function get (tag) {
  return SNs.get(tag)
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

      case '𝜓':
        sn.psi = [value, event]
        break

      case 'b':
        sn.balance = [value, event]
        break

      case 'shape':
        sn.shape = [value, event]
        break
    }
  }
}

export function reset () {
  SNR.reset({ m: 1, ε: 0, 𝗌: 10, θ: 0, a: 1, δx: 0, δy: 0, Φ: 0, 𝜓: 0, b: 0, shape: 'ellipse' })
  SNG.reset({ m: 2, ε: 0, 𝗌: 10, θ: 0, a: 0, δx: 0, δy: 0, Φ: 0, 𝜓: 0, b: 0, shape: 'ellipse' })
  SNB.reset({ m: 4, ε: 0, 𝗌: 10, θ: 0, a: 0, δx: 0, δy: 0, Φ: 0, 𝜓: 0, b: 0, shape: 'ellipse' })
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
        sn.psi = object.psi
        sn.balance = object.balance
        sn.shape = object.shape
      }
    }
  }
}

export function save () {
  const objects = SNs.map((v) => v.serialise())

  db.store('oscillators', objects)
}

export function restore () {
  // try {
  //   const objects = db.retrieve('LFOs')
  //
  //   if (objects != null) {
  //     for (const [ix, v] of objects.entries()) {
  //       SNs[ix].deserialise(v)
  //     }
  //   }
  // } catch (err) {
  //   console.error(err)
  // }
}
