import * as ellipse from './ellipse.js'
import * as square from './square.js'
import * as cowbell from './cowbell.js'
import { SN } from './sn.js'

const TAU = 2 * Math.PI

class DDSProcessor extends SN {
  constructor () {
    super('DDS', 18)
  }

  onMessage (event) {
    switch (event.data.message) {
      default:
        super.onMessage(event)
    }
  }

  notefn () {
    const { _version, parameters, envelope } = this.unpack()

    this.envelope = envelope

    return (note, N, ix) => {
      if (ix > this.threshold) {
        return this.genfn0(note, N, parameters)
      } else if (ix > this.threshold / 2) {
        return this.genfn1(note, N, parameters)
      } else {
        return this.genfn(note, N, parameters)
      }
    }
  }

  genfn0 (note, N, params) {
    return {
      snl: new Float32Array(N),
      snr: new Float32Array(N)
    }
  }

  genfn1 (note, N, params) {
    const gen = (α, shape, { m, e, s, θ, h, Φ, 𝜓, δx, δy, balance }) => {
      const paramsʼ = { m, e, s, θ, h, Φ, 𝜓: 0, δx, δy, balance: 0 }

      switch (shape) {
        case 'square':
          return square.ddr(note.frequency, α, paramsʼ)

        case 'ellipse':
          return ellipse.ddr(note.frequency, α, paramsʼ)

        case 'cowbell':
          return cowbell.ddr(note.frequency, α, paramsʼ)

        default:
          return ellipse.ddr(note.frequency, α, paramsʼ)
      }
    }

    const left = new Float32Array(N)
    const right = new Float32Array(N)
    const dα = TAU * note.frequency / this.fs
    const α = new Array(N)

    for (let i = 0; i < N; i++) {
      α[i] = note.alpha + i * dα
    }

    for (const p of params) {
      const audio = gen(α, p.shape, p.parameters)

      audio.snl.forEach((v, ix) => { left[ix] += v })
      audio.snr.forEach((v, ix) => { right[ix] += v })
    }

    return { snl: left, snr: right }
  }

  genfn (note, N, params) {
    const gen = (α, shape, p) => {
      switch (shape) {
        case 'square':
          return square.ddr(note.frequency, α, p)

        case 'ellipse':
          return ellipse.ddr(note.frequency, α, p)

        case 'cowbell':
          return cowbell.ddr(note.frequency, α, p)

        default:
          return ellipse.ddr(note.frequency, α, p)
      }
    }

    const left = new Float32Array(N)
    const right = new Float32Array(N)
    const dα = TAU * note.frequency / this.fs
    const α = new Array(N)

    for (let i = 0; i < N; i++) {
      α[i] = note.alpha + i * dα
    }

    for (const p of params) {
      const audio = gen(α, p.shape, p.parameters)

      audio.snl.forEach((v, ix) => { left[ix] += v })
      audio.snr.forEach((v, ix) => { right[ix] += v })
    }

    return { snl: left, snr: right }
  }
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
  console.log('... registering DDS')
  registerProcessor('dds', DDSProcessor)
  console.log('... registered DDS')
} catch (err) {
  console.error(`${err}`)
}
