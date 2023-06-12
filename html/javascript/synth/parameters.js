const PI = Math.PI
const radians = function (v) { return v * PI / 180 }

export class Parameters {
  constructor ({ m = 1, e = 0, s = 10, θ = 0, h = 1, Φ = 0, balance = 0, 𝜓 = 0, δx = 0, δy = 0, shape = 'ellipse' } = {}) {
    this.m = m // multiplier
    this.e = e // eccentricity
    this.s = s // sensitivity
    this.θ = θ // rotation (degrees)
    this.h = h // amplitude
    this.Φ = Φ // initial phase (degrees)
    this.balance = balance // left/right balance
    this.𝜓 = 𝜓 // angle to source
    this.δx = δx // x-translation
    this.δy = δy // y-translation
    this.shape = shape // generator geometry

    this.array = new Float64Array([
      m,
      e,
      s,
      radians(θ),
      h,
      δx,
      δy,
      radians(Φ),
      radians(𝜓),
      balance,
      shape
    ])
  }

  asObject () {
    return {
      m: this.m,
      e: this.e,
      s: this.s,
      θ: this.θ,
      h: this.h,
      δx: this.δx,
      δy: this.δy,
      Φ: this.Φ,
      𝜓: this.𝜓,
      balance: this.balance,
      shape: this.shape
    }
  }
}

// SharedArrayBuffer pack/unpack
const HARMONICS = 3
const OFFSET = 0
const NPARAM = 11

const M = 0
const E = 1
const S = 2
const THETA = 3
const H = 4
const SHIFTX = 5
const SHIFTY = 6
const PHASE = 7
const PSI = 8
const BALANCE = 9
const SHAPE = 10

export const ELLIPSE = 0
export const SQUARE = 1
export const COWBELL = 1

// NTS: packs parameters as radians
export function pack (parameters, array) {
  for (const [i, p] of parameters.entries()) {
    const ix = OFFSET + i * NPARAM

    array[ix + M] = p.m
    array[ix + E] = p.e
    array[ix + S] = p.s
    array[ix + THETA] = radians(p.θ)
    array[ix + H] = p.h
    array[ix + PHASE] = radians(p.Φ)
    array[ix + BALANCE] = p.balance
    array[ix + PSI] = radians(p.𝜓)
    array[ix + SHIFTX] = p.δx
    array[ix + SHIFTY] = p.δy
    array[ix + SHAPE] = shape2int(p.shape)
  }
}

// NTS: unpacks parameters as radians
export function unpack (array) {
  const params = []

  for (let i = 0; i < HARMONICS; i++) {
    const ix = OFFSET + i * NPARAM

    const p = {
      shape: int2shape(array[ix + SHAPE]),
      parameters: {
        m: array[ix + M],
        e: array[ix + E],
        s: array[ix + S],
        θ: array[ix + THETA],
        h: array[ix + H],
        Φ: array[ix + PHASE],
        𝜓: array[ix + PSI],
        δx: array[ix + SHIFTX],
        δy: array[ix + SHIFTY],
        balance: array[ix + BALANCE]
      }
    }

    params.push(p)
  }

  return params
}

function shape2int (shape) {
  switch (shape) {
    case 'ellipse':
      return ELLIPSE

    case 'square':
      return SQUARE

    case 'cowbell':
      return COWBELL

    default:
      return ELLIPSE
  }
}

function int2shape (shape) {
  switch (shape) {
    case ELLIPSE:
      return 'ellipse'

    case SQUARE:
      return 'square'

    case COWBELL:
      return 'cowbell'

    default:
      return 'ellipse'
  }
}
