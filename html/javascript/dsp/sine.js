export function shape𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  return α.map((αʼ) => {
    return {
      x: h * Math.cos(m * αʼ),
      y: h * Math.sin(m * αʼ)
    }
  })
}

export function path𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  return α.map((αʼ) => {
    return h * Math.sin(m * αʼ)
  })
}

export function sn𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  return α.map((αʼ) => {
    return h * Math.sin(m * αʼ + 𝜓)
  })
}
