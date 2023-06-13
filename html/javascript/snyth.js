import * as nodes from './nodes/nodes.js'
import * as midifile from './midi/midifile.js'
import * as greensleeves from './midi/greensleeves.js'

import { synth } from './synth.js'
import { OSC } from './OSC.js'
import { ENV } from './ENV.js'
import { LFO } from './LFO.js'
import { settings } from './settings.js'

const AudioContext = window.AudioContext || window.webkitAudioContext

let audioContext

export function save () {
  settings.save()
}

export function restore (file) {
  settings.restore(file)
}

export function clear () {
  settings.clear()
}

export function initialise () {
  synth.initialise()
  OSC.initialise()
  ENV.initialise()
  LFO.initialise()
  settings.initialise()

  synth.prepare('./midi/greensleeves.mid', 'Greensleeves', greensleeves.GREENSLEEVES)
}

export async function powerOn () {
  try {
    if (!audioContext) {
      audioContext = new AudioContext()
    }

    await audioContext.resume()

    const worklets = new Map([
      ['wavetable', await wavetable(audioContext)],
      ['dds', await dds(audioContext)],
      ...await lfo(audioContext)
    ])

    synth.onPowerUp(audioContext, worklets)
  } catch (err) {
    console.error(`${err}`)
  }
}

export async function powerOff () {
  if (audioContext) {
    await audioContext.suspend()
    audioContext.close()
    audioContext = null
  }

  synth.onPowerDown()
}

export function setSlot (slot, url) {
  const f = (response) => {
    if (response.status === 200) {
      return response.blob()
    } else {
      throw new Error(response.statusText)
    }
  }

  const g = (buffer) => {
    const smf = midifile.parse(buffer)
    const title = midifile.title(smf)

    slot.title = title
    slot.url = url
  }

  if (url && url.trim() !== '') {
    get(`${url}`)
      .then(response => f(response))
      .then(blob => blob.arrayBuffer())
      .then(buffer => g(buffer))
      .catch(err => { console.log(err) })
  }
}

async function wavetable (context) {
  try {
    await audioContext.audioWorklet.addModule('/javascript/worklets/wavetable.js')

    return new nodes.WavetableNode(audioContext)
  } catch (err) {
    console.error(`${err}`)
  }

  return null
}

async function dds (context) {
  try {
    await audioContext.audioWorklet.addModule('./javascript/worklets/dds.js')

    return new nodes.DDSNode(audioContext)
  } catch (err) {
    console.error(`${err}`)
  }

  return null
}

async function lfo (context) {
  try {
    await audioContext.audioWorklet.addModule('./javascript/worklets/lfo.js')

    return new Map([
      ['lfo.1', new nodes.LFONode(audioContext, 'lfo.1')],
      ['lfo.2', new nodes.LFONode(audioContext, 'lfo.2')],
      ['lfo.3', new nodes.LFONode(audioContext, 'lfo.3')],
      ['lfo.4', new nodes.LFONode(audioContext, 'lfo.4')]
    ])
  } catch (err) {
    console.error(`${err}`)
  }

  return null
}

function get (url) {
  return fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers: {
      Accept: 'application/octet-stream',
      'Accept-Encoding': 'gzip'
    }
  })
}
