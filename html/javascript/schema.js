export const schema = {
  synth: '0.0',
  oscillator: '0.1',
  // OSC: '0.2',
  envelope: '0.3',
  lfo: '0.4',
  playlist: '0.5'
}

export const suffixes = {
  synth: {
    settings: {
      power: '0.1',
      volume: '.0.2',
      gain: '.0.3'
    },
    oscillator: '.1',
    R: {
      m: '.2.1.1',
      ε: '.2.1.2',
      𝗌: '.2.1.3',
      θ: '.2.1.4',
      a: '.2.1.5',
      δx: '.2.1.6',
      δy: '.2.1.7',
      Φ: '.2.1.8',
      𝜓: '.2.1.9',
      b: '.2.1.10'
    },
    G: {
      m: '.2.2.1',
      ε: '.2.2.2',
      𝗌: '.2.2.3',
      θ: '.2.2.4',
      a: '.2.2.5',
      δx: '.2.2.6',
      δy: '.2.2.7',
      Φ: '2.2.8',
      𝜓: '.2.2.9',
      b: '.2.2.10'
    },
    B: {
      m: '.2.2.1',
      ε: '.2.3.2',
      𝗌: '.2.3.3',
      θ: '.2.3.4',
      a: '.2.3.5',
      δx: '.2.3.6',
      δy: '.2.3.7',
      Φ: '2.3.8',
      𝜓: '.2.3.9',
      b: '.2.3.10'
    },
    envelope: {
      oid: '.3.0',
      attack: '.3.1',
      decay: '.3.2',
      sustain: '.3.3',
      release: '.3.4'
    },
    lfo: '.4'
  },

  oscillator: {
    multiplier: '.1',
    eccentricity: '.2',
    sensitivity: '.3',
    rotation: '.4',
    amplitude: '.5',
    shiftx: '.6',
    shifty: '.7',
    phase: '.8',
    psi: '.9',
    balance: '.10',
    shape: '.11'
  },

  envelope: {
    type: '.1',
    label: '.2',
    description: '.3',
    favourite: '.4',
    inflections: '.5',
    attack: '.5.1',
    decay: '.5.2',
    sustain: '.5.3',
    release: '.5.4'
  },

  lfo: {
    on: '.1',
    frequency: '.2',
    range: {
      min: '.3.1',
      max: '.3.2'
    },
    plug: '.4'
  },

  waveform: {
    trace: {
      yellow: '0.2.1',
      red: '0.2.2',
      green: '0.2.3',
      blue: '0.2.4'
    }
  },

  playlist: {
    song: {
      oid: '.0',
      queueid: '.0.0',
      title: '.0.1',
      file: '.0.2',
      state: '.3'
    },
    slots: '.1',
    slot: {
      url: '.1',
      title: '.2',
      state: '.3'
    }
  }
}

export const filters = {
  any: /.*/,

  synth: {
    any: /^0\.0\..*$/,
    envelope: /^0\.0\.3.0$/
  },

  envelopes: {
    any: /^0\.3\.[0-9]+\..*$/,
    label: /^0\.3\.[0-9]+\.2$/,
    favourite: /^0\.3\.[0-9]+\.4$/,
    inflections: /^0\.3\.[0-9]+\.5$/
  },

  SN: {
    any: /^0\.1\.[1-6]+\..*$/,
    OSC: /^0\.1\.[123]+\..*$/,
    LFO: /^0\.1\.[456]+\..*$/
  },

  LFO: {
    any: /^0\.4\.[1-4]+\..*$/,
    on: /^0\.4\.[1-4]+\.1$/,
    frequency: /^0\.4\.[1-4]+\.2$/,
    range: /^0\.4\.[1-4]+\.3\.[1|2]$/,
    plug: /^0\.4\.[1-4]+\.4.*$/
  },

  playlist: {
    any: /^0\.5\..*$/,
    song: {
      state: /^0\.5\.0\.3$/
    },
    slot: {
      url: /^0\.5\.1\.([1-9]|10|11|12)\.1$/,
      state: /^0\.5\.1\.([1-9]|10|11|12)\.3$/
    }
  }
}

