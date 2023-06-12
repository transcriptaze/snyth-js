const TAU = 2 * Math.PI
const L = 50 * TAU / 360
const K = 30 * TAU / 360

const BR = 320 * TAU / 360
const TR = 60 * TAU / 360
const TL = 120 * TAU / 360
const BL = 220 * TAU / 360

const br = { x: Math.sin(L), y: -Math.cos(L) }
const tr = { x: Math.sin(K), y: Math.cos(K) }
const tl = { x: -Math.sin(K), y: Math.cos(K) }
const bl = { x: -Math.sin(L), y: -Math.cos(L) }

function _degrees (v) {
  return Math.round(v * 360 / TAU)
}

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
  const f1 = (x4, y4) => {
    const x1 = br.x
    const y1 = br.y
    const x2 = tr.x
    const y2 = tr.y
    const x3 = 0
    const y3 = y4

    const a11 = x1 * y2 - x2 * y1
    const a12 = x1 - x2
    const a21 = x3 * y4 - x4 * y3
    const a22 = x3 - x4

    const b11 = y2 - y1
    const b12 = x1 - x2
    const b21 = y4 - y3
    const b22 = x3 - x4

    const c11 = y2 - y1
    const c12 = x1 * y2 - x2 * y1
    const c21 = y4 - y3
    const c22 = x3 * y4 - x4 * y3

    const detA = a11 * a22 - a12 * a21
    const detB = b11 * b22 - b12 * b21
    const detC = c11 * c22 - c12 * c21

    const x = detA / detB
    const y = detC / detB

    return {
      x,
      y
    }
  }

  const f2 = (x4, y4) => {
    const x1 = tr.x
    const y1 = tr.y
    const x2 = tl.x
    const y2 = tl.y
    const x3 = x4
    const y3 = 0

    const a11 = x1 * y2 - x2 * y1
    const a12 = x1 - x2
    const a21 = x3 * y4 - x4 * y3
    const a22 = x3 - x4

    const b11 = y2 - y1
    const b12 = x1 - x2
    const b21 = y4 - y3
    const b22 = x3 - x4

    const c11 = y2 - y1
    const c12 = x1 * y2 - x2 * y1
    const c21 = y4 - y3
    const c22 = x3 * y4 - x4 * y3

    const detA = a11 * a22 - a12 * a21
    const detB = b11 * b22 - b12 * b21
    const detC = c11 * c22 - c12 * c21

    const x = detA / detB
    const y = detC / detB

    return {
      x,
      y
    }
  }

  const f3 = (x4, y4) => {
    const x1 = tl.x
    const y1 = tl.y
    const x2 = bl.x
    const y2 = bl.y
    const x3 = 0
    const y3 = y4

    const a11 = x1 * y2 - x2 * y1
    const a12 = x1 - x2
    const a21 = x3 * y4 - x4 * y3
    const a22 = x3 - x4

    const b11 = y2 - y1
    const b12 = x1 - x2
    const b21 = y4 - y3
    const b22 = x3 - x4

    const c11 = y2 - y1
    const c12 = x1 * y2 - x2 * y1
    const c21 = y4 - y3
    const c22 = x3 * y4 - x4 * y3

    const detA = a11 * a22 - a12 * a21
    const detB = b11 * b22 - b12 * b21
    const detC = c11 * c22 - c12 * c21

    const x = detA / detB
    const y = detC / detB

    return {
      x,
      y
    }
  }

  const f4 = (x4, y4) => {
    const x1 = bl.x
    const y1 = bl.y
    const x2 = br.x
    const y2 = br.y
    const x3 = x4
    const y3 = 0

    const a11 = x1 * y2 - x2 * y1
    const a12 = x1 - x2
    const a21 = x3 * y4 - x4 * y3
    const a22 = x3 - x4

    const b11 = y2 - y1
    const b12 = x1 - x2
    const b21 = y4 - y3
    const b22 = x3 - x4

    const c11 = y2 - y1
    const c12 = x1 * y2 - x2 * y1
    const c21 = y4 - y3
    const c22 = x3 * y4 - x4 * y3

    const detA = a11 * a22 - a12 * a21
    const detB = b11 * b22 - b12 * b21
    const detC = c11 * c22 - c12 * c21

    const x = detA / detB
    const y = detC / detB

    return {
      x,
      y
    }
  }

  // totally wrong but sounds amazing!!
  // const αʼ = (m*v + TAU) % TAU
  return α.map((v) => {
    const αʼ = (m * v + TAU) % TAU
    const x = Math.cos(m * αʼ)
    const y = Math.sin(m * αʼ)

    if (αʼ >= BR || αʼ <= TR) {
      return f1(x, y)
    } else if (αʼ <= TL) {
      return f2(x, y)
    } else if (αʼ <= BL) {
      return f3(x, y)
    } else {
      return f4(x, y)
    }
  })
}

function phi𝛢 (a, b, θ, Φ) {
  return 0
}
