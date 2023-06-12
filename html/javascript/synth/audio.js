import * as eventbus from '../eventbus.js'
import { schema, suffixes } from '../schema.js'

import * as LFOs from './LFOs.js'
import { recorder } from './recorder.js'

export { recorder } from './recorder.js'
export let audioContext
export let wavetable = null
export let dds = null
export let lfo1 = null
export let lfo2 = null
export let lfo3 = null
export let lfo4 = null
export let oscillator = null
export let volumeNode = null
export let aaFilter = null

export function setup (ctx, worklets) {
  audioContext = ctx
  wavetable = worklets.get('wavetable')
  dds = worklets.get('dds')
  oscillator = wavetable

  lfo1 = worklets.get('lfo.1')
  lfo2 = worklets.get('lfo.2')
  lfo3 = worklets.get('lfo.3')
  lfo4 = worklets.get('lfo.4')

  aaFilter = ctx.createBiquadFilter()
  aaFilter.type = 'lowpass'
  aaFilter.Q.setValueAtTime(1, ctx.currentTime)
  aaFilter.gain.setValueAtTime(0, ctx.currentTime)
  aaFilter.frequency.setValueAtTime(22050, ctx.currentTime)

  volumeNode = new GainNode(ctx)

  wavetable.connect(aaFilter)
  dds.connect(aaFilter)
  aaFilter.connect(volumeNode)
  volumeNode.connect(ctx.destination)

  wavetable.parameters.get('volume').setValueAtTime(1, ctx.currentTime)
  dds.parameters.get('volume').setValueAtTime(0.0001, ctx.currentTime)

  lfo1.connect(wavetable.parameters.get('lfo1'))
  lfo2.connect(wavetable.parameters.get('lfo2'))
  lfo3.connect(wavetable.parameters.get('lfo3'))
  lfo4.connect(wavetable.parameters.get('lfo4'))

  lfo1.connect(dds.parameters.get('lfo1'))
  lfo2.connect(dds.parameters.get('lfo2'))
  lfo3.connect(dds.parameters.get('lfo3'))
  lfo4.connect(dds.parameters.get('lfo4'))

  recorder.initialise(ctx, aaFilter)
  // recorder.onavailable = (blob, title) => {
  //   synth.internal.record.recorded = {
  //     title,
  //     blob
  //   }
  // }

  // .. initial LFOs

  new Map([
    ['lfo.1', lfo1],
    ['lfo.2', lfo2],
    ['lfo.3', lfo3],
    ['lfo.4', lfo4]
  ]).forEach((node, tag) => {
    const lfo = LFOs.get(tag)
    const on = lfo.on === true ? 1 : 0
    const f = Math.max(lfo.frequency, 0.1)
    const range = lfo.range
    const plug = lfo.plug
    const at = ctx.currentTime + 0.1

    node.parameters.get('on').linearRampToValueAtTime(on, at)
    node.parameters.get('frequency').exponentialRampToValueAtTime(f, at)
    node.parameters.get('min').linearRampToValueAtTime(range.min, at)
    node.parameters.get('max').linearRampToValueAtTime(range.max, at)

    wavetable.patch(tag, plug)
    dds.patch(tag, plug)
  })
}

export function tearDown () {
}

export function stop () {
  if (wavetable) {
    wavetable.stop()
  }

  if (dds) {
    dds.stop()
  }

  recorder.stop()
}

export function regenerate () {
  if (wavetable != null) {
    wavetable.regenerate()
  }
}

export function source (src) {
  const ramp = function (node, value) {
    const volume = node.parameters.get('volume')

    volume.cancelScheduledValues(0)
    volume.linearRampToValueAtTime(value, audioContext.currentTime + 2.5)
  }

  switch (src) {
    case 'wavetable':
      ramp(wavetable, 1)
      ramp(dds, 0.0001)
      oscillator = wavetable
      break

    case 'DDS':
      ramp(wavetable, 0.0001)
      ramp(dds, 1)
      oscillator = dds
      break
  }
}

export function setVolume (v) {
  const volume = clamp(v, 0, 1)

  if (volumeNode != null) {
    volumeNode.gain.value = volume
  }

  dispatch('changed', schema.synth, suffixes.synth.settings.volume, volume)
}

export function setGain (v) {
  const gain = clamp(v, 0, 1)

  if (audioContext && wavetable) {
    const ddg = wavetable.parameters.get('gain')

    ddg.setValueAtTime(gain, audioContext.currentTime)
  }

  if (audioContext && dds) {
    const ddg = dds.parameters.get('gain')

    ddg.setValueAtTime(gain, audioContext.currentTime)
  }

  dispatch('changed', schema.synth, suffixes.synth.settings.gain, gain)
}

export function onPlay (notes, recording) {
  wavetable.play(notes)
  dds.play(notes)

  if (recording) {
    recorder.start()
  }
}

export function onPause () {
  wavetable.pause()
  dds.pause()
  recorder.pause()
}

export function antialias (enabled) {
  if (aaFilter) {
    if (enabled) {
      aaFilter.frequency.exponentialRampToValueAtTime(8192, audioContext.currentTime + 0.250)
    } else {
      aaFilter.frequency.exponentialRampToValueAtTime(22050, audioContext.currentTime + 0.250)
    }
  }
}

export function noteOn (note) {
  let pressed = false

  if (wavetable) {
    wavetable.keyPressed(`${note}`)
    pressed = true
  }

  if (dds) {
    dds.keyPressed(`${note}`)
    pressed = true
  }

  return pressed
}

export function noteOff (note) {
  let released = false

  if (wavetable) {
    wavetable.keyReleased(`${note}`)
    released = true
  }

  if (dds) {
    dds.keyReleased(`${note}`)
    released = true
  }

  return released
}

export function isPlaying () {
  return oscillator != null && oscillator.state === 'playing'
}

export function isPaused () {
  return oscillator != null && oscillator.state === 'paused'
}

export function isStopped () {
  return oscillator != null && oscillator.state === 'stopped'
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
