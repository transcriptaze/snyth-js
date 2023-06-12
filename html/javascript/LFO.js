import { filters } from './schema.js'
import * as eventbus from './eventbus.js'
import * as dsp from './dsp/dsp.js'
import { Parameters } from './synth/parameters.js'
import * as LFOs from './synth/LFOs.js'

class LFOPage {
  constructor () {
    this.genfn = document.querySelector('#LFO snyth-genfn')
    this.waveform = document.querySelector('#LFO snyth-waveform')
    this.controlsets = [
      document.querySelector('#LFO .controlset[tag="sn.R"]'),
      document.querySelector('#LFO .controlset[tag="sn.G"]'),
      document.querySelector('#LFO .controlset[tag="sn.B"]')
    ]

    this.switches = [
      document.querySelector('#LFO .switches snyth-togglebutton[tag="lfo.1"]'),
      document.querySelector('#LFO .switches snyth-togglebutton[tag="lfo.2"]'),
      document.querySelector('#LFO .switches snyth-togglebutton[tag="lfo.3"]'),
      document.querySelector('#LFO .switches snyth-togglebutton[tag="lfo.4"]')
    ]

    this.frequencies = [
      document.querySelector('#LFO .frequencies snyth-lfo-frequency[tag="lfo.1"]'),
      document.querySelector('#LFO .frequencies snyth-lfo-frequency[tag="lfo.2"]'),
      document.querySelector('#LFO .frequencies snyth-lfo-frequency[tag="lfo.3"]'),
      document.querySelector('#LFO .frequencies snyth-lfo-frequency[tag="lfo.4"]')
    ]

    this.ranges = [
      document.querySelector('#LFO .ranges snyth-minmax[tag="lfo.1"]'),
      document.querySelector('#LFO .ranges snyth-minmax[tag="lfo.2"]'),
      document.querySelector('#LFO .ranges snyth-minmax[tag="lfo.3"]'),
      document.querySelector('#LFO .ranges snyth-minmax[tag="lfo.4"]')
    ]

    this.patchbay = document.querySelector('#LFO .patch-panel')
    this.scale = 1
  }

  initialise () {
    // ... initialise SNs
    this.controlsets[0].defaults = DEFAULTS.controlsets[0].asObject()
    this.controlsets[1].defaults = DEFAULTS.controlsets[1].asObject()
    this.controlsets[2].defaults = DEFAULTS.controlsets[2].asObject()

    this.controlsets[0].values = VALUES.controlsets[0].asObject()
    this.controlsets[1].values = VALUES.controlsets[1].asObject()
    this.controlsets[2].values = VALUES.controlsets[2].asObject()

    this.controlsets[0].values = LFOs.SNR.asObject()
    this.controlsets[1].values = LFOs.SNG.asObject()
    this.controlsets[2].values = LFOs.SNB.asObject()

    // ... initialise LFOs
    this.switches.forEach((e) => {
      e.state = LFOs.get(e.tag).on ? 'on' : 'off'
    })

    this.frequencies.forEach((e) => {
      e.value = LFOs.get(e.tag).frequency
    })

    this.ranges.forEach((e) => {
      e.value = LFOs.get(e.tag).range
    })

    this.patchbay.initialise(LFOs.patches())

    this.switches.forEach((e) => {
      this.patchbay.on(e.tag, e.state === 'on')
    })

    // ... setup event listeners
    this.controlsets.forEach((e) => {
      e.onchange = (tag, param, value) => {
        LFOs.set(tag, param, value, 'change')
      }

      e.onchanged = (tag, param, value) => {
        LFOs.set(tag, param, value, 'changed')
      }
    })

    this.switches.forEach((e) => {
      e.onchanged = (tag, state) => {
        LFOs.set(tag, 'on', state === 'on', 'changed')

        this.patchbay.on(tag, state === 'on')
      }
    })

    this.frequencies.forEach((e) => {
      e.onchange = (tag, value) => {
        LFOs.set(tag, 'frequency', value, 'change')
      }

      e.onchanged = (tag, value) => {
        LFOs.set(tag, 'frequency', value, 'changed')
      }
    })

    this.ranges.forEach((e) => {
      e.onchange = (tag, value) => {
        LFOs.set(tag, 'range', value, 'change')
      }

      e.onchanged = (tag, value) => {
        LFOs.set(tag, 'range', value, 'changed')
      }
    })

    this.patchbay.onchanged = (tag, value) => {
      LFOs.set(tag, 'plug', value, 'changed')
    }

    eventbus.subscribe('changed', (e) => {
      this.reinitialise()
      this.redraw()
      LFOs.save()
    }, filters.SN.LFO)

    eventbus.subscribe('changed', (e) => {
      this.reinitialise()
      LFOs.save()
    }, filters.LFO.any)

    this.redraw()
  }

