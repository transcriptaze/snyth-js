import * as midi from './midi.js'
import { NOTES } from './notes.js'

export function parse (buffer) {
  const tracks = []
  let offset = 0

  const MThd = readMThd(buffer.slice(offset))
  offset += 8
  offset += MThd.length

  for (let i = 0; i < MThd.tracks; i++) {
    const MTrk = readMTrk(buffer.slice(offset))
    offset += 8
    offset += MTrk.length

    tracks.push(MTrk)
  }

  return {
    MThd,
    tracks
  }
}

export function title (smf) {
  /* eslint-disable-next-line no-unreachable-loop */
  for (const track of smf.tracks) {
    return midi.trackName(track)
  }

  return ''
}

export function toNotes (smf) {
  const tracks = []

  // ... use Track 0 track name as song name
  const title = midi.trackName(smf.tracks[0])

  // ... build tempo map
  const ppqn = smf.MThd.division
  const tempoMap = midi.buildTempoMap(smf)

  // ... build note lists
  for (const track of smf.tracks.slice(1)) {
    const name = midi.trackName(track)
    const events = midi.buildTrackEvents(track, tempoMap, ppqn)
    const notes = midi.buildNoteList(events)

    tracks.push({
      name,
      notes
    })
  }

  // ... merge tracks and channels into note list
  const lookup = new Map(Array.from(NOTES).map(([k, v]) => [v.midi, k]))
  const notes = []

  tracks.forEach(t => {
    t.notes.forEach(list => {
      list.forEach(n => {
        if (lookup.has(n.note)) {
          notes.push({
            note: lookup.get(n.note),
            velocity: n.attack,
            start: n.start,
            end: n.end
          })
        }
      })
    })
  })

  notes.sort((p, q) => p.start - q.start)

  // ... no Stairway to Heaven
  if (title.replaceAll(/\s+|[.\-+_,;]+/gmi, '').includes('stairwaytoheaven')) {
    console.log('No Stairway to Heaven')
    return {
      name: title,
      notes: []
    }
  }

  // ... 'k, done
  return {
    name: title,
    notes
  }
}

function readMThd (buffer) {
  const view = new DataView(buffer)
  const tag = new TextDecoder().decode(buffer.slice(0, 4))
  const length = view.getUint32(4)
  const format = view.getUint16(8)
  const tracks = view.getUint16(10)
  const division = view.getUint16(12)

  return {
    tag,
    length,
    format,
    tracks,
    division
  }
}

function readMTrk (buffer) {
  const view = new DataView(buffer)
  const tag = new TextDecoder().decode(buffer.slice(0, 4))
  const length = view.getUint32(4)

  const slice = new Uint8Array(buffer.slice(8, 8 + length))
  const generator = parser(slice)
  const events = Array.from(generator)

  return {
    tag,
    length,
    events
  }
}

function * parser (bytes) {
  let runningStatus = 0x00
  let offset = 0

  const vlq = function () {
    let v = 0
    while (offset < bytes.length) {
      const b = bytes[offset]; offset++

      v = (v << 7) + (b & 0x7f)

      if ((b & 0x80) === 0) {
        break
      }
    }

    return v
  }

  const vlf = function () {
    const data = []
    let N = vlq()

    while (offset < bytes.length && N > 0) {
      data.push(bytes[offset]); offset++
      N--
    }

    return data
  }

  while (offset < bytes.length) {
    const delta = vlq()

    // ... metaevent
    if (offset < bytes.length && bytes[offset] === 0xff) {
      runningStatus = 0x00

      const status = bytes[offset]; offset++
      const type = bytes[offset]; offset++
      const data = vlf()
      const event = {
        delta,
        status,
        type,
        data
      }

      yield event
      continue
    }

    // ... sysex
    if (offset < bytes.length && (bytes[offset] === 0xf0 || bytes[offset] === 0xf7)) {
      runningStatus = 0x00

      const status = bytes[offset]; offset++
      const data = vlf()
      const event = {
        delta,
        status,
        data
      }

      yield event
      continue
    }

    // ... MIDI event
    let status = runningStatus
    if (offset < bytes.length && bytes[offset] >= 0x80 && bytes[offset] <= 0xef) {
      status = bytes[offset]; offset++
      runningStatus = status
    }

    if (status < 0x80 || status > 0xef) {
      throw new Error(`invalid MIDI event (${status})`)
    }

    const type = status & 0xf0
    const channel = status & 0x0f
    const data = []

    switch (type) {
      case 0x80:
        data.push(bytes[offset]); offset++
        data.push(bytes[offset]); offset++
        break

      case 0x90:
        data.push(bytes[offset]); offset++
        data.push(bytes[offset]); offset++
        break

      case 0xA0:
        data.push(bytes[offset]); offset++
        break

      case 0xB0:
        data.push(bytes[offset]); offset++
        data.push(bytes[offset]); offset++
        break

      case 0xC0:
        data.push(bytes[offset]); offset++
        break

      case 0xD0:
        data.push(bytes[offset]); offset++
        break

      case 0xE0:
        data.push(bytes[offset]); offset++
        data.push(bytes[offset]); offset++
        break
    }

    const event = {
      delta,
      status,
      type,
      channel,
      data
    }

    yield event
    continue
  }
}
