import * as dsp from '../dsp/dsp.js'
import { Parameters } from '../synth/parameters.js'
import { snNode } from './sn.js'

const MAX_VERSION = 1048575

// .. patchbay offsets
const OFFSETS = {
  ε: [6, 15, 24],
  𝗌: [7, 16, 25],
  θ: [8, 17, 26],
  a: [9, 18, 27],
  δx: [10, 19, 28],
  δy: [11, 20, 29],
  Φ: [12, 21, 30],
  𝜓: [13, 22, 31],
  b: [14, 23, 32]
}

const radians = function (v) {
  return Math.PI * v / 180
}

export class WavetableNode extends snNode {
  constructor (context) {
    super(context, 'wavetable')

    this.internal = {
      parameters: [
        new Parameters({ m: 1, e: 0.75, s: 10, θ: 30, h: 0.5, δx: 0.0, δy: 0.0, Φ: 0.0, 𝜓: 0.0, balance: 0.0, shape: 'ellipse' }),
        new Parameters({ m: 2, e: 0.00, s: 10, θ: 0, h: 0.3, δx: 0.0, δy: 0.0, Φ: 0.0, 𝜓: 0.0, balance: 0.0, shape: 'ellipse' }),
        new Parameters({ m: 4, e: 0.00, s: 10, θ: 0, h: 0.2, δx: 0.0, δy: 0.0, Φ: 0.0, 𝜓: 0.0, balance: 0.0, shape: 'ellipse' })
      ],
      envelope: {
        type: 'AR',
        attack: 0.05,
        decay: 0,
        sustain: 1,
        release: 0.1
      }
    }

    this.shared = {
      N: 0,
      wavetable: [],
      version: 0
    }
  }

  onMessage (event) {
    if (event.data.message === 'wavetable') {
      const sab = event.data.sab
      const N = event.data.N
      const pages = event.data.pages
      const pagesize = N * Float32Array.BYTES_PER_ELEMENT
      const wavetable = []

      for (let page = 0; page < pages; page++) {
        const offset = page * 6 * pagesize

        const rl = 0 * N * Float32Array.BYTES_PER_ELEMENT
        const rr = 1 * N * Float32Array.BYTES_PER_ELEMENT
        const gl = 2 * N * Float32Array.BYTES_PER_ELEMENT
        const gr = 3 * N * Float32Array.BYTES_PER_ELEMENT
        const bl = 4 * N * Float32Array.BYTES_PER_ELEMENT
        const br = 5 * N * Float32Array.BYTES_PER_ELEMENT

        wavetable.push(
          {
            RL: new Float32Array(sab, offset + rl, N),
            RR: new Float32Array(sab, offset + rr, N),
            GL: new Float32Array(sab, offset + gl, N),
            GR: new Float32Array(sab, offset + gr, N),
            BL: new Float32Array(sab, offset + bl, N),
            BR: new Float32Array(sab, offset + br, N)
          })
      }

      this.shared.N = N
      this.shared.wavetable = wavetable
      this.shared.version = event.data.version
    }

    super.onMessage(event)
  }

  set (parameters, envelope) {
    this.internal.parameters = parameters
    this.internal.envelope = envelope.clone()

    this.regenerate()
  }

  regenerate () {
    return new Promise(() => {
      const _t0 = performance.now()

      const N = this.shared.N
      const pages = this.shared.wavetable.length
      const parameters = this.internal.parameters
      const patchbay = this.patchbay

      if (pages > 0) {
        const page = (this.shared.version + 1) % pages
        const wavetable = this.shared.wavetable[page]

        const [r, g, b] = regenerate(parameters, patchbay, N)

        wavetable.RL.set(r.snl)
        wavetable.RR.set(r.snr)
        wavetable.GL.set(g.snl)
        wavetable.GR.set(g.snr)
        wavetable.BL.set(b.snl)
        wavetable.BR.set(b.snr)

        this.shared.version = (this.shared.version + 1) % MAX_VERSION

        this.port.postMessage({
          message: 'load',
          timestamp: this.context.currentTime,
          version: this.shared.version,
          parameters: this.internal.parameters,
          envelope: this.internal.envelope
        })
      }

      const _t1 = performance.now()

      // _log(_t1 - _t0)
    })
  }
}

function regenerate (params, patchbay, N) {
  const parameters = params.map((p, ix) => {
    return {
      m: p.m,
      e: p.e * patchbay[OFFSETS.ε[ix]],
      s: p.s * patchbay[OFFSETS.𝗌[ix]],
      θ: radians(p.θ * patchbay[OFFSETS.θ[ix]]),
      h: p.h * patchbay[OFFSETS.a[ix]],
      δx: p.δx * patchbay[OFFSETS.δx[ix]],
      δy: p.δy * patchbay[OFFSETS.δy[ix]],
      Φ: radians(p.Φ) * patchbay[OFFSETS.Φ[ix]],
      𝜓: p.𝜓 * patchbay[OFFSETS.𝜓[ix]],
      balance: p.balance * patchbay[OFFSETS.b[ix]],
      shape: p.shape
    }
  })

  // _log(parameters[1].e)

  // NTS: can't fold ll/lr into h because the transform scales δx and δy by h
  const sn = parameters
    .map(({ m, e, s, θ, h, δx, δy, Φ, 𝜓, balance, shape }) => {
      const ll = (1 - balance) / 2
      const lr = (1 + balance) / 2

      return {
        left: { m, e, s, θ, h, Φ, 𝜓: 0, δx, δy, shape },
        right: { m, e, s, θ, h, Φ, 𝜓: 0, δx, δy, shape },
        balance: { ll, lr }
      }
    })
    .map(({ left, right, balance }) => {
      return {
        snl: dsp.wavetable(left, N).map((v) => balance.ll * v),
        snr: dsp.wavetable(right, N).map((v) => balance.lr * v)
      }
    })

  return sn
}

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 120) === 0) {
    console.log(v)
  }

  _log.count++
}