export const anySlot = /^0\.5\.1\.([1-9]|10|11|12)$/

export const SYNTH = `${schema.synth}`
export const PLAYLIST = `${schema.playlist}`
export const SONG = `${schema.playlist}.0`

export const OSC1 = `${schema.oscillator}.1`
export const OSC2 = `${schema.oscillator}.2`
export const OSC3 = `${schema.oscillator}.3`
export const OSC4 = `${schema.oscillator}.4`
export const OSC5 = `${schema.oscillator}.5`
export const OSC6 = `${schema.oscillator}.6`

export const LFO1 = `${schema.lfo}.1`
export const LFO2 = `${schema.lfo}.2`
export const LFO3 = `${schema.lfo}.3`
export const LFO4 = `${schema.lfo}.4`

export const VOLUME = `${schema.synth}${suffixes.synth.settings.volume}`
export const GAIN = `${schema.synth}${suffixes.synth.settings.gain}`
export const ATTACK = `${schema.synth}${suffixes.synth.envelope.attack}`
export const DECAY = `${schema.synth}${suffixes.synth.envelope.decay}`
export const SUSTAIN = `${schema.synth}${suffixes.synth.envelope.sustain}`
export const RELEASE = `${schema.synth}${suffixes.synth.envelope.release}`

export const Rε = `${schema.synth}${suffixes.synth.R.ε}`
export const Gε = `${schema.synth}${suffixes.synth.G.ε}`
export const Bε = `${schema.synth}${suffixes.synth.B.ε}`

export const R𝗌 = `${schema.synth}${suffixes.synth.R.𝗌}`
export const G𝗌 = `${schema.synth}${suffixes.synth.G.𝗌}`
export const B𝗌 = `${schema.synth}${suffixes.synth.B.𝗌}`

export const Rθ = `${schema.synth}${suffixes.synth.R.θ}`
export const Gθ = `${schema.synth}${suffixes.synth.G.θ}`
export const Bθ = `${schema.synth}${suffixes.synth.B.θ}`

export const Ra = `${schema.synth}${suffixes.synth.R.a}`
export const Ga = `${schema.synth}${suffixes.synth.G.a}`
export const Ba = `${schema.synth}${suffixes.synth.B.a}`

export const Rδx = `${schema.synth}${suffixes.synth.R.δx}`
export const Gδx = `${schema.synth}${suffixes.synth.G.δx}`
export const Bδx = `${schema.synth}${suffixes.synth.B.δx}`

export const Rδy = `${schema.synth}${suffixes.synth.R.δy}`
export const Gδy = `${schema.synth}${suffixes.synth.G.δy}`
export const Bδy = `${schema.synth}${suffixes.synth.B.δy}`

export const RΦ = `${schema.synth}${suffixes.synth.R.Φ}`
export const GΦ = `${schema.synth}${suffixes.synth.G.Φ}`
export const BΦ = `${schema.synth}${suffixes.synth.B.Φ}`

export const R𝜓 = `${schema.synth}${suffixes.synth.R.𝜓}`
export const G𝜓 = `${schema.synth}${suffixes.synth.G.𝜓}`
export const B𝜓 = `${schema.synth}${suffixes.synth.B.𝜓}`

export const Rb = `${schema.synth}${suffixes.synth.R.b}`
export const Gb = `${schema.synth}${suffixes.synth.G.b}`
export const Bb = `${schema.synth}${suffixes.synth.B.b}`

export class OID {
  static matches (oid, v) {
    if (v instanceof RegExp) {
      return v.test(oid)
    } else {
      return `${oid}` === `${v}`
    }
  }

  static contains (oid, v) {
    return oid === `${v}` || oid.startsWith(`${v}.`)
  }
}
