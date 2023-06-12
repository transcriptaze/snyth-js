import { schema, suffixes, filters, OID, SYNTH, LFO1, LFO2, LFO3, LFO4, SONG } from './schema.js'
import * as eventbus from './eventbus.js'
import { Keyboard } from './keyboard.js'
import * as midifile from './midi/midifile.js'
import * as playlist from './synth/playlist.js'
import * as envelopes from './synth/envelopes.js'
import * as oscillators from './synth/oscillators.js'
import * as LFOs from './synth/LFOs.js'
import * as audio from './synth/audio.js'
import { LFO } from './LFO.js'
import { OSC } from './OSC.js'
import { ENV } from './ENV.js'
import * as dsp from './dsp/dsp.js'

const TAU = 2 * Math.PI
const QUEUE_INTERVAL = 1500 // ms

let _maxNotes = 0

export class Synth {
  constructor (oid) {
    this.oid = oid
    this.powerOn = false
    this.notes = []
    this.stale = {
      OSC: true,
      ENV: true,
      LFO: true
    }

    document.querySelector('#reset').onclick = (event) => this.reset(event)
    document.querySelector('#stop').onclick = (event) => this.stop(event)

    this.internal = {
      stopped: true,
      volume: document.querySelector('#volume'),
      gain: document.querySelector('#gain'),
      mode: document.querySelector('#worklets'),
      progressBar: document.querySelector('#progressbar'),
      play: document.querySelector('#play'),
      envelope: document.querySelector('#envelope'),
      load: document.querySelector('#load'),
      reset: document.querySelector('#reset'),
      record: document.querySelector('#record'),
      picker: document.querySelector('#midi'),
      AA: document.querySelector('#osc-aa')
    }
  }

  get picker () {
    return this.internal.picker
  }

  get volume () {
    const v = this.internal.volume.value
    const min = this.internal.volume.min
    const max = this.internal.volume.max

    return (v - min) / (max - min)
  }

  set volume (v) {
    const volume = parseFloat(v)

    if (!Number.isNaN(volume)) {
      this.internal.volume.value = clamp(volume, 0, 1)
    }
  }

  get gain () {
    const v = this.internal.gain.value
    const min = this.internal.gain.min
    const max = this.internal.gain.max

    return (v - min) / (max - min)
  }

  set gain (v) {
    const gain = parseFloat(v)

    if (!Number.isNaN(gain)) {
      this.internal.gain.value = clamp(gain, 0, 1)
    }
  }

  get envelope () {
    return this.internal.envelope.value
  }

