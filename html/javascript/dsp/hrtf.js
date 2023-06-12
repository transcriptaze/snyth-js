const TAU = 2 * Math.PI
const 𝑉 = 343 // speed of sound (m/s)
const Γ = 0.15 // distance to source (m)
const γ = 0.15 // left/right seperation (m)
const R = Math.hypot(Γ, γ / 2)

// Calculates the left/right phase shift for an off-axis source at 1Hz
// Expects 𝜓 in radians.
export function hrtf (𝜓) {
  const x = Γ * Math.cos(𝜓)
  const y = Γ * Math.sin(𝜓)
  const f = 1
  const λ = 𝑉 / f
  const δ = (xʼ, yʼ) => (R - Math.hypot(xʼ, yʼ))

  const δl = δ(x, y - (γ / 2))
  const δr = δ(x, y + (γ / 2))

  return {
    𝜓l: TAU * δl / λ,
    𝜓r: TAU * δr / λ
  }
}
