/*
 * Free FFT and convolution (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */
'use strict'

/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function.
 */
export function transform (real, imag) {
  const N = real.length

  if (N !== imag.length) {
    throw new RangeError('Mismatched lengths')
  } else if ((N & (N - 1)) !== 0) {
    throw new RangeError('length should be a power of 2')
  }

  transformRadix2(real, imag)
}

/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 */
function transformRadix2 (real, imag) {
  // Length variables
  const n = real.length

  if (n !== imag.length) {
    throw new RangeError('Mismatched lengths')
  }

  if (n === 1) { // Trivial transform
    return
  }

  let levels = -1
  for (let i = 0; i < 32; i++) {
    if (1 << i === n) { // Equal to log2(n)
      levels = i
    }
  }

  if (levels === -1) {
    throw new RangeError('Length is not a power of 2')
  }

  // Trigonometric tables
  const cosTable = new Array(n / 2)
  const sinTable = new Array(n / 2)
  for (let i = 0; i < n / 2; i++) {
    cosTable[i] = Math.cos(2 * Math.PI * i / n)
    sinTable[i] = Math.sin(2 * Math.PI * i / n)
  }
  // Bit-reversed addressing permutation
  for (let i = 0; i < n; i++) {
    const j = reverseBits(i, levels)
    if (j > i) {
      let temp = real[i]
      real[i] = real[j]
      real[j] = temp
      temp = imag[i]
      imag[i] = imag[j]
      imag[j] = temp
    }
  }
  // Cooley-Tukey decimation-in-time radix-2 FFT
  for (let size = 2; size <= n; size *= 2) {
    const halfsize = size / 2
    const tablestep = n / size
    for (let i = 0; i < n; i += size) {
      for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
        const l = j + halfsize
        const tpre = real[l] * cosTable[k] + imag[l] * sinTable[k]
        const tpim = -real[l] * sinTable[k] + imag[l] * cosTable[k]
        real[l] = real[j] - tpre
        imag[l] = imag[j] - tpim
        real[j] += tpre
        imag[j] += tpim
      }
    }
  }
  // Returns the integer whose value is the reverse of the lowest 'width' bits of the integer 'val'.
  function reverseBits (val, width) {
    let result = 0
    for (let i = 0; i < width; i++) {
      result = (result << 1) | (val & 1)
      val >>>= 1
    }
    return result
  }
}
