import { shape𝛢 } from '../dsp/square.js'
import { hrtf } from '../dsp/dsp.js'

// NTS: expects everything in radians
export function ddr (f, α, { m, e, s, θ, h, Φ, 𝜓, δx, δy, balance }) {
  if (𝜓 === 0 && balance === 0) {
    const _sn = sn(α, m, e, s, θ, h, Φ, 0, δx, δy, 0.5)

    return {
      snl: _sn,
      snr: _sn
    }
  } else {
    const ll = (1 - balance) / 2
    const lr = (1 + balance) / 2
    const { 𝜓l, 𝜓r } = hrtf(𝜓)

    return {
      snl: sn(α, m, e, s, θ, h, Φ, f * 𝜓l, δx, δy, ll),
      snr: sn(α, m, e, s, θ, h, Φ, f * 𝜓r, δx, δy, lr)
    }
  }
}

function sn (α, m, e, s, θ, h, Φ, 𝜓, δx, δy, l) {
  return shape𝛢(α, { m, e, s, θ, h, Φ, 𝜓, δx, δy })
    .map(({ x, y }) => {
      const r = Math.hypot(x, y)
      const sn = r > 0 ? l * h * y / r : 0

      return sn
    })
}
