import * as parameters from './parameters.js'
import * as envelopes from './envelopes.js'

/* eslint-disable no-multi-spaces */
export const DEFAULT_PARAMETERS = [
  new parameters.Parameters({ m: 1, e: 0.75, s: 10, θ: 30, h: 0.5, δx: 0.0, δy: 0.0, Φ: 0.0, 𝜓: 0.0, balance: 0.0, shape: 'ellipse' }),
  new parameters.Parameters({ m: 2, e: 0.00, s: 10, θ: 0,  h: 0.3, δx: 0.0, δy: 0.0, Φ: 0.0, 𝜓: 0.0, balance: 0.0, shape: 'ellipse' }),
  new parameters.Parameters({ m: 4, e: 0.0,  s: 10, θ: 0,  h: 0.2, δx: 0.0, δy: 0.0, Φ: 0.0, 𝜓: 0.0, balance: 0.0, shape: 'ellipse' })
]
/* eslint-enable no-multi-spaces */

export const DEFAULT_ENVELOPE = envelopes.DEFAULT
const VALUES = 64
const PAGE_SIZE = VALUES * Float64Array.BYTES_PER_ELEMENT

// NOTES
// 1. https://bugzilla.mozilla.org/show_bug.cgi?id=1246597 says because DataView is apparently quite slow.
// 2. Apparently fixed in V8 at least https://v8.dev/blog/dataview
// 3. Parameters are in radians
export function pack (version, params, envelope, sab, page) {
  const array = new Float64Array(sab, page * PAGE_SIZE, VALUES)

  parameters.pack(params, array)
  envelopes.pack(envelope, array)
}

// SharedArrayBuffer layout
//
// |----|-----------------------|
// | 0  | red   multiplier      |
// | 1  |       eccentricity    |
// | 2  |       sensitivity     |
// | 3  |       theta           |
// | 4  |       h               |
// | 5  |       phase           |
// | 6  |       balance         |
// | 7  |       psi             |
// | 8  |       dx              |
// | 9  |       dy              |
// | 10 |       shape           |
// | 11 | green multiplier      |
// | 12 |       eccentricity    |
// | 13 |       sensitivity     |
// | 14 |       theta           |
// | 15 |       h               |
// | 16 |       phase           |
// | 17 |       balance         |
// | 18 |       psi             |
// | 19 |       dx              |
// | 20 |       dy              |
// | 21 |       shape           |
// | 22 | blue  multiplier      |
// | 23 |       eccentricity    |
// | 24 |       sensitivity     |
// | 25 |       theta           |
// | 26 |       h               |
// | 27 |       phase           |
// | 28 |       balance         |
// | 29 |       psi             |
// | 30 |       dx              |
// | 31 |       dy              |
// | 32 |       shape           |
// | .. | ...                   |
// | 48 | envelope type         |
// | 49 |          attack       |
// | 50 |          decay        |
// | 51 |          sustain      |
// | 52 |          release      |
// | .. | ...                   |
// | 63 | ...                   |
// |----|-----------------------|
