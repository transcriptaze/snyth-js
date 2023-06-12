import {
  VOLUME, GAIN, ATTACK, DECAY, SUSTAIN, RELEASE,
  Rε, R𝗌, Rθ, Ra, Rδx, Rδy, RΦ, R𝜓, Rb,
  Gε, G𝗌, Gθ, Ga, Gδx, Gδy, GΦ, G𝜓, Gb,
  Bε, B𝗌, Bθ, Ba, Bδx, Bδy, BΦ, B𝜓, Bb
} from '../schema.js'

// FIXME use patchbay table
const PLUGS = new Map([
  [`${VOLUME}`, 'volume'],
  [`${GAIN}`, 'gain'],
  [`${ATTACK}`, 'attack'],
  [`${DECAY}`, 'decay'],
  [`${SUSTAIN}`, 'sustain'],
  [`${RELEASE}`, 'release'],
  [Rε, 'R.ε'], [R𝗌, 'R.𝗌'], [Rθ, 'R.θ'], [Ra, 'R.a'], [Rδx, 'R.δx'], [Rδy, 'R.δy'], [RΦ, 'R.Φ'], [R𝜓, 'R.𝜓'], [Rb, 'R.b'],
  [Gε, 'G.ε'], [G𝗌, 'G.𝗌'], [Gθ, 'G.θ'], [Ga, 'G.a'], [Gδx, 'G.δx'], [Gδy, 'G.δy'], [GΦ, 'G.Φ'], [G𝜓, 'G.𝜓'], [Gb, 'G.b'],
  [Bε, 'B.ε'], [`${B𝗌}`, 'B.𝗌'], [`${Bθ}`, 'B.θ'], [Ba, 'B.a'], [Bδx, 'B.δx'], [Bδy, 'B.δy'], [BΦ, 'B.Φ'], [B𝜓, 'B.𝜓'], [Bb, 'B.b']
])

export class snNode extends AudioWorkletNode {
  constructor (context, id) {
    super(context, id, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2]
    })

    this.internal = {
      state: 'stopped',
      envelope: ''
    }

    this.sab = {
      parameters: null,
      variations: null,
      metrics: null,
      patchbay: null
    }

    this.port.onmessage = this.onMessage.bind(this)
  }

  get metrics () {
    if (this.sab.metrics != null) {
      return unpack(this.sab.metrics)
    } else {
      return {
        power: 0,
        level: 0,
        volume: 0,
        clipping: 0,
        dropping: 0,
        duration: 0
      }
    }
  }

  get state () {
    return this.internal.state
  }

  get patchbay () {
    return this.sab.patchbay
  }

  onMessage (event) {
    switch (event.data.message) {
      case 'sab.parameters':
        this.sab.parameters = event.data.sab
        this.sab.pages = event.data.pages
        this.sab.version = event.data.version
        break

      case 'sab.variations':
        this.sab.variations = event.data.sab
        this.sab.patchbay = new Float64Array(this.sab.variations, 0, event.data.size)
        break

      case 'sab.metrics':
        this.sab.metrics = event.data.sab
        break

      case 'state':
        this.internal.state = event.data.state
        break
    }
  }

  keyPressed (v) {
    if (v) {
      this.port.postMessage({
        message: 'keyPressed',
        timestamp: this.context.currentTime,
        note: v
      })
    }
  }

  keyReleased (v) {
    if (v) {
      this.port.postMessage({
        message: 'keyReleased',
        timestamp: this.context.currentTime,
        note: v
      })
    }
  }

  play (v) {
    if (v) {
      this.port.postMessage({
        message: 'play',
        timestamp: this.context.currentTime,
        song: v
      })
    }
  }

  pause () {
    this.port.postMessage({
      message: 'pause',
      timestamp: this.context.currentTime
    })
  }

  stop () {
    this.port.postMessage({
      message: 'stop',
      timestamp: this.context.currentTime
    })
  }

  patch (lfo, plug) {
    this.port.postMessage({
      message: 'patch',
      timestamp: this.context.currentTime,
      lfo,
      plug: lookup(plug)
    })
  }
}

function lookup (plug) {
  if (PLUGS.has(plug)) {
    return PLUGS.get(plug)
  }

  return ''
}

function unpack (sab) {
  const array = new Float64Array(sab, 0, 64)

  return {
    power: array[0],
    level: array[1],
    volume: array[2],
    clipping: array[3],
    dropping: array[4],
    duration: array[5],
    notes: array[6],
    maxNotes: array[7]
  }
}
