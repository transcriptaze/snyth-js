import { suffixes } from '../../schema.js'
import { Envelope } from './envelope.js'

const OFFSET = 48

export class AR extends Envelope {
  static unpack (array) {
    const attack = array[OFFSET + 1]
    const release = array[OFFSET + 4]

    return {
      type: 'AR',
      attack,
      decay: 0,
      sustain: 1,
      release
    }
  }

  constructor (oid, deflabel, label, text, attack, release, favourite) {
    super('AR', oid, deflabel, label, text, favourite)

    this.envelope = {
      attack,
      decay: 0,
      sustain: 1,
      release
    }

    this.defaults.envelope = {
      attack,
      decay: 0,
      sustain: 1,
      release
    }
  }

  get edited () {
    return this.envelope.attack !== 0 || this.envelope.release !== 0
  }

  get attack () {
    return Number.isNaN(this.envelope.attack) ? 0 : this.envelope.attack
  }

  set attack (v) {
    if (v != null && !Number.isNaN(v)) {
      this.envelope.attack = clamp(v, this.limits.attack.min, this.limits.attack.max)
    }
  }

  get decay () {
    return 0
  }

  set decay (v) {
  }

  get sustain () {
    return 1
  }

  set sustain (v) {
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
    this.release = this.defaults.envelope.release

    this.dispatch('changed', suffixes.envelope.inflections, {
      attack: this.attack,
      release: this.release
    })
  }

  clone () {
    return {
      type: this.type,
      attack: this.attack,
      decay: 0,
      sustain: 1,
      release: this.release
    }
  }

  update (tag, value, at, level) {
    if (tag === 'A') {
      this.attack = value != null ? value : at
      this.dispatch('change', suffixes.envelope.attack, this.attack)
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

    if (tag === 'R') {
      this.release = value != null ? value : at
      this.dispatch('changed', suffixes.envelope.release, this.release)
    }
  }

  inflections () {
    return {
      attack: [
        { tag: 'A', value: this.attack, at: this.attack, v: 1 }
      ],
      sustain: [
      ],
      release: [
        { tag: 'R', value: this.release, at: this.release, v: 0 }
      ]
    }
  }

  pack (array) {
    array[OFFSET] = 1
    array[OFFSET + 1] = this.attack
    array[OFFSET + 2] = 0
    array[OFFSET + 3] = 1
    array[OFFSET + 4] = this.release
  }

  serialise () {
    return {
      oid: this.oid,
      type: 'AR',
      label: this.label,
      text: this.text,
      favourite: this.favourite,
      attack: this.attack,
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

      if (!Number.isNaN(v.release)) {
        this.envelope.release = clamp(v.release, 0, 1)
      }
    }
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}
