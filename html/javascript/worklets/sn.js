/* global currentTime */

import * as synth from '../synth/synth.js'
import * as parameters from '../synth/parameters.js'
import * as envelopes from '../synth/envelopes.js'
import * as notes from '../midi/notes.js'
import * as envelope from './envelope.js'
import { NoteList } from './notelist.js'

const TAU = 2 * Math.PI

const PARAMETERS = 64
const METRICS = 64
const PAGES = 2
const PAGE_SIZE = PARAMETERS * Float64Array.BYTES_PER_ELEMENT
const METRICS_SIZE = METRICS * Float64Array.BYTES_PER_ELEMENT

const VOLUME = 0
const GAIN = 1
const ATTACK = 2
const DECAY = 3
const SUSTAIN = 4
const RELEASE = 5
const Rε = 6
const R𝗌 = 7
const Rθ = 8
const Ra = 9
const Rδx = 10
const Rδy = 11
const RΦ = 12
const R𝜓 = 13
const Rb = 14
const Gε = 15
const G𝗌 = 16
const Gθ = 17
const Ga = 18
const Gδx = 19
const Gδy = 20
const GΦ = 21
const G𝜓 = 22
const Gb = 23
const Bε = 24
const B𝗌 = 25
const Bθ = 26
const Ba = 27
const Bδx = 28
const Bδy = 29
const BΦ = 30
const B𝜓 = 31
const Bb = 32

const OFFSETS = new Map([
  ['volume', VOLUME],
  ['gain', GAIN],
  ['attack', ATTACK],
  ['decay', DECAY],
  ['sustain', SUSTAIN],
  ['release', RELEASE],
  ['R.ε', Rε], ['R.𝗌', R𝗌], ['R.θ', Rθ], ['R.a', Ra], ['R.δx', Rδx], ['R.δy', Rδy], ['R.Φ', RΦ], ['R.𝜓', R𝜓], ['R.b', Rb],
  ['G.ε', Gε], ['G.𝗌', G𝗌], ['G.θ', Gθ], ['G.a', Ga], ['G.δx', Gδx], ['G.δy', Gδy], ['G.Φ', GΦ], ['G.𝜓', G𝜓], ['G.b', Gb],
  ['B.ε', Bε], ['B.𝗌', B𝗌], ['B.θ', Bθ], ['B.a', Ba], ['B.δx', Bδx], ['B.δy', Bδy], ['B.Φ', BΦ], ['B.𝜓', B𝜓], ['B.b', Bb]
])

export class SN extends AudioWorkletProcessor {
  constructor (id, threshold) {
    super()

    this.id = id
    this.threshold = threshold
    this.fs = 44100
    this.port.onmessage = this.onMessage.bind(this)

    this.queue = []
    this.qID = 1000
    this.notelist = new NoteList()
    this.envelope = envelopes.DEFAULT

    this.notelist.sortkey = 'onset,reverse'

    this.metrics = {
      power: 0,
      level: 0,
      volume: 0,
      clipping: 0,
      dropping: 0,
      duration: 0,
      notes: 0,
      maxNotes: 0
    }

    this.playing = false
    this.paused = false
    this.queued = 0

    this.currentTime = {
      last: 0,
      now: 0
    }

    this.sab = {
      parameters: new SharedArrayBuffer(PAGES * PAGE_SIZE),
      variations: new SharedArrayBuffer(PAGE_SIZE),
      metrics: new SharedArrayBuffer(METRICS_SIZE),
      wavetable: null,
      version: 0
    }

    this.plugs = {
      lfo1: 'volume',
      lfo2: 'gain',
      lfo3: '',
      lfo4: ''
    }

    this.patchbay = new Float64Array(this.sab.variations, 0, PARAMETERS)
    this.patchbay.fill(1)

    synth.pack(0, synth.DEFAULT_PARAMETERS, synth.DEFAULT_ENVELOPE, this.sab.parameters, 0)
    synth.pack(0, synth.DEFAULT_PARAMETERS, synth.DEFAULT_ENVELOPE, this.sab.parameters, 1)

    this.port.postMessage({
      message: 'sab.parameters',
      sab: this.sab.parameters,
      size: PARAMETERS,
      pages: PAGES,
      version: this.sab.version
    })

    this.port.postMessage({
      message: 'sab.variations',
      sab: this.sab.variations,
      size: PARAMETERS,
      pages: 1,
      version: 0
    })

    this.port.postMessage({
      message: 'sab.metrics',
      sab: this.sab.metrics,
      size: METRICS,
      pages: 1,
      version: 0
    })
  }

