import * as sine from './sine.js'
import * as ellipse from './ellipse.js'
import * as square from './square.js'
import * as cowbell from './cowbell.js'
import * as fft from './fft.js'

export { wavetable } from './wavetable.js'
export { hrtf } from './hrtf.js'

const TAU = 2 * Math.PI
const 𝛢360 = [...new Array(360)].map((α, i) => i * TAU / 360)
const 𝛢512 = [...new Array(512)].map((α, i) => i * TAU / 512)
const 𝛢720 = [...new Array(720)].map((α, i) => i * TAU / 720)

export function shapes (parameters) {
  const remap = (p) => {
    return { m: p.m, e: p.e, s: p.s, θ: radians(p.θ), h: p.h, Φ: radians(p.Φ), 𝜓: 0, δx: p.δx, δy: p.δy }
  }

  const reduce = (u, v) => {
    return {
      x: u.x + v.x,
      y: u.y + v.y
    }
  }

  const shape = (p) => {
    switch (p.shape) {
      case 'ellipse':
        return ellipse.shape𝛢(𝛢360, remap(p))

      case 'square':
        return square.shape𝛢(𝛢360, remap(p))

      case 'cowbell':
        return cowbell.shape𝛢(𝛢360, remap(p))

      default:
        return sine.shape𝛢(𝛢360, remap(p))
    }
  }

  const rgb = parameters.map((p) => shape(p))
  const y = rgb.reduce((a, v) => a.map((u, i) => reduce(u, v[i])))

  return [...rgb, y]
}

export function paths (parameters) {
  const remap = (p) => {
    return { m: p.m, e: p.e, s: p.s, θ: radians(p.θ), h: p.h, Φ: radians(p.Φ), 𝜓: 0, δx: p.δx, δy: p.δy }
  }

  const reduce = (u, v) => {
    return u + v
  }

  const path = (p) => {
    switch (p.shape) {
      case 'ellipse':
        return ellipse.path𝛢(𝛢720, remap(p))

      case 'square':
        return square.path𝛢(𝛢720, remap(p))

      case 'cowbell':
        return cowbell.path𝛢(𝛢720, remap(p))

      default:
        return sine.path𝛢(𝛢720, remap(p))
    }
  }

  const rgb = parameters.map((p) => path(p))
  const y = rgb.reduce((a, v) => a.map((u, i) => reduce(u, v[i])))

  return [...rgb, y]
}

export function sn (parameters, N) {
  const remap = (p) => {
    return { m: p.m, e: p.e, s: p.s, θ: radians(p.θ), h: p.h, Φ: radians(p.Φ), 𝜓: 0, δx: p.δx, δy: p.δy }
  }

  const reduce = (u, v) => {
    return u + v
  }

  const sn = (α, p) => {
    switch (p.shape) {
      case 'ellipse':
        return ellipse.sn𝛢(α, remap(p))

      case 'square':
        return square.sn𝛢(α, remap(p))

      case 'cowbell':
        return cowbell.sn𝛢(α, remap(p))

      default:
        return sine.sn𝛢(α, remap(p))
    }
  }

  const α = N === 512 ? 𝛢512 : [...new Array(N)].map((α, i) => i * TAU / N)

  return parameters
    .map((p) => sn(α, p))
    .reduce((a, v) => a.map((u, i) => reduce(u, v[i])))
}

// NTS:
// 1. 4096 point FFT
// 2. 256 point waveform
// 3. fs = 256 samples/s
// 4. resolution = fs/N = 0.0625Hz
// 5. So .. 1st peak @32 => 32*0.03125 = 1Hz
// 6.       2nd peak @64 => 64*0.0625 = 2Hz
// 7.       3rd peak @128 => 128*0.0625 = 4Hz
// 8. Scaling up to fs = 44100 samples/s => resolution = 10.766 Hz
// 9. Nothing interesting is happening outside of the harmonics anyway
//    i.e. no particular reason for a high resolution FFT
export function dft (parameters) {
  const w = sn(parameters, 256)
  const N = 4096
  const D = N / 2
  let R = new Array(0)
  const I = new Array(N).fill(0)

  while (R.length < N) {
    R = R.concat(w)
  }

  fft.transform(R, I)

  return R.slice(0, D).map((v, i) => Math.hypot(v, I[i]) / D)
}

function radians (v) {
  return Math.PI * v / 180
}
