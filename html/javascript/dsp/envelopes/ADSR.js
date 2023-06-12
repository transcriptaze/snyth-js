import { suffixes } from '../../schema.js'
import { Envelope } from './envelope.js'

const OFFSET = 48

export class ADSR extends Envelope {
  static unpack (array) {
    const attack = array[OFFSET + 1]
    const decay = array[OFFSET + 2]
    const sustain = array[OFFSET + 3]
    const release = array[OFFSET + 4]

    return {
      type: 'ADSR',
      attack,
      decay,
      sustain,
      release
    }
  }

  constructor (oid, deflabel, label, text, attack, decay, sustain, release, favourite) {
    super('ADSR', oid, deflabel, label, text, favourite)

    this.envelope = {
      attack,
      decay,
      sustain,
      release
    }

    this.defaults.envelope = {
      attack,
      decay,
      sustain,
      release
    }
  }

  get edited () {
    return this.envelope.attack !== 0 || this.envelope.decay !== 0 || this.envelope.sustain !== 1 || this.envelope.release !== 0
  }

  get attack () {
    return Number.isNaN(this.envelope.attack) ? 0 : this.envelope.attack
  }

  set attack (v) {
    if (v != null && !Number.isNaN(v)) {
      this.envelope.attack = clamp(v, Math.max(0, this.limits.attack.min - this.decay), this.limits.attack.max - this.decay)
    }
  }

  get decay () {
    return Number.isNaN(this.envelope.decay) ? 0 : this.envelope.decay
  }

  set decay (v) {
    if (v != null && !Number.isNaN(v)) {
      this.envelope.decay = clamp(v, Math.max(0, this.limits.attack.min - this.attack), this.limits.attack.max - this.attack)
    }
  }

  get sustain () {
    return Number.isNaN(this.envelope.sustain) ? 1 : this.envelope.sustain
  }

  set sustain (v) {
    if (v != null && !Number.isNaN(v)) {
      this.envelope.sustain = clamp(v, 0, 1)
    }
  }

  get release () {
    return Number.isNaN(this.envelope.release) ? 0 : this.envelope.release
  }

  set release (v) {
    if (v != null && !Number.isNaN(v)) {
      this.envelope.release = clamp(v, this.limits.release.min, this.limits.release.max)
    }
  }

  reset () {
    super.reset()

    this.attack = this.defaults.envelope.attack
    this.decay = this.defaults.envelope.decay
    this.sustain = this.defaults.envelope.sustain
    this.release = this.defaults.envelope.release

    this.dispatch('changed', suffixes.envelope.inflections, {
      attack: this.attack,
      decay: this.decay,
      sustain: this.sustain,
      release: this.release
    })
  }

  clone () {
    return {
      type: this.type,
      attack: this.attack,
      decay: this.decay,
      sustain: this.sustain,
      release: this.release
    }
  }

  update (tag, value, at, level) {
    if (tag === 'A') {
      this.attack = value != null ? value : at
      this.dispatch('change', suffixes.envelope.attack, this.attack)
    }

    if (tag === 'D') {
      this.decay = value != null ? value : at - this.attack
      this.dispatch('change', suffixes.envelope.decay, this.decay)
    }

    if (tag === 'S') {
      this.sustain = value != null ? value : level
      this.dispatch('change', suffixes.envelope.sustain, this.sustain)
    }

    if (tag === 'R') {
      this.release = value != null ? value : at
      this.dispatch('change', suffixes.envelope.release, this.release)
    }
  }

  commit (tag, value, at, level) {
    if (tag === 'A') {
      this.attack = value != null ? value : at
      this.dispatch('changed', suffixes.envelope.attack, this.attack)
    }

    if (tag === 'D') {
      this.decay = value != null ? value : at - this.attack
      this.dispatch('changed', suffixes.envelope.decay, this.decay)
    }

    if (tag === 'S') {
      this.sustain = value != null ? value : level
      this.dispatch('changed', suffixes.envelope.sustain, this.sustain)
    }

    if (tag === 'R') {
      this.release = value != null ? value : at
      this.dispatch('changed', suffixes.envelope.release, this.release)
    }
  }

  inflections () {
    return {
      attack: [
        { tag: 'A', value: this.attack, at: this.attack, v: 1 },
        { tag: 'D', value: this.decay, at: this.attack + this.decay, v: this.sustain }
      ],
      sustain: [
        { tag: 'S', value: this.sustain, level: this.sustain, start: this.attack + this.decay }
      ],
      release: [
        { tag: 'R', value: this.release, at: this.release, v: 0 }
      ]

    }
  }

  pack (array) {
    array[OFFSET] = 2
    array[OFFSET + 1] = this.attack
    array[OFFSET + 2] = this.decay
    array[OFFSET + 3] = this.sustain
    array[OFFSET + 4] = this.release
  }

  serialise () {
    return {
      oid: this.oid,
      type: 'ADSR',
      label: this.internal.label,
      text: this.text,
      favourite: this.favourite,
      attack: this.attack,
      decay: this.decay,
      sustain: this.sustain,
      release: this.release
    }
  }

  deserialise (v) {
    if (v != null && v.type != null && v.type === this.type) {
      this.internal.label = v.label != null ? `${v.label}` : ''
      this.internal.text = v.text != null ? `${v.text}` : ''
      this.internal.favourite = Boolean(v.favourite)

      if (!Number.isNaN(v.attack)) {
        this.envelope.attack = clamp(v.attack, 0, 1)
      }

      if (!Number.isNaN(v.decay)) {
        this.envelope.decay = clamp(v.decay, 0, 1)
      }

      if (!Number.isNaN(v.sustain)) {
        this.envelope.sustain = clamp(v.sustain, 0, 1)
      }

      if (!Number.isNaN(v.release)) {
        this.envelope.release = clamp(v.release, 0, 1)
      }
    }
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}