  static get parameterDescriptors () {
    return [
      { name: 'volume', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'gain', defaultValue: 0.2, minValue: -1, maxValue: 1, automationRate: 'k-rate' },
      { name: 'lfo1', defaultValue: 1, minValue: -2, maxValue: 2, automationRate: 'k-rate' },
      { name: 'lfo2', defaultValue: 1, minValue: -2, maxValue: 2, automationRate: 'k-rate' },
      { name: 'lfo3', defaultValue: 1, minValue: -2, maxValue: 2, automationRate: 'k-rate' },
      { name: 'lfo4', defaultValue: 1, minValue: -2, maxValue: 2, automationRate: 'k-rate' }
    ]
  }

  onMessage (event) {
    switch (event.data.message) {
      case 'parameters.updated':
        this.sab.version = event.data.version
        break

      case 'keyPressed':
        this.onKeyPressed(event)
        break

      case 'keyReleased':
        this.onKeyReleased(event)
        break

      case 'play':
        this.onPlay(event)
        break

      case 'pause':
        this.onPause(event)
        break

      case 'stop':
        this.onStop(event)
        break

      case 'patch':
        this.patch(event.data.lfo, event.data.plug)
    }
  }

  patch (lfo, plug) {
    switch (lfo) {
      case 'lfo.1':
        this.plugs.lfo1 = plug
        break

      case 'lfo.2':
        this.plugs.lfo2 = plug
        break

      case 'lfo.3':
        this.plugs.lfo3 = plug
        break

      case 'lfo.4':
        this.plugs.lfo4 = plug
        break
    }

    this.patchbay.fill(1)
  }

  onKeyPressed (event) {
    const now = this.currentTime.now
    const note = event.data.note
    const id = notes.NOTES.get(note).key

    this.queue.push({
      noteID: id,
      event: 'noteOn',
      note,
      velocity: 100,
      at: now
    })
  }

  onKeyReleased (event) {
    const now = this.currentTime.now
    const note = event.data.note
    const id = notes.NOTES.get(note).key

    this.queue.push({
      noteID: id,
      event: 'noteOff',
      note,
      at: now
    })
  }

  onPlay (event) {
    if (this.paused) {
      this.paused = false

      this.port.postMessage({
        message: 'state',
        timestamp: currentTime,
        state: 'playing'
      })
    } else if (!this.playing) {
      const list = []

      event.data.song.forEach(n => {
        const id = ++this.qID

        list.push({
          noteID: id,
          event: 'noteOn',
          note: n.note,
          velocity: n.velocity,
          at: n.start
        })

        list.push({
          noteID: id,
          event: 'noteOff',
          note: n.note,
          at: n.end
        })
      })

      this.queue = [...list]
      this.queued = this.queue.length
      this.playing = true
      this.paused = false

      this.currentTime.last = currentTime
      this.currentTime.now = 0

      this.metrics.notes = 0
      this.metrics.maxNotes = 0

      this.port.postMessage({
        message: 'state',
        timestamp: currentTime,
        state: 'playing'
      })
    }
  }

  onPause (event) {
    this.paused = true

    this.port.postMessage({
      message: 'state',
      timestamp: currentTime,
      state: 'paused'
    })
  }

  onStop (event) {
    this.queue = []
    this.notelist.clear()

    this.playing = false
    this.paused = false

    this.port.postMessage({
      message: 'state',
      timestamp: currentTime,
      state: 'stopped'
    })
  }

  unpack () {
    const patchbay = this.patchbay
    const { version, parameters, envelope } = unpack(this.sab.parameters, this.sab.version)

    parameters[0].parameters.e *= patchbay[Rε]
    parameters[0].parameters.s *= patchbay[R𝗌]
    parameters[0].parameters.θ *= patchbay[Rθ]
    parameters[0].parameters.h *= patchbay[Ra]
    parameters[0].parameters.δx *= patchbay[Rδx]
    parameters[0].parameters.δy *= patchbay[Rδy]
    parameters[0].parameters.Φ *= patchbay[RΦ]
    parameters[0].parameters.𝜓 *= patchbay[R𝜓]
    parameters[0].parameters.balance *= patchbay[Rb]

    parameters[1].parameters.e *= patchbay[Gε]
    parameters[1].parameters.s *= patchbay[G𝗌]
    parameters[1].parameters.θ *= patchbay[Gθ]
    parameters[1].parameters.h *= patchbay[Ga]
    parameters[1].parameters.δx *= patchbay[Gδx]
    parameters[1].parameters.δy *= patchbay[Gδy]
    parameters[1].parameters.Φ *= patchbay[GΦ]
    parameters[1].parameters.𝜓 *= patchbay[G𝜓]
    parameters[1].parameters.balance *= patchbay[Gb]

    parameters[2].parameters.e *= patchbay[Bε]
    parameters[2].parameters.s *= patchbay[B𝗌]
    parameters[2].parameters.θ *= patchbay[Bθ]
    parameters[2].parameters.h *= patchbay[Ba]
    parameters[2].parameters.δx *= patchbay[Bδx]
    parameters[2].parameters.δy *= patchbay[Bδy]
    parameters[2].parameters.Φ *= patchbay[BΦ]
    parameters[2].parameters.𝜓 *= patchbay[B𝜓]
    parameters[2].parameters.balance *= patchbay[Bb]

    // _log(parameters[1].parameters.e)

    return { version, parameters, envelope }
  }

