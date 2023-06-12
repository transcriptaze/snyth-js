const PI = Math.PI
const R = 1
const d = R / Math.sqrt(2)

export function shape𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  const ε = Math.tanh(s * e)
  const a = (ε < 0.0) ? Math.sqrt(1 - ε * ε) : 1
  const b = (ε > 0.0) ? Math.sqrt(1 - ε * ε) : 1
  const φ = phi𝛢(a, b, θ, Φ)
  const cosθ = Math.cos(θ)
  const sinθ = Math.sin(θ)

  const x = a * d
  const y = b * d
  const angle = Math.atan(b / a)
  const r = Math.hypot(x, y)
  const x1 = Math.abs(r * Math.cos(θ + angle))
  const y1 = Math.abs(r * Math.sin(θ + angle))
  const x2 = Math.abs(r * Math.cos(θ - angle))
  const y2 = Math.abs(r * Math.sin(θ - angle))
  const tx = Math.max(x1, x2)
  const ty = Math.max(y1, y2)
  const δxʼ = tx * δx
  const δyʼ = ty * δy

  const pʼ = h * a * cosθ
  const qʼ = h * b * sinθ
  const rʼ = h * δxʼ
  const sʼ = h * a * sinθ
  const tʼ = h * b * cosθ
  const uʼ = h * δyʼ

  const transform = ({ x, y }) => {
    return {
      x: pʼ * x - qʼ * y + rʼ,
      y: sʼ * x + tʼ * y + uʼ
    }
  }

  return genfn𝛢(α, m, φ, 𝜓).map(xy => transform(xy))
}

// NTS: h sets shape size and δx δy scaling but cancels out when calculating sn (because divide by r
//      which is also scaled by h) so need to multiply sn by h to get scaled waveform.
export function path𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  return shape𝛢(α, { m, e, s, θ, h: 1, Φ, 𝜓: 0, δx, δy }).map(({ x, y }) => {
    const r = Math.hypot(x, y)

    return r === 0 ? 0 : h * y / r
  })
}

// NTS: h sets shape size and δx δy scaling but cancels out when calculating sn (because divide by r
//      which is also scaled by h) so need to multiply sn by h to get scaled waveform.
export function sn𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  return shape𝛢(α, { m, e, s, θ, h: 1, Φ, 𝜓: 0, δx, δy }).map(({ x, y }) => {
    const r = Math.hypot(x, y)

    return r === 0 ? 0 : h * y / r
  })
}

export function genfn𝛢 (α, m, φ, 𝜓) {
  return α.map((v) => {
    const αʼ = m * (v + 𝜓) + φ

    return {
      x: clamp(Math.cos(αʼ), -d, +d),
      y: clamp(Math.sin(αʼ), -d, +d)
    }
  })
}

export function phi𝛢 (a, b, θ, Φ) {
  const dθ = θ - Φ

  const f = () => {
    const tr = Math.atan(b / a)
    const tl = -tr + PI
    const br = -tr
    const bl = +tr - PI

    switch (true) {
      case (br <= dθ) && (dθ <= tr):
        return PHI[0]

      case (bl <= dθ) && (dθ < br):
        return PHI[1]

      case (tr < dθ) && (dθ <= tl):
        return PHI[2]

      case (dθ < bl) || (dθ > tl):
        return PHI[3]

      default:
        return PHI[0]
    }
  }

  const lookup = f()

  const x2 = R * Math.cos(-dθ)
  const y2 = R * Math.sin(-dθ)
  const x3 = lookup.x3 * a
  const y3 = lookup.y3 * b
  const x4 = lookup.x4 * a
  const y4 = lookup.y4 * b
  const m = (x3 * y4 - y3 * x4) / (x2 * (y4 - y3) - y2 * (x4 - x3))

  const x = x2 * m / a
  const y = y2 * m / b
  const dx = lookup.dx
  const dy = lookup.dy

  const dr = dx * dx + dy * dy
  const D = x * dy - y * dx
  const 𝚫 = Math.sqrt(R * R * dr - D * D) / dr

  const xʼ = +D * dy + 𝚫 * dx
  const yʼ = -D * dx + 𝚫 * dy
  const φ = Math.atan(yʼ / xʼ)

  return xʼ <= 0 ? φ - lookup.φn : φ - lookup.φp
}

const PHI = [
  { x3: +d, y3: -d, x4: +d, y4: +d, dx: +1, dy: +0, φn: 0, φp: 0 },
  { x3: -d, y3: -d, x4: +d, y4: -d, dx: +0, dy: -1, φn: 0, φp: Math.PI },
  { x3: -d, y3: +d, x4: +d, y4: +d, dx: +0, dy: +1, φn: 0, φp: Math.PI },
  { x3: -d, y3: -d, x4: -d, y4: +d, dx: -1, dy: +0, φn: Math.PI, φp: Math.PI }
]

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}
