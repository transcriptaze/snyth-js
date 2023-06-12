import {
  VOLUME, GAIN, ATTACK, DECAY, SUSTAIN, RELEASE,
  Rε, R𝗌, Rθ, Ra, Rδx, Rδy, RΦ, R𝜓, Rb,
  Gε, G𝗌, Gθ, Ga, Gδx, Gδy, GΦ, G𝜓, Gb,
  Bε, B𝗌, Bθ, Ba, Bδx, Bδy, BΦ, B𝜓, Bb
} from '../schema.js'

export const PLUGS = new Map([
  [`${VOLUME}`, 'volume'],
  [`${GAIN}`, 'gain'],
  [`${ATTACK}`, 'attack'],
  [`${DECAY}`, 'decay'],
  [`${SUSTAIN}`, 'sustain'],
  [`${RELEASE}`, 'release'],
  [Rε, 'R.ε'], [R𝗌, 'R.𝗌'], [Rθ, 'R.θ'], [Ra, 'R.a'], [Rδx, 'R.δx'], [Rδy, 'R.δy'], [RΦ, 'R.Φ'], [R𝜓, 'R.𝜓'], [Rb, 'R.b'],
  [Gε, 'G.ε'], [G𝗌, 'G.𝗌'], [Gθ, 'G.θ'], [Ga, 'G.a'], [Gδx, 'G.δx'], [Gδy, 'G.δy'], [GΦ, 'G.Φ'], [G𝜓, 'G.𝜓'], [Gb, 'G.b'],
  [Bε, 'B.ε'], [`${B𝗌}`, 'B.𝗌'], [`${Bθ}`, 'B.θ'], [Ba, 'B.a'], [Bδx, 'B.δx'], [Bδy, 'B.δy'], [BΦ, 'B.Φ'], [B𝜓, 'B.𝜓'], [Bb, 'B.b']
])

export const OFFSETS = {
  volume: 0,
  gain: 1,
  attack: 2,
  decay: 3,
  sustain: 4,
  release: 5,
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

export function lookup (plug) {
  const plugs = [...PLUGS]

  const u = plugs.find(([k, v]) => v === plug)
  if (u != null) {
    return u[0]
  }

  const v = plugs.find(([k, v]) => k === plug)
  if (v != null) {
    return v[1]
  }

  return ''
}