  reinitialise () {
    // ... initialise SNs
    this.controlsets[0].values = LFOs.SNR.asObject()
    this.controlsets[1].values = LFOs.SNG.asObject()
    this.controlsets[2].values = LFOs.SNB.asObject()

    // ... initialise LFOs
    this.switches.forEach((e) => {
      e.state = LFOs.get(e.tag).on ? 'on' : 'off'
    })

    this.frequencies.forEach((e) => {
      e.value = LFOs.get(e.tag).frequency
    })

    this.ranges.forEach((e) => {
      e.value = LFOs.get(e.tag).range
    })

    this.patchbay.initialise(LFOs.patches())

    this.switches.forEach((e) => {
      this.patchbay.on(e.tag, e.state === 'on')
    })
  }

  redraw () {
    redraw(this.genfn, this.waveform, regenerate(this.controlsets), this.scale)
  }
}

export const LFO = new LFOPage()

function redraw (genfn, waveform, parameters, scale) {
  const N = 720
  const shapes = dsp.shapes(parameters)
  const paths = dsp.paths(parameters, N).map((p) => (p.map((v) => clamp(v, -1, +1))))

  genfn.redraw(shapes, styles, scale)
  waveform.redraw(paths, styles, scale)
}

function regenerate (controlsets) {
  return [LFOs.SNR, LFOs.SNG, LFOs.SNB]
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
          𝜓: 0,
          balance: 0,
          shape: v.shape
        }
      )
    })
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

const DEFAULTS = {
  controlsets: [
    new Parameters({ m: 1, e: 0, s: 10, θ: 0, h: 1, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 2, e: 0, s: 10, θ: 0, h: 0, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 4, e: 0, s: 10, θ: 0, h: 0, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' })
  ]
}

const VALUES = {
  controlsets: [
    new Parameters({ m: 1, e: 0, s: 10, θ: 0, h: 0.5, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 2, e: 0, s: 10, θ: 0, h: 0.3, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 4, e: 0, s: 10, θ: 0, h: 0.2, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' })
  ]
}

export const styles = [
  {
    base: '#ff0000',
    visibility: 1,
    colours: [
      { colour: '#ff000030', width: 10 },
      { colour: '#ff000050', width: 4 },
      { colour: '#ff000090', width: 2 }
    ]
  },
  {
    base: '#00c000',
    visibility: 1,
    colours: [
      { colour: '#00c00030', width: 10 },
      { colour: '#00c00050', width: 4 },
      { colour: '#00c00090', width: 2 }
    ]
  },
  {
    base: '#4040ff',
    visibility: 1,
    colours: [
      { colour: '#4040ff30', width: 10 },
      { colour: '#4040ff50', width: 4 },
      { colour: '#4040ff90', width: 2 }]
  },
  {
    base: '#ffb300',
    visibility: 1,
    colours: [
      { colour: '#ffb30040', width: 10 },
      { colour: '#ffb30080', width: 4 },
      { colour: '#ffb300ff', width: 2 }
    ]
  }
]