  /* eslint-disable-next-line accessor-pairs */
  set title (v) {
    this.picker.title = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set progress (v) {
    this.picker.progress = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set duration (v) {
    this.picker.duration = v
  }

  get playing () {
    return this.internal.play.playing
  }

  set playing (v) {
    this.internal.play.playing = v
  }

  get recording () {
    return this.internal.record.recording
  }

  get looping () {
    return !this.internal.stopped && this.internal.play.loop
  }

  get autoload () {
    return this.internal.load.autoLoad
  }

  get antialias () {
    return this.internal.AA.checked
  }

  initialise () {
    restore()
    attach(this)
    initialise(this)
    subscribe(this)
  }

  onPowerUp (ctx, worklets) {
    this.internal.mode.enabled = true
    this.internal.mode.selected = 'wavetable'
    this.internal.record.enabled = true

    setup(ctx, worklets)

    this.powerOn = true
  }

  onPowerDown () {
    this.powerOn = false
    this.internal.mode.enabled = false
    this.internal.record.enabled = false

    tearDown(this)
  }

  prepare (file, name, notes, data) {
    this.notes = notes
    _maxNotes = 0

    if (notes && notes.length > 0) {
      document.querySelector('div#buttons').dataset.midi = 'ready'
    } else {
      document.querySelector('div#buttons').dataset.midi = ''
    }

    if (notes && notes.length > 0) {
      this.progress = 0
      this.duration = Math.max(...notes.map((v) => v.end))
    } else {
      this.progress = 0
      this.duration = 0
    }

    if (name !== '') {
      this.title = ellipsize(name)
      audio.recorder.song = name
    } else {
      this.title = ellipsize(file, 'start')
      audio.recorder.song = name
    }

    playlist.playlist.current = {
      name,
      file,
      notes,
      data
    }

    dispatch('changed', `${schema.playlist}`, suffixes.playlist.song.title, name)
    dispatch('changed', `${schema.playlist}`, suffixes.playlist.song.file, file)

    this.stop()
  }

  enqueue (oid, file, name, notes, data) {
    playlist.enqueue(oid, file, name, notes, data)
  }

  queued (oid, v) {
    this.picker.queued(oid, v === true)
  }

  stashed (oid, url, title) {
    this.picker.stashed(oid, url, title)
  }

  play (file, name, notes, data) {
    this.prepare(file, name, notes, data)
    onPlay()
  }

  reset (event) {
    reset()
  }

  stop () {
    this.internal.stopped = true
    this.playing = false

    keyboard.reset()
    audio.stop()
  }
}

export const synth = new Synth(SYNTH)
const keyboard = new Keyboard('#keyboard', audio.noteOn, audio.noteOff)

function restore () {
  LFOs.restore()

  playlist.restore()
  for (const slot of playlist.SLOTS) {
    if (slot.url !== '') {
      synth.stashed(slot.oid, slot.url, slot.title)
    }
  }
}

/** Attach change/changed event handlers to controls
 *
 */
function attach (synth) {
  // ... playlist
  synth.picker.onPicked = onPicked
  synth.picker.onPlaylist = onPlaylist
  synth.picker.onUnqueue = () => { playlist.unqueue(SONG) }

  // ... wavetable/DDS mode
  synth.internal.mode.onChanged = (e) => {
    audio.source(e.currentTarget.value)
  }

  // ... gain/volume
  synth.internal.gain.onChange = (v) => {
    audio.setGain(synth.gain)
  }

  synth.internal.volume.onChange = (v) => {
    audio.setVolume(synth.volume)
  }

  // ... envelope selector
  synth.internal.envelope.onClick = (event) => {
    nextEnvelope(synth.envelope)
  }

  // ... filters

  synth.internal.AA.onchange = (event) => {
    audio.antialias(synth.antialias)
  }
}

function subscribe (synth) {
  // ... playlist
  eventbus.subscribe('changed', (e) => {
    synth.queued(SONG, e.detail.value === 'queued')
  }, filters.playlist.song.state)

  // FIXME use schema regex
  eventbus.subscribe('changed', (e) => {
    const match = e.detail.oid.match(/^(0\.5\.1\.[0-9]+)\..*$/)

    if (match != null) {
      const slot = match[1]

      if (e.detail.value === 'queued') {
        synth.queued(slot, true)
      } else if (e.detail.value === 'dequeued') {
        synth.queued(slot, false)
      } else if (e.detail.value === 'error') {
        synth.picker.error(slot, true)
      }
    }
  }, filters.playlist.slot.state)

  eventbus.subscribe('changed', (e) => {
    const match = e.detail.oid.match(/^(0\.5\.1\.[0-9]+)\..*$/)
    if (match != null) {
      synth.stashed(match[1], e.detail.value.url, e.detail.value.title)
    }
  }, filters.playlist.slot.url)
}

function initialise (synth) {
  // ... subscribe to SN events
  eventbus.subscribe('change', (e) => {
    synth.stale.OSC = true
  }, filters.SN.OSC)

  eventbus.subscribe('changed', (e) => {
    if (synth.autoload) {
      onWavetable()
    } else {
      synth.stale.OSC = true
    }

    onDDS()
  }, filters.SN.OSC)

  // ... subscribe to envelope events
  eventbus.subscribe('change', (e) => {
    synth.stale.ENV = true
  }, filters.envelopes.any)

  eventbus.subscribe('changed', (e) => {
    const env = envelopes.selected()

    synth.internal.envelope.value = env.oid
    synth.internal.envelope.label = env.label

    onEnvelope(env.oid)
    if (synth.autoLoad) {
      onWavetable()
    }
  }, filters.synth.envelope)

  eventbus.subscribe('changed', (e) => {
    const env = envelopes.selected()

    synth.internal.envelope.label = env.label

    onEnvelope(env.oid)
    if (synth.autoLoad) {
      onWavetable()
    }
  }, filters.envelopes.any)

  // ... subscribe to LFO events
  eventbus.subscribe('change', (e) => {
    synth.stale.LFO = true
  }, filters.SN.LFO)

  eventbus.subscribe('changed', (e) => {
    synth.stale.LFO = true
  }, filters.SN.LFO)

  eventbus.subscribe('changed', (e) => onLFO(e.detail.oid, e.detail.value), filters.LFO.any)

  const f = function () {
    if (synth.powerOn) {
      audio.regenerate()
    }

    refresh()
    window.requestAnimationFrame(f)
  }

  window.requestAnimationFrame(f)
}

function setup (ctx, worklets) {
  audio.setup(ctx, worklets)

  audio.recorder.onavailable = (blob, title) => {
    synth.internal.record.recorded = {
      title,
      blob
    }
  }

  audio.setVolume(synth.volume)
  audio.setGain(synth.gain)

  // .. initialise controls
  Array.from(['#stop']).forEach(id => {
    document.querySelector(id).disabled = false
  })

  synth.internal.play.onPlay = onPlay
  synth.internal.play.onPause = onPause
  synth.internal.load.onLoad = onWavetable

  synth.internal.play.disabled = false
  synth.internal.envelope.disabled = false
  synth.internal.load.disabled = false

  synth.internal.gain.level = 0
  synth.internal.gain.clipping = 0

  synth.internal.volume.level = 1
  synth.internal.volume.dropping = 0

  onWavetable()
  onDDS()

  // 'k, done

  synth.stale.OSC = true
  synth.stale.ENV = true
  synth.stale.LFO = true
}

function tearDown (synth) {
  document.querySelector('div#buttons').dataset.state = ''

  Array.from(['#stop']).forEach(id => {
    document.querySelector(id).disabled = true
  })

  synth.internal.play.disabled = true
  synth.internal.load.disabled = true
  synth.internal.envelope.disabled = true

  synth.internal.gain.level = 0
  synth.internal.gain.clipping = 0

  synth.internal.volume.level = 1
  synth.internal.volume.dropping = 0

  audio.tearDown()
  keyboard.reset()
}

function reset () {
  oscillators.reset()
  OSC.reset()

  envelopes.select(envelopes.DEFAULT.oid)

  // NTS (sigh) interim workaround for delayed event chain
  //     c.reset -> onChanged -> synth.stale -> animation frame -> set load highlight
  setTimeout(() => {
    OSC.redraw()
    onWavetable()
    onDDS()

    synth.internal.reset.classList.remove('highlight')
  }, 50)
}

function onPlay () {
  synth.internal.stopped = false

  audio.onPlay(synth.notes, synth.recording)
}

function onPause () {
  audio.onPause()
}

function refresh () {
  // ... animate?
  if (refresh.animate == null) {
    refresh.animate = {
      OSC: false,
      ENV: false
    }
  }

  const patchbay = audio.oscillator != null ? audio.oscillator.patchbay : null
  const animate = {
    OSC: patchbay != null && OSC.animate,
    ENV: patchbay != null && ENV.animate
  }

  if (synth.stale.OSC || animate.OSC || refresh.animate.OSC) {
    OSC.redraw(patchbay)
    refresh.animate.OSC = animate.OSC
  }

  if (synth.stale.ENV || animate.ENV || refresh.animate.ENV) {
    ENV.redraw(patchbay)
    refresh.animate.ENV = animate.ENV
  }

  // ... OSC ?
  if (synth.stale.OSC) {
    onDDS()

    synth.stale.OSC = false
    synth.internal.load.highlight = true
    synth.internal.reset.classList.add('highlight')
  }

  // ... ENV ?
  if (synth.stale.ENV) {
    onDDS()

    synth.stale.ENV = false
    synth.internal.load.highlight = true
  }

  // ... LFO ?
  if (synth.stale.LFO) {
    synth.stale.LFO = false

    LFO.redraw()

    const parameters = LFOs.parameters()

    const rgb = parameters
      .map(({ m, e, s, θ, h, Φ, 𝜓, δx, δy, shape }) => ({ m, e, s, θ: radians(θ), h: 1, Φ: radians(Φ), 𝜓: 0, δx, δy, shape }))
      .map((p) => { return dsp.wavetable(p, 720) })

    const yellow = rgb
      .map((u, i) => { return u.map((v) => parameters[i].h * v) })
      .reduce((v, y) => (y.map((u, i) => u + v[i])))
      .map((v) => clamp(v, -1, +1))

    if (audio.lfo1 != null) {
      audio.lfo1.load(yellow)
    }

    if (audio.lfo2 != null) {
      audio.lfo2.load(rgb[0])
    }

    if (audio.lfo3 != null) {
      audio.lfo3.load(rgb[1])
    }

    if (audio.lfo4 != null) {
      audio.lfo4.load(rgb[2])
    }
  }

  // ... level/clipping/dropping ?
  if (synth.powerOn && audio.oscillator) {
    const metrics = audio.oscillator.metrics

    if (!Number.isNaN(metrics.volume)) {
      const v1 = audio.wavetable.metrics.volume
      const v2 = audio.dds.metrics.volume
      synth.internal.volume.level = v1 + v2
    }

    if (!Number.isNaN(metrics.level)) {
      synth.internal.gain.level = metrics.level
    }

    if (!Number.isNaN(metrics.clipping)) {
      synth.internal.gain.clipping = 1.0 * metrics.clipping
    }

    if (!Number.isNaN(metrics.dropping)) {
      synth.internal.volume.dropping = 1.0 * metrics.dropping
    }

    if (metrics.maxNotes > _maxNotes) {
      _maxNotes = metrics.maxNotes
      console.log(`notes:${metrics.notes} max:${_maxNotes}`)
    }

    // _log(`${metrics.notes} ${_maxNotes}`)

    synth.progress = metrics.duration
  }

  // ... playing/paused/stopped
  if (synth.powerOn && audio.oscillator) {
    const div = document.querySelector('div#buttons')

    if (div.dataset.state !== 'playing' && audio.isPlaying()) {
      synth.playing = true
      div.dataset.state = 'playing'
    } else if (div.dataset.state !== 'paused' && audio.isPaused()) {
      synth.playing = false
      div.dataset.state = 'paused'
    } else if (div.dataset.state !== 'stopped' && audio.isStopped()) {
      div.dataset.state = 'stopped'

      if (synth.looping) {
        setTimeout(onPlay, 50)
      } else {
        synth.playing = false

        audio.recorder.stop()

        const next = playlist.next()
        if (next != null) {
          setTimeout((e) => { synth.play(next.file, next.title, next.notes, next.data) }, QUEUE_INTERVAL)
        }
      }
    }

    // ... recording
    if (synth.playing && synth.recording && !audio.recorder.recording) {
      audio.recorder.start()
    } else if (synth.playing && !synth.recording && audio.recorder.recording) {
      audio.recorder.stop()
    }
  }
}

function onPicked (file, action) {
  const fn = (bytes) => {
    const smf = midifile.parse(bytes)
    const song = midifile.toNotes(smf)
    const data = new Uint8Array(bytes)

    if (action === 'queue') {
      synth.enqueue(SONG, file.name, song.name, song.notes, data)
    } else {
      synth.prepare(file.name, song.name, song.notes, data)
    }
  }

  file.arrayBuffer()
    .then(bytes => fn(bytes))
    .catch((err) => { console.error(err) })
}

function onPlaylist (action, oid, file) {
  if (action === 'play') {
    playlist.get(oid, file)
      .then((song) => synth.prepare(song.file, song.name, song.notes, song.data))
      .catch(err => { console.log(err) })
  }

  if (action === 'queue') {
    playlist.get(oid)
      .then((song) => synth.enqueue(oid, song.file, song.name, song.notes, song.data))
      .catch(err => { console.log(err) })
  }

  if (action === 'unqueue') {
    playlist.unqueue(oid)
  }

  if (action === 'stash::file') {
    playlist.stash(oid, file, 'file')
  }

  if (action === 'stash::url') {
    playlist.stash(oid, file, 'url')
  }

  if (action === 'reset') {
    playlist.reset(oid)
  }
}

function onWavetable () {
  if (audio.wavetable) {
    const parameters = oscillators.parameters()
    const env = synth.internal.envelope.value
    const envelope = envelopes.get(env)

    if (envelope) {
      audio.wavetable.set(parameters, envelope)
    } else {
      audio.wavetable.set(parameters, envelopes.DEFAULT)
    }

    synth.internal.load.highlight = false
  }
}

function onDDS () {
  if (audio.dds) {
    const parameters = oscillators.parameters()
    const env = synth.internal.envelope.value
    const envelope = envelopes.get(env)

    audio.dds.set(parameters, envelope)
  }
}

function onEnvelope (oid) {
  const env = envelopes.get(oid)

  if (env) {
    if (audio.wavetable) {
      onWavetable()
    }

    if (audio.dds) {
      onDDS()
    }
  }
}

function onLFO (oid, v) {
  const base = (function () {
    if (OID.contains(oid, `${LFO1}`)) {
      return LFO1
    }

    if (OID.contains(oid, `${LFO2}`)) {
      return LFO2
    }

    if (OID.contains(oid, `${LFO3}`)) {
      return LFO3
    }

    if (OID.contains(oid, `${LFO4}`)) {
      return LFO4
    }

    return '???'
  })()

  const tag = (function () {
    if (OID.contains(oid, `${LFO1}`)) {
      return 'lfo.1'
    }

    if (OID.contains(oid, `${LFO2}`)) {
      return 'lfo.2'
    }

    if (OID.contains(oid, `${LFO3}`)) {
      return 'lfo.3'
    }

    if (OID.contains(oid, `${LFO4}`)) {
      return 'lfo.4'
    }

    return null
  })()

  const lfo = (function () {
    if (OID.contains(oid, `${LFO1}`)) {
      return audio.lfo1
    }

    if (OID.contains(oid, `${LFO2}`)) {
      return audio.lfo2
    }

    if (OID.contains(oid, `${LFO3}`)) {
      return audio.lfo3
    }

    if (OID.contains(oid, `${LFO4}`)) {
      return audio.lfo4
    }

    return null
  })()

  if (lfo == null) {
    return
  }

  switch (true) {
    case OID.matches(oid, `${base}${suffixes.lfo.on}`):
      lfo.parameters
        .get('on')
        .linearRampToValueAtTime(v === true ? 1 : 0, audio.audioContext.currentTime + 0.5)
      break

    case OID.matches(oid, `${base}${suffixes.lfo.frequency}`):
      lfo.parameters
        .get('frequency')
        .exponentialRampToValueAtTime(parseFloat(v), audio.audioContext.currentTime + 0.1)
      break

    case OID.matches(oid, `${base}${suffixes.lfo.range.min}`):
      lfo.parameters
        .get('min')
        .linearRampToValueAtTime(parseFloat(v), audio.audioContext.currentTime + 0.1)
      break

    case OID.matches(oid, `${base}${suffixes.lfo.range.max}`):
      lfo.parameters
        .get('max')
        .linearRampToValueAtTime(parseFloat(v), audio.audioContext.currentTime + 0.1)
      break

    case OID.matches(oid, `${base}${suffixes.lfo.plug}`):
      audio.wavetable.patch(tag, v)
      audio.dds.patch(tag, v)
      break

    default:
      console.error('unsupported LFO parameter', oid)
  }
}

function nextEnvelope (oid) {
  let next = envelopes.next(oid)
  let count = 0

  while (!next.favourite && count <= 13) {
    next = envelopes.next(next.oid)
    count++
  }

  envelopes.select(next.oid)
}

function radians (v) {
  return TAU * v / 360
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

function dispatch (eventType, oid, suffix, value) {
  const evt = new CustomEvent(eventType, {
    detail: {
      oid: oid + suffix,
      value
    }
  })

  eventbus.publish(evt)
}

function ellipsize (s, at) {
  switch (true) {
    case s.length < 25:
      return s

    case at === 'start' && !s.toLowerCase().endsWith('.mid'):
      return `…${s.slice(-25)}`

    case at === 'start' && s.toLowerCase().endsWith('mid'):
      return `…${s.slice(-29, -4)}`

    default:
      return `${s.substring(0, 25)}…`
  }
}

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 60) === 0) {
    console.log(v)
  }

  _log.count++
}
