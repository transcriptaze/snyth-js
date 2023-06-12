import { SN } from './sn.js'
import { hrtf } from '../dsp/dsp.js'

const PI = Math.PI
const TAU = 2 * Math.PI

const PAGES = 2
const ENTRIES = 720
const TABLESIZE = ENTRIES * Float32Array.BYTES_PER_ELEMENT
const PAGESIZE = 6 * TABLESIZE
const BUFFERSIZE = PAGES * PAGESIZE

const PAGE0 = 0
const PAGE1 = PAGESIZE
const RED = 0 * TABLESIZE
const REDl = RED
const REDr = RED + TABLESIZE
const GREEN = 2 * TABLESIZE
const GREENl = GREEN
const GREENr = GREEN + TABLESIZE
const BLUE = 4 * TABLESIZE
const BLUEl = BLUE
const BLUEr = BLUE + TABLESIZE

const R𝜓 = 13
const G𝜓 = 21
const B𝜓 = 29

// let _max = 0

class WavetableProcessor extends SN {
  constructor () {
    super('wavetable', 25)

    this.sab.wavetable = new SharedArrayBuffer(PAGES * BUFFERSIZE)

    this.wavetable = {
      version: 0,
      Δ: [0, 0, 0],
      sn: [
        {
          RL: new Float32Array(this.sab.wavetable, PAGE0 + REDl, ENTRIES),
          RR: new Float32Array(this.sab.wavetable, PAGE0 + REDr, ENTRIES),
          GL: new Float32Array(this.sab.wavetable, PAGE0 + GREENl, ENTRIES),
          GR: new Float32Array(this.sab.wavetable, PAGE0 + GREENr, ENTRIES),
          BL: new Float32Array(this.sab.wavetable, PAGE0 + BLUEl, ENTRIES),
          BR: new Float32Array(this.sab.wavetable, PAGE0 + BLUEr, ENTRIES)
        },
        {
          RL: new Float32Array(this.sab.wavetable, PAGE1 + REDl, ENTRIES),
          RR: new Float32Array(this.sab.wavetable, PAGE1 + REDr, ENTRIES),
          GL: new Float32Array(this.sab.wavetable, PAGE1 + GREENl, ENTRIES),
          GR: new Float32Array(this.sab.wavetable, PAGE1 + GREENr, ENTRIES),
          BL: new Float32Array(this.sab.wavetable, PAGE1 + BLUEl, ENTRIES),
          BR: new Float32Array(this.sab.wavetable, PAGE1 + BLUEr, ENTRIES)
        }
      ]
    }

    const dα = TAU / ENTRIES
    for (let page = 0; page < PAGES; page++) {
      for (let i = 0; i < ENTRIES; i++) {
        this.wavetable.sn[page].RL[i] = 0 * 0.7 * Math.sin(i * dα)
        this.wavetable.sn[page].RR[i] = 0 * 0.7 * Math.sin(i * dα)
        this.wavetable.sn[page].GL[i] = 0 * 0.5 * Math.sin(2 * i * dα)
        this.wavetable.sn[page].GR[i] = 0 * 0.5 * Math.sin(2 * i * dα)
        this.wavetable.sn[page].BL[i] = 0 * 0.3 * Math.sin(4 * i * dα)
        this.wavetable.sn[page].BR[i] = 0 * 0.3 * Math.sin(4 * i * dα)
      }
    }

    this.port.postMessage({
      message: 'wavetable',
      sab: this.sab.wavetable,
      N: ENTRIES,
      pages: PAGES,
      version: this.wavetable.version
    })
  }

  onMessage (event) {
    switch (event.data.message) {
      case 'load':
        this.onLoad(event)
        break

      default:
        super.onMessage(event)
    }
  }

  onLoad (event) {
    this.wavetable.version = event.data.version
    this.wavetable.Δ = event.data.parameters.map(p => p.𝜓 * PI / 180)
    this.envelope = event.data.envelope
  }

  notefn () {
    return (note, N, ix) => {
      if (ix > this.threshold) {
        return this.genfn0(note, N)
      } else {
        return this.genfn(note, N)
      }
    }
  }

  genfn0 (note, N, params) {
    return {
      snl: new Float32Array(N),
      snr: new Float32Array(N)
    }
  }

  // unpacked loops: Chrome Performance tools say it is about 50% worse than the map/reduce version
  genfn (note, N) {
    const left = new Float32Array(N)
    const right = new Float32Array(N)
    const W = ENTRIES
    const dα = TAU * note.frequency / this.fs

    const lookup = (α, w) => {
      const αʼ = mod(α * W / TAU, note.frequency, W)
      const i = Math.floor(αʼ) % W
      const j = Math.ceil(αʼ) % W
      const f = αʼ % 1

      const floor = w[i]
      const ceil = w[j]

      return (1 - f) * floor + f * ceil
    }

    const page = this.wavetable.version % PAGES

    const tableL = [
      this.wavetable.sn[page].RL,
      this.wavetable.sn[page].GL,
      this.wavetable.sn[page].BL
    ]

    const tableR = [
      this.wavetable.sn[page].RR,
      this.wavetable.sn[page].GR,
      this.wavetable.sn[page].BR
    ]

    const α = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      α[i] = note.alpha + i * dα
    }

    const Δ = [
      hrtf(this.wavetable.Δ[0] * this.patchbay[R𝜓]),
      hrtf(this.wavetable.Δ[1] * this.patchbay[G𝜓]),
      hrtf(this.wavetable.Δ[2] * this.patchbay[B𝜓])
    ]

    const Δl = Δ.map((δ) => note.frequency * δ.𝜓l)
    const Δr = Δ.map((δ) => note.frequency * δ.𝜓r)

    for (const [k, t] of tableL.entries()) {
      for (let i = 0; i < N; i++) {
        left[i] += lookup(α[i] + Δl[k], t)
      }
    }

    for (const [k, t] of tableR.entries()) {
      for (let i = 0; i < N; i++) {
        right[i] += lookup(α[i] + Δr[k], t)
      }
    }

    return { snl: left, snr: right }
  }
}

function mod (α, ϝ, N) {
  while (α < 0) {
    α += N
  }

  return α % N
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
  console.log('... registering wavetable')
  registerProcessor('wavetable', WavetableProcessor)
  console.log('... registered wavetable')
} catch (err) {
  console.error(`${err}`)
}
