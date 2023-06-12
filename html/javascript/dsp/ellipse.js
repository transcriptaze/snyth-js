const PI = Math.PI

// Ref. https://stackoverflow.com/questions/87734/how-do-you-calculate-the-axis-aligned-bounding-box-of-an-ellipse
export function shape𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  const ε = Math.tanh(s * e)
  const a = (ε < 0.0) ? Math.sqrt(1 - ε * ε) : 1
  const b = (ε > 0.0) ? Math.sqrt(1 - ε * ε) : 1
  const φ = phi𝛢(a, b, θ, Φ)
  const cosθ = Math.cos(θ)
  const sinθ = Math.sin(θ)

  const u = Math.atan(-b * Math.tan(θ) / a)
  const v = Math.atan((b / Math.tan(θ)) * a) // cotangent
  const tx = a * Math.cos(u) * cosθ - b * Math.sin(u) * sinθ
  const ty = b * Math.sin(v) * cosθ + a * Math.cos(v) * sinθ
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

export function sn𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  return shape𝛢(α, { m, e, s, θ, h: 1, Φ, 𝜓: 0, δx, δy }).map(({ x, y }) => {
    const r = Math.hypot(x, y)

    return r > 0 ? h * y / r : 0
  })
}

function genfn𝛢 (α, m, φ, 𝜓) {
  return α.map((v) => {
    const αʼ = m * (v + 𝜓) - φ

    return {
      x: Math.cos(αʼ),
      y: Math.sin(αʼ)
    }
  })
}

function phi𝛢 (a, b, θ, Φ) {
  const dθ = Φ - θ
  const PI2 = PI / 2
  let φ = Math.atan(-(a / b) * Math.tan(Φ - θ))

  if (dθ < -PI2) {
    φ += PI
  } else if (dθ > PI2) {
    φ -= PI
  }

  return φ
}
