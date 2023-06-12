const TAU = 2 * Math.PI

const FS = 44100
const PAGES = 2
const TABLESIZE = 720
const PAGESIZE = TABLESIZE * Float32Array.BYTES_PER_ELEMENT
const BUFFERSIZE = PAGES * TABLESIZE * Float32Array.BYTES_PER_ELEMENT

export class LFO extends AudioWorkletProcessor {
  constructor () {
    super()

    this.port.onmessage = this.onMessage.bind(this)
    this.α = 0
    this.v = 0

    this.sab = new SharedArrayBuffer(BUFFERSIZE)
    this.version = 0
    this.wavetable = [
      new Float32Array(this.sab, 0 * PAGESIZE, TABLESIZE),
      new Float32Array(this.sab, 1 * PAGESIZE, TABLESIZE)
    ]

    this.port.postMessage({
      message: 'wavetable',
      sab: this.sab,
      N: TABLESIZE,
      pages: PAGES,
      version: this.version
    })
  }

  static get parameterDescriptors () {
    return [
      {
        name: 'on',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate'
      },
      {
        name: 'frequency',
        defaultValue: 0.1,
        minValue: 0.1,
        maxValue: 11.0,
        automationRate: 'k-rate'
      },
      {
        name: 'min',
        defaultValue: -1,
        minValue: -1,
        maxValue: 1,
        automationRate: 'k-rate'
      },
      {
        name: 'max',
        defaultValue: +1,
        minValue: -1,
        maxValue: 1,
        automationRate: 'k-rate'
      }
    ]
  }

  onMessage (event) {
    switch (event.data.message) {
      case 'wavetable':
        this.version = event.data.version
        break
    }
  }

  process (inputs, outputs, parameters) {
    const out = outputs[0]
    const v = clamp(parameters.on[0], 0, 1)
    const f = parameters.frequency[0]
    const min = clamp(parameters.min[0], -1, +1)
    const max = clamp(parameters.max[0], -1, +1)

    if (this.v < v) {
      this.v = clamp(this.v + 0.005, 0, 1)
    } else if (this.v > v) {
      this.v = clamp(this.v - 0.005, 0, 1)
    }

    const page = this.version % PAGES
    const wavetable = this.wavetable[page]
    const offset = 1 - this.v * (1 - (max + min) / 2)
    const amplitude = this.v * (max - min) / 2

    this.α = _sn(wavetable, f, offset, amplitude, this.α, out[0], v === 1)

    return true
  }
}

function _sine (frequency, offset, amplitude, α, out) {
  const N = out.length
  const dα = TAU * frequency / FS

  for (let i = 0; i < N; i++) {
    out[i] = offset + amplitude * Math.sin(α + i * dα)
  }

  return (α + N * dα) % TAU
}

function _sn (wavetable, frequency, offset, amplitude, α, out, debug) {
  const W = TABLESIZE
  const N = out.length
  const dα = TAU * frequency / FS

  const lookup = (α) => {
    const αʼ = modf(W * α / TAU, W)
    const i = Math.floor(αʼ) % W
    const j = Math.ceil(αʼ) % W
    const f = αʼ % 1

    const floor = wavetable[i]
    const ceil = wavetable[j]

    return (1 - f) * floor + f * ceil
  }

  for (let i = 0; i < N; i++) {
    out[i] = offset + amplitude * lookup(α + i * dα)
  }

  return (α + N * dα) % TAU
}

function modf (α, N) {
  while (α < 0) {
    α += N
  }

  return α % N
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 1000) === 0) {
    console.log(v)
  }

  _log.count++
}

try {
  console.log('... registering LFOs')
  registerProcessor('lfo.1', LFO)
  registerProcessor('lfo.2', LFO)
  registerProcessor('lfo.3', LFO)
  registerProcessor('lfo.4', LFO)
  console.log('... registered LFOs')
} catch (err) {
  console.error(`${err}`)
}
