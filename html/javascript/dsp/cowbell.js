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
  return v * 360 / TAU
}

export function shape𝛢 (α, { m, e, s, θ, h, Φ, 𝜓, δx, δy }) {
  const ε = Math.tanh(s * e)
  const a = (ε < 0.0) ? Math.sqrt(1 - ε * ε) : 1
  const b = (ε > 0.0) ? Math.sqrt(1 - ε * ε) : 1
  const φ = phi(a, b, θ, Φ)
  const cosθ = Math.cos(θ)
  const sinθ = Math.sin(θ)

  const box = boundingBox(a, b, θ)
  const tx = Math.abs(δx < 0 ? box.right : box.left)
  const ty = Math.abs(δy < 0 ? box.top : box.bottom)
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

export function boundingBox (a, b, θ) {
  return axisIntercepts(a, b, θ)
}

function genfn𝛢 (α, m, φ, 𝜓) {
  const g = (xy1, xy2, xy3, xy4) => {
    const a11 = xy1.x * xy2.y - xy2.x * xy1.y
    const a12 = xy1.x - xy2.x
    const a21 = xy3.x * xy4.y - xy4.x * xy3.y
    const a22 = xy3.x - xy4.x

    const b11 = xy2.y - xy1.y
    const b12 = xy1.x - xy2.x
    const b21 = xy4.y - xy3.y
    const b22 = xy3.x - xy4.x

    const c11 = xy2.y - xy1.y
    const c12 = xy1.x * xy2.y - xy2.x * xy1.y
    const c21 = xy4.y - xy3.y
    const c22 = xy3.x * xy4.y - xy4.x * xy3.y

    const detA = a11 * a22 - a12 * a21
    const detB = b11 * b22 - b12 * b21
    const detC = c11 * c22 - c12 * c21

    const x = detA / detB
    const y = detC / detB

    return { x, y }
  }

  const f1 = (x, y) => {
    return g(br, tr, { x: 0, y }, { x, y })
  }

  const f2 = (x, y) => {
    return g(tr, tl, { x, y: 0 }, { x, y })
  }

  const f3 = (x, y) => {
    return g(tl, bl, { x: 0, y }, { x, y })
  }

  const f4 = (x, y) => {
    return g(bl, br, { x, y: 0 }, { x, y })
  }

  return α.map((v) => {
    const αʼ = (m * (v + 𝜓) + φ + TAU) % TAU
    const x = Math.cos(αʼ)
    const y = Math.sin(αʼ)

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

export function phi (a, b, θ, Φ) {
  const f = function ({ x, y }) {
    return { x: a * x, y: b * y }
  }

  const brʼ = f(br)
  const trʼ = f(tr)
  const tlʼ = f(tl)
  const blʼ = f(bl)

  const BRʼ = (Math.atan2(brʼ.y, brʼ.x) + TAU) % TAU
  const TRʼ = (Math.atan2(trʼ.y, trʼ.x) + TAU) % TAU
  const TLʼ = (Math.atan2(tlʼ.y, tlʼ.x) + TAU) % TAU
  const BLʼ = (Math.atan2(blʼ.y, blʼ.x) + TAU) % TAU

  const g = (xy1, xy2, xy4) => {
    const a11 = xy1.x * xy2.y - xy2.x * xy1.y
    const a22 = -xy4.x

    const b11 = xy2.y - xy1.y
    const b12 = xy1.x - xy2.x
    const b21 = xy4.y
    const b22 = -xy4.x

    const c12 = xy1.x * xy2.y - xy2.x * xy1.y
    const c21 = xy4.y

    const detA = a11 * a22
    const detB = b11 * b22 - b12 * b21
    const detC = -c12 * c21

    const x = detA / detB
    const y = detC / detB

    return { x, y }
  }

  const f1 = (x, y) => {
    return g(brʼ, trʼ, { x, y })
  }

  const f2 = (x, y) => {
    return g(trʼ, tlʼ, { x, y })
  }

  const f3 = (x, y) => {
    return g(tlʼ, blʼ, { x, y })
  }

  const f4 = (x, y) => {
    return g(blʼ, brʼ, { x, y })
  }

  const θʼ = (Φ - θ + TAU) % TAU
  const x = Math.cos(θʼ)
  const y = Math.sin(θʼ)

  if (θʼ >= BRʼ || θʼ <= TRʼ) {
    return Math.asin(f1(x, y).y / b)
  }

  if (θʼ > TRʼ && θʼ <= TLʼ) {
    return Math.acos(f2(x, y).x / a)
  }

  if (θʼ > TLʼ && θʼ <= BLʼ) {
    return Math.PI - Math.asin(f3(x, y).y / b)
  }

  if (θʼ > BLʼ) {
    return -Math.acos(f4(x, y).x / a)
  }

  return 0
}

function axisIntercepts (a, b, θ) {
  const cosθ = Math.cos(θ)
  const sinθ = Math.sin(θ)

  const f = function ({ x, y }) {
    return {
      x: a * (x * cosθ - y * sinθ),
      y: b * (x * sinθ + y * cosθ)
    }
  }

  const brʼ = f(br)
  const trʼ = f(tr)
  const tlʼ = f(tl)
  const blʼ = f(bl)

  const g = (xy1, xy2, xy4) => {
    const a11 = xy1.x * xy2.y - xy2.x * xy1.y
    const a22 = -xy4.x

    const b11 = xy2.y - xy1.y
    const b12 = xy1.x - xy2.x
    const b21 = xy4.y
    const b22 = -xy4.x

    const c12 = xy1.x * xy2.y - xy2.x * xy1.y
    const c21 = xy4.y

    const detA = a11 * a22
    const detB = b11 * b22 - b12 * b21
    const detC = -c12 * c21

    const x = detA / detB
    const y = detC / detB

    return { x, y }
  }

  const f1 = (x, y) => {
    return g(brʼ, trʼ, { x, y })
  }

  const f2 = (x, y) => {
    return g(trʼ, tlʼ, { x, y })
  }

  const f3 = (x, y) => {
    return g(tlʼ, blʼ, { x, y })
  }

  const f4 = (x, y) => {
    return g(blʼ, brʼ, { x, y })
  }

  const min = function (...list) {
    let m = 1

    for (const v of list) {
      if (!Number.isNaN(v) && Number.isFinite(v) && v < m && v >= 0) {
        m = v
      }
    }

    return m
  }

  const max = function (...list) {
    let m = -1

    for (const v of list) {
      if (!Number.isNaN(v) && Number.isFinite(v) && v > m && v <= 0) {
        m = v
      }
    }

    return m
  }

  const top = [f1(0, 1).y, f2(0, 1).y, f3(0, 1).y]
  const left = [f2(-1, 0).x, f3(-1, 0).x, f4(-1, 0).x]
  const bottom = [f1(0, -1).y, f3(0, -1).y, f4(0, -1).y]
  const right = [f1(1, 0).x, f2(1, 0).x, f4(1, 0).x]

  return {
    top: min(...top),
    left: max(...left),
    bottom: max(...bottom),
    right: min(...right)
  }
}
