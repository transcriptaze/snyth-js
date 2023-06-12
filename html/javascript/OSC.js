import * as dsp from './dsp/dsp.js'
import * as eventbus from './eventbus.js'
import * as oscillators from './synth/oscillators.js'
import { Parameters } from './synth/parameters.js'
import { SNR, SNG, SNB } from './synth/oscillators.js'
import { OFFSETS } from './synth/patchbay.js'
import { filters } from './schema.js'

class Oscillators {
  constructor () {
    this.genfn = document.querySelector('#OSC #osc-genfn')
    this.waveform = document.querySelector('#OSC #osc-waveform')
    this.fft = document.querySelector('#OSC #osc-fft')
    this.controlsets = [
      document.querySelector('#OSC .controlset[tag="sn.R"]'),
      document.querySelector('#OSC .controlset[tag="sn.G"]'),
      document.querySelector('#OSC .controlset[tag="sn.B"]')
    ]

    // FIXME rework as toggle buttons
    this.traces = {
      red: document.querySelector('#OSC div.traces snyth-pushbutton[tag="trace.1"]'),
      green: document.querySelector('#OSC div.traces snyth-pushbutton[tag="trace.2"]'),
      blue: document.querySelector('#OSC div.traces snyth-pushbutton[tag="trace.3"]'),
      yellow: document.querySelector('#OSC div.traces snyth-pushbutton[tag="trace.4"]')
    }

    this.internal = {
      zoom: document.querySelector('#osc-zoom'),
      animate: document.querySelector('#osc-animate')
    }

    this.scale = 1
  }

  get animate () {
    return this.internal.animate.checked
  }

  get parameters () {
    return oscillators.parameters()
  }

  initialise () {
    this.controlsets[0].defaults = DEFAULTS.controlsets[0].asObject()
    this.controlsets[1].defaults = DEFAULTS.controlsets[1].asObject()
    this.controlsets[2].defaults = DEFAULTS.controlsets[2].asObject()

    this.controlsets[0].values = VALUES.controlsets[0].asObject()
    this.controlsets[1].values = VALUES.controlsets[1].asObject()
    this.controlsets[2].values = VALUES.controlsets[2].asObject()

    this.controlsets.forEach((e) => {
      e.onchange = (tag, param, value) => {
        oscillators.set(tag, param, value, 'change')
      }

      e.onchanged = (tag, param, value) => {
        oscillators.set(tag, param, value, 'changed')
      }
    })

    this.traces.red.onclick = (e) => { this.toggle(1) }
    this.traces.green.onclick = (e) => { this.toggle(2) }
    this.traces.blue.onclick = (e) => { this.toggle(3) }
    this.traces.yellow.onclick = (e) => { this.toggle(4) }

    this.internal.zoom.onchanged = (scale) => { this.zoom(scale) }

    eventbus.subscribe('changed', (e) => {
      this.controlsets[0].values = SNR.asObject()
      this.controlsets[1].values = SNG.asObject()
      this.controlsets[2].values = SNB.asObject()

      this.redraw()
    }, filters.SN.OSC)

    this.redraw()
  }

  reset () {
    this.controlsets.forEach((c) => c.reset())
  }

  zoom (scale) {
    this.scale = scale
    this.redraw()
  }

  toggle (trace) {
    const c = styles[trace - 1]
    const base = c.base
    const v = visibility.get(c.visibility)
    const alpha = transparency.get(v)

    c.visibility = v

    c.colours[0].colour = `${base}${alpha[0]}`
    c.colours[1].colour = `${base}${alpha[1]}`
    c.colours[2].colour = `${base}${alpha[2]}`

    this.redraw()
  }

  redraw (patchbay) {
    const parameters = this.parameters

    if (patchbay != null && this.animate) {
      for (let i = 0; i < 3; i++) {
        parameters[i].e *= patchbay[OFFSETS.ε[i]]
        parameters[i].s *= patchbay[OFFSETS.𝗌[i]]
        parameters[i].θ *= patchbay[OFFSETS.θ[i]]
        parameters[i].h *= patchbay[OFFSETS.a[i]]
        parameters[i].h *= patchbay[OFFSETS.a[i]]
        parameters[i].δx *= patchbay[OFFSETS.δx[i]]
        parameters[i].δy *= patchbay[OFFSETS.δy[i]]
      }
    }

    const shapes = dsp.shapes(parameters)
    const paths = dsp.paths(parameters)

    this.genfn.redraw(shapes, styles, this.scale)
    this.waveform.redraw(paths, styles, this.scale)
    this.fft.fft = dsp.dft(parameters)
  }
}

export const OSC = new Oscillators()

/* eslint-disable no-multi-spaces */
const visibility = new Map([
  [0,    0.25],
  [0.25, 1],
  [0.5,  0],
  [1,    0.5]
])

const transparency = new Map([
  [0,    ['00', '00', '00']],
  [0.25, ['10', '20', '40']],
  [0.5,  ['20', '40', '80']],
  [1,    ['40', '80', 'ff']]
])

const styles = [
  {
    base: '#ff0000',
    visibility: 1,
    colours: [
      { colour: '#ff000040', width: 10 },
      { colour: '#ff000080', width: 4 },
      { colour: '#ff0000ff', width: 2 }
    ]
  },
  {
    base: '#00c000',
    visibility: 1,
    colours: [
      { colour: '#00c00040', width: 10 },
      { colour: '#00c00080', width: 4 },
      { colour: '#00c000ff', width: 2 }
    ]
  },
  {
    base: '#4040ff',
    visibility: 1,
    colours: [
      { colour: '#4040ff40', width: 10 },
      { colour: '#4040ff80', width: 4 },
      { colour: '#4040ffff', width: 2 }]
  },
  {
    base: '#ffff00',
    visibility: 1,
    colours: [
      { colour: '#ffff0040', width: 10 },
      { colour: '#ffff0080', width: 4 },
      { colour: '#ffff00ff', width: 2 }
    ]
  }
]

/* eslint-disable no-multi-spaces */
const DEFAULTS = {
  controlsets: [
    new Parameters({ m: 1, e: 0, s: 10, θ: 0, h: 1, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 2, e: 0, s: 10, θ: 0, h: 0, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 4, e: 0, s: 10, θ: 0, h: 0, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' })
  ]
}

const VALUES = {
  controlsets: [
    new Parameters({ m: 1, e: 0.1, s: 10, θ: 30, h: 0.7, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 2, e: 0,   s: 10, θ: 0,  h: 0.5, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' }),
    new Parameters({ m: 4, e: 0,   s: 10, θ: 0,  h: 0.3, Φ: 0, balance: 0, 𝜓: 0, δx: 0, δy: 0, shape: 'ellipse' })
  ]
}
/* eslint-enable no-multi-spaces */

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 60) === 0) {
    console.log(v)
  }

  _log.count++
}
