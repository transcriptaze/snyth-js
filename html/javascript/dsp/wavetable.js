import * as sine from './sine.js'
import * as ellipse from './ellipse.js'
import * as square from './square.js'

const TAU = 2 * Math.PI

export function wavetable ({ m, e, s, θ, h, Φ, 𝜓, δx, δy, shape }, N) {
  const α = new Array(N)
  const dα = TAU / N

  for (let i = 0; i < N; i++) {
    α[i] = i * dα
  }

  switch (shape) {
    case 'ellipse':
      return ellipse.sn𝛢(α, { m, e, s, θ, h, Φ, 𝜓, δx, δy })

    case 'square':
      return square.sn𝛢(α, { m, e, s, θ, h, Φ, 𝜓, δx, δy })

    case 'cowbell':
      return square.sn𝛢(α, { m, e, s, θ, h, Φ, 𝜓, δx, δy })

    default:
      return sine.sn𝛢(α, { m, e, s, θ, h, Φ, 𝜓, δx, δy })
  }
}

export function reduce (rgb) {
  return rgb
    .map((u, i) => { return u.map((v) => v) })
    .reduce((v, y) => (y.map((u, i) => u + v[i])))
}

export function lookupV (sn, α) {
  const N = sn.length
  const αʼ = mod(α * N / TAU, N)
  const i = Math.floor(αʼ) % N
  const j = Math.ceil(αʼ) % N
  const f = αʼ % 1

  const floor = sn[i]
  const ceil = sn[j]

  return (1 - f) * floor + f * ceil
}

export function lookupA (sn, f, fs, α, array) {
  const dα = TAU * f / fs
  for (let i = 0; i < array.length; i++) {
    array[i] = lookupV(sn, α + i * dα)
  }

  return array
}

function mod (α, N) {
  while (α < 0) {
    α += N
  }

  return α % N
}

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 100) === 0) {
    console.log(v)
  }

  _log.count++
}
