import { suffixes } from '../schema.js'
import * as eventbus from '../eventbus.js'

export class SN {
  constructor (oid, multiplier, eccentricity, sensitivity, rotation, amplitude, shiftx, shifty, phase, psi, balance, shape) {
    this.internal = {
      oid,
      multiplier,
      eccentricity,
      sensitivity,
      rotation,
      amplitude,
      shiftx,
      shifty,
      phase,
      psi,
      balance,
      shape
    }

    this.defaults = {
      multiplier,
      eccentricity,
      sensitivity,
      rotation,
      amplitude,
      shiftx,
      shifty,
      phase,
      psi,
      balance,
      shape
    }
  }

  get oid () {
    return this.internal.oid
  }

  get multiplier () {
    return this.internal.multiplier
  }

  set multiplier (v) {
    const val = parseInt(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val) && val > 0 && val <= 8) {
      this.internal.multiplier = val

      dispatch(event, this.oid, suffixes.oscillator.multiplier, this.multiplier)
    }
  }

  get eccentricity () {
    return Number(this.internal.eccentricity)
  }

  set eccentricity (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.eccentricity = clamp(val, -1, +1)

      dispatch(event, this.oid, suffixes.oscillator.eccentricity, this.eccentricity)
    }
  }

  get sensitivity () {
    return Number(this.internal.sensitivity)
  }

  set sensitivity (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.sensitivity = clamp(val, 0, 20)

      dispatch(event, this.oid, suffixes.oscillator.sensitivity, this.sensitivity)
    }
  }

  get rotation () {
    return this.internal.rotation
  }

  set rotation (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.rotation = clamp(val, -90, +90)

      dispatch(event, this.oid, suffixes.oscillator.rotation, this.rotation)
    }
  }

  get amplitude () {
    return this.internal.amplitude
  }

  set amplitude (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.amplitude = clamp(val, 0, +1)

      dispatch(event, this.oid, suffixes.oscillator.amplitude, this.amplitude)
    }
  }

  get shiftx () {
    return this.internal.shiftx
  }

  set shiftx (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.shiftx = clamp(val, -1, +1)

      dispatch(event, this.oid, suffixes.oscillator.shiftx, this.shiftx)
    }
  }

  get shifty () {
    return this.internal.shifty
  }

  set shifty (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.shifty = clamp(val, -1, +1)

      dispatch(event, this.oid, suffixes.oscillator.shifty, this.shifty)
    }
  }

  get phase () {
    return this.internal.phase
  }

  set phase (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.phase = clamp(val, -90, +90)

      dispatch(event, this.oid, suffixes.oscillator.phase, this.phase)
    }
  }

  get psi () {
    return this.internal.psi
  }

  set psi (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.psi = clamp(val, -90, +90)

      dispatch(event, this.oid, suffixes.oscillator.psi, this.psi)
    }
  }

  get balance () {
    return this.internal.balance
  }

  set balance (v) {
    const val = parseFloat(Array.isArray(v) ? v[0] : v)
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (!Number.isNaN(val)) {
      this.internal.balance = clamp(val, -1, +1)

      dispatch(event, this.oid, suffixes.oscillator.balance, this.balance)
    }
  }

  get shape () {
    return this.internal.shape
  }

  set shape (v) {
    const val = Array.isArray(v) ? v[0] : v
    const event = Array.isArray(v) && v[1] === 'change' ? 'change' : 'changed'

    if (val === 'ellipse' || val === 'square' || val === 'cowbell') {
      this.internal.shape = val

      dispatch(event, this.oid, suffixes.oscillator.shape, this.shape)
    }
  }

  reset ({ m, ε, 𝗌, θ, a, δx, δy, Φ, 𝜓, b, shape }) {
    this.internal.multiplier = m == null ? this.defaults.multiplier : m
    this.internal.eccentricity = ε == null ? this.defaults.eccentricity : ε
    this.internal.sensitivity = 𝗌 == null ? this.defaults.sensitivity : 𝗌
    this.internal.rotation = θ == null ? this.defaults.rotation : θ
    this.internal.amplitude = a == null ? this.defaults.amplitude : a
    this.internal.shiftx = δx == null ? this.defaults.shiftx : δx
    this.internal.shifty = δy == null ? this.defaults.shifty : δy
    this.internal.phase = Φ == null ? this.defaults.phase : Φ
    this.internal.psi = 𝜓 == null ? this.defaults.psi : 𝜓
    this.internal.balance = b == null ? this.defaults.balance : b
    this.internal.shape = shape == null ? this.defaults.shape : shape
  }

  asObject () {
    return {
      m: this.multiplier,
      e: this.eccentricity,
      s: this.sensitivity,
      θ: this.rotation,
      h: this.amplitude,
      δx: this.shiftx,
      δy: this.shifty,
      Φ: this.phase,
      𝜓: this.psi,
      balance: this.balance,
      shape: this.shape
    }
  }

  serialise () {
    return {
      oid: this.oid,
      multiplier: this.multiplier,
      eccentricity: this.eccentricity,
      sensitivity: this.sensitivity,
      amplitude: this.amplitude,
      shiftx: this.shiftx,
      shifty: this.shifty,
      phase: this.phase,
      psi: this.psi,
      balance: this.balance,
      shape: this.shape
    }
  }

  deserialise (v) {
    if (v != null) {
      if (!Number.isNaN(v.multiplier) && v.multiplier > 0 && v.multiplier <= 8) {
        this.internal.multiplier = v.multiplier
      }

      if (!Number.isNaN(v.eccentricity)) {
        this.internal.eccentricity = clamp(v.eccentricity, -1, +1)
      }

      if (!Number.isNaN(v.sensitivity)) {
        this.internal.sensitivity = clamp(v.sensitivity, 0, 20)
      }

      if (!Number.isNaN(v.amplitude)) {
        this.internal.amplitude = clamp(v.amplitude, 0, 1)
      }

      if (!Number.isNaN(v.shiftx)) {
        this.internal.shiftx = clamp(v.shiftx, -1, +1)
      }

      if (!Number.isNaN(v.shifty)) {
        this.internal.shifty = clamp(v.shifty, -1, +1)
      }

      if (!Number.isNaN(v.phase)) {
        this.internal.phase = clamp(v.phase, -1, +1)
      }

      if (!Number.isNaN(v.psi)) {
        this.internal.psi = clamp(v.psi, -1, +1)
      }

      if (!Number.isNaN(v.balance)) {
        this.internal.balance = clamp(v.balance, -1, +1)
      }

      if (v.shape === 'ellipse' || v.shape === 'square' || v.shape === 'cowbell') {
        this.internal.shape = v.shape
      }
    }
  }
}

function dispatch (eventType, oid, suffix, value) {
  const evt = new CustomEvent(eventType, {
    detail: {
      oid: oid + suffix,
      value
    }
  })

  eventbus.publish(evt)
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}
