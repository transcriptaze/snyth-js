export const MetaEvent = 0xff
export const TrackName = 0x03
export const EndOfTrack = 0x2f
export const Tempo = 0x51
export const NoteOff = 0x80
export const NoteOn = 0x90

export function buildTempoMap (smf) {
  const list = []

  let tick = 0
  for (const e of smf.tracks[0].events) {
    tick += e.delta
    if (e.status === MetaEvent && e.type === Tempo) {
      list.push({
        tick,
        event: {
          delta: 0,
          status: e.status,
          type: e.type,
          data: e.data
        }
      })
    }
  }

  return list
}

export function trackName (track) {
  for (const evt of track.events) {
    if (evt.status === MetaEvent && evt.type === TrackName) {
      return String.fromCharCode(...evt.data)
    }
  }

  return ''
}

export function buildTrackEvents (track, tempoMap, ppqn) {
  const events = []

  // ... initialise list with NoteOn,NoteOff and Tempo events
  let tick = 0

  for (const e of track.events) {
    tick += e.delta
    if ((e.status < 0xff) && ((e.status & 0xf0) === NoteOn)) {
      events.push({
        tick,
        event: e
      })
    }

    if ((e.status < 0xff) && ((e.status & 0xf0) === NoteOff)) {
      events.push({
        tick,
        event: e
      })
    }

    if (e.status === MetaEvent && e.type === EndOfTrack) {
      break
    }
  }

  events.push(...tempoMap)
  events.sort((p, q) => p.tick - q.tick)

  // ... assign event timestamps
  let tempo = 50000
  let at = 0

  for (const e of events) {
    at += 1000 * e.event.delta * tempo / ppqn

    e.at = Math.round(at / 1000000) / 1000

    if (e.event.status === MetaEvent && e.event.type === Tempo) {
      tempo = 0
      e.event.data.forEach(v => {
        tempo <<= 8
        tempo += v
      })
    }
  }

  return events
}

export function buildNoteList (events) {
  const notes = new Map()

  // ... build per channel event lists
  const m = new Map()

  for (let i = 0; i < 16; i++) {
    m.set(i, [])
  }

  for (const e of events) {
    if ((e.event.status < 0xff) && ((e.event.status & 0xf0) === NoteOn)) {
      const channel = e.event.channel
      const list = m.get(channel)
      list.push(e)
      m.set(channel, list)
    }

    if ((e.event.status < 0xff) && ((e.event.status & 0xf0) === NoteOff)) {
      const channel = e.event.channel
      const list = m.get(channel)
      list.push(e)
      m.set(channel, list)
    }
  }

  m.forEach((list, channel) => {
    if (list.length === 0) {
      m.delete(channel)
    }
  })

  // ... build per channel note lists
  for (const [channel, list] of m) {
    const pending = new Map()

    notes.set(channel, [])

    for (const e of list) {
      if ((e.event.status < 0xff) && ((e.event.status & 0xf0) === NoteOn) && e.event.data[1] > 0) {
        const note = e.event.data[0]
        const velocity = e.event.data[1]

        if (!pending.has(note)) {
          pending.set(note, {
            note,
            at: e.at,
            velocity
          })
        } else {
          console.error(`NoteOn without NoteOff ${e.at} ${note}`)
        }
      }

      if ((e.event.status < 0xff) && ((e.event.status & 0xf0) === NoteOn) && e.event.data[1] === 0) {
        const note = e.event.data[0]
        const velocity = e.event.data[1]

        if (pending.has(note)) {
          const p = pending.get(note)
          const q = notes.get(channel)

          q.push({
            note: p.note,
            start: p.at,
            end: e.at,
            attack: p.velocity,
            release: velocity
          })

          notes.set(channel, q)
          pending.delete(note)
        } else {
          console.error(`NoteOff without NoteOn ${e.event}`)
        }
      }

      if ((e.event.status < 0xff) && ((e.event.status & 0xf0) === NoteOff)) {
        const note = e.event.data[0]
        const velocity = e.event.data[1]

        if (pending.has(note)) {
          const p = pending.get(note)
          const q = notes.get(channel)
          q.push({
            note: p.note,
            start: p.at,
            end: e.at,
            attack: p.velocity,
            release: velocity
          })

          notes.set(channel, q)
          pending.delete(note)
        } else {
          console.error(`NoteOff without NoteOn ${e.event}`)
        }
      }
    }
  }

  return notes
}