  process (inputs, outputs, parameters) {
    if (outputs != null && outputs.length > 0) {
      const out = outputs[0]

      if (out != null && out.length > 0) {
        const samples = out[0].length

        if (this.paused) {
          this.pause(out, samples, parameters)
        } else {
          this.synthesize(out, samples, parameters)
        }
      }
    }

    return true
  }

  pause (out, samples, parameters) {
    for (let ix = 0; ix < samples; ix++) {
      out[0][ix] = 0
      out[1][ix] = 0
    }

    this.currentTime.last = currentTime
  }

  synthesize (out, samples, parameters) {
    // ... calculate 'score' time
    const delta = currentTime - this.currentTime.last
    const now = this.currentTime.now + delta

    this.currentTime.last = currentTime
    this.currentTime.now = now

    // ... process note queue
    this.dequeue(parameters)

    // ... copy LFO values to variations
    const patchbay = this.patchbay
    const plugs = [this.plugs.lfo1, this.plugs.lfo2, this.plugs.lfo3, this.plugs.lfo4]
    const values = [parameters.lfo1[0], parameters.lfo2[0], parameters.lfo3[0], parameters.lfo4[0]]

    plugs.forEach((plug, i) => {
      if (OFFSETS.has(plug)) {
        const offset = OFFSETS.get(plug)
        const v = remap(plug, values[i])

        patchbay[offset] = v
      }
    })

    // ... synthesize audio
    this.sn(out, samples, parameters, this.notefn())

    // ... update external metrics
    pack(this.sab.metrics, this.metrics)
  }

  notefn () {
    return (note, N, _ix) => {
      return {
        snl: new Float32Array(N),
        snr: new Float32Array(N)
      }
    }
  }

  sn (out, samples, parameters, fn) {
    const V = parameters.volume[0]
    const G = parameters.gain[0]

    const now = this.currentTime.now
    const patchbay = this.patchbay
    const volume = V * patchbay[VOLUME]
    const gain = G * patchbay[GAIN]

    // ... synthesize notes scaled by note velocity
    const left = new Float32Array(samples)
    const right = new Float32Array(samples)

    let count = 0

    for (const note of this.notelist) {
      count++

      const dα = TAU * note.frequency / this.fs
      const sn = V < 0.1 ? fn0(note, samples) : fn(note, samples, count)
      const snʼ = {
        left: sn.snl.map((v) => v * note.velocity / 127.0),
        right: sn.snr.map((v) => v * note.velocity / 127.0)
      }

      const audio = envelope.apply(note.envelope, now, note, snʼ)

      audio.snl.forEach((v, ix) => { left[ix] += v })
      audio.snr.forEach((v, ix) => { right[ix] += v })

      note.alpha += dα * samples
      note.alpha %= TAU
    }

    // ... map to output buffers
    let power = 0
    let clipped = false
    const dropped = this.notelist.size > this.threshold

    for (let ix = 0; ix < samples; ix++) {
      const l = clamp(gain * left[ix], -1.0, 1.0)
      const r = clamp(gain * right[ix], -1.0, 1.0)
      const p = l * l + r * r

      out[0][ix] = volume * l
      out[1][ix] = volume * r

      power += p

      if (p <= -1.0 || p >= +1.0) {
        clipped = true
      }
    }

    // .. clear finished notes
    this.flush()

    // ... update metrics
    if (Number.isNaN(power)) {
      console.error({ power })
    } else {
      this.metrics.power = power
      this.metrics.volume = volume
      this.metrics.duration = this.playing ? this.currentTime.now : 0

      const level = Math.sqrt(power / samples)
      if (level > this.level) {
        this.metrics.level = 0.2 * this.metrics.level + 0.8 * level
      } else {
        this.metrics.level = 0.95 * this.metrics.level + 0.05 * level
      }

      if (clipped) {
        this.metrics.clipping = 1.0
      } else {
        this.metrics.clipping = 0.995 * this.metrics.clipping
      }

      if (dropped) {
        this.metrics.dropping = 1.0
      } else {
        this.metrics.dropping = 0.995 * this.metrics.dropping
      }

      this.metrics.notes = this.notelist.size
      this.metrics.maxNotes = Math.max(this.metrics.maxNotes, this.notelist.size)
    }
  }

  dequeue (parameters) {
    const now = this.currentTime.now
    const patchbay = this.patchbay
    const envelope = this.envelope == null ? envelopes.DEFAULT : this.envelope
    const attack = envelope.attack * patchbay[ATTACK]
    const decay = envelope.type === 'AR' ? 0 : this.envelope.decay * patchbay[DECAY]
    const sustain = envelope.type === 'AR' ? 1 : this.envelope.sustain * patchbay[SUSTAIN]
    const release = envelope.release * patchbay[RELEASE]
    const added = []
    const released = []

    this.queue.forEach((event, index) => {
      if (!event || event.at > now) {
        return
      }

      if (event.at <= now) {
        delete this.queue[index]
        this.queued--

        if (event.event === 'noteOn') {
          const note = {
            ID: event.noteID,
            note: event.note,
            velocity: event.velocity,
            frequency: notes.NOTES.get(event.note).frequency,
            state: 'A',
            onset: now,
            level: 0,
            alpha: 0,

            envelope: {
              attack,
              decay,
              sustain,
              release
            }
          }

          added.push(note)
        }

        if (event.event === 'noteOff') {
          released.push({ ID: event.noteID, at: now, release })
        }
      }
    })

    this.notelist.add(...added)
    this.notelist.release(...released)
  }

  /*
   * Remove any completed notes and check for end of play
   */
  flush () {
    // ... remove finished notes
    this.notelist.flush()

    // ... all done?
    if (this.queued <= 0 && this.notelist.empty && this.playing) {
      this.playing = false
      this.paused = false
      this.port.postMessage({
        message: 'state',
        timestamp: this.currentTime.now,
        state: 'stopped'
      })
    }
  }
}

function fn0 (note, N) {
  return {
    snl: new Float32Array(N),
    snr: new Float32Array(N)
  }
}

function pack (sab, metrics) {
  const array = new Float64Array(sab, 0, 64)

  array[0] = metrics.power
  array[1] = metrics.level
  array[2] = metrics.volume
  array[3] = metrics.clipping
  array[4] = metrics.dropping
  array[5] = metrics.duration
  array[6] = metrics.notes
  array[7] = metrics.maxNotes
}

// NOTES
// 1. https://bugzilla.mozilla.org/show_bug.cgi?id=1246597 says because DataView is apparently quite slow.
// 2. Apparently fixed in V8 at least https://v8.dev/blog/dataview
// 3. Parameters are unpacked and cached as radians
function unpack (sab, version) {
  const page = version % PAGES
  const offset = page * PAGE_SIZE
  const array = new Float64Array(sab, offset, PARAMETERS)

  const params = parameters.unpack(array)
  const envelope = envelopes.unpack(array)

  return {
    version,
    parameters: params,
    envelope
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

// Scales an LFO input in the range [0,2] to the [min,max] range associated
// with the parameter.
//
// NTS: an audio param mixes the default value (1) with the LFO range [-1,+1]
//      to give a value range [0,2]. Not at all obvious from the documentation.
//
// Ref. https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect
//
// An AudioParam will take the rendered audio data from any AudioNode output connected
// to it  and convert it to mono by down-mixing (if it is not already mono). Next, it
// will mix it together with any other such outputs, and the intrinsic parameter value
// (the value the AudioParam would normally have without any audio connections), including
// any timeline changes scheduled for the parameter.
function remap (plug, v) {
  const p = REMAP.get(plug)
  const min = p == null ? 0 : p.min
  const max = p == null ? 1 : p.max
  const vʼ = min + (max - min) * v / 2

  return Math.min(Math.max(vʼ, min), max)
}

const REMAP = new Map([
  ['R.ε', { min: -1, max: +1 }],
  ['G.ε', { min: -1, max: +1 }],
  ['B.ε', { min: -1, max: +1 }],
  ['R.𝗌', { min: 0, max: 1 }],
  ['G.𝗌', { min: 0, max: 1 }],
  ['B.𝗌', { min: 0, max: 1 }],
  ['R.θ', { min: -1, max: +1 }],
  ['G.θ', { min: -1, max: +1 }],
  ['B.θ', { min: -1, max: +1 }],
  ['R.a', { min: 0, max: 1 }],
  ['G.a', { min: 0, max: 1 }],
  ['B.a', { min: 0, max: 1 }],
  ['R.δx', { min: 0, max: 1 }],
  ['G.δx', { min: 0, max: 1 }],
  ['B.δx', { min: 0, max: 1 }],
  ['R.δy', { min: 0, max: 1 }],
  ['G.δy', { min: 0, max: 1 }],
  ['B.δy', { min: 0, max: 1 }],
  ['R.𝜓', { min: -1, max: 1 }],
  ['G.𝜓', { min: -1, max: 1 }],
  ['B.𝜓', { min: -1, max: 1 }],
  ['R.b', { min: -1, max: 1 }],
  ['G.b', { min: -1, max: 1 }],
  ['B.b', { min: -1, max: 1 }]
])

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 999) === 0) {
    console.log(v)
  }

  _log.count++
}
