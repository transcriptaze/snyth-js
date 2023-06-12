import * as midifile from '../midi/midifile.js'
import * as eventbus from '../eventbus.js'
import * as db from '../db.js'
import { schema, suffixes, SONG, OID, anySlot } from '../schema.js'

class Playlist {
  constructor () {
    this.internal = {
      current: null
    }
  }

  get current () {
    return this.internal.current
  }

  set current (v) {
    this.internal.current = v
  }
}

class Slot {
  constructor (oid, url, title) {
    this.internal = {
      oid,
      url,
      title,
      notes: [],
      data: new Uint8Array()
    }
  }

  get oid () {
    return this.internal.oid
  }

  get url () {
    return this.internal.url
  }

  set url (v) {
    this.internal.url = v
  }

  get title () {
    return this.internal.title
  }

  set title (v) {
    this.internal.title = v
  }

  get notes () {
    return this.internal.notes
  }

  set notes (v) {
    this.internal.notes = v
  }

  get data () {
    return this.internal.data
  }

  set data (v) {
    this.internal.data = v
  }

  stash (blob, url) {
    const f = (bytes) => {
      const smf = midifile.parse(bytes)
      const song = midifile.toNotes(smf)

      this.title = song.name === '' ? url : song.name
      this.url = url
      this.notes = song.notes
      this.data = new Uint8Array(bytes)

      dispatch(`${this.oid}${suffixes.playlist.slot.url}`, {
        url: this.url,
        title: this.title
      })
    }

    return blob
      .arrayBuffer()
      .then(bytes => f(bytes))
  }

  reset () {
    this.title = ''
    this.url = ''
    this.notes = []
    this.data = new Uint8Array()

    dispatch(`${this.oid}${suffixes.playlist.slot.url}`, {
      url: this.url,
      title: this.title
    })
  }
}

const SLOT1 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.1`, '', '')
const SLOT2 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.2`, '', '')
const SLOT3 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.3`, '', '')
const SLOT4 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.4`, '', '')
const SLOT5 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.5`, '', '')
const SLOT6 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.6`, '', '')
const SLOT7 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.7`, './midi/greensleeves.mid', 'Greensleeves')
const SLOT8 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.8`, './midi/greensleeves-too.mid', 'Greensleeves Too')
const SLOT9 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.9`, './midi/take-five.mid', 'Take Five')
const SLOT10 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.10`, '', '')
const SLOT11 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.12`, '', '')
const SLOT12 = new Slot(`${schema.playlist}${suffixes.playlist.slots}.12`, '', '')

export const SLOTS = [
  SLOT1,
  SLOT2,
  SLOT3,
  SLOT4,
  SLOT5,
  SLOT6,
  SLOT7,
  SLOT8,
  SLOT9,
  SLOT10,
  SLOT11,
  SLOT12
]

export const playlist = new Playlist()
const queue = new Map()
let QID = 0

export function get (oid, file) {
  const slot = SLOTS.find((v) => v.oid === `${oid}`)

  return new Promise((resolve, reject) => {
    if (slot != null && slot.url !== '') {
      resolve(slot.url)
    } else if (file !== '' && !file.startsWith('file://')) {
      resolve(file)
    } else {
      reject(new Error('slot has no URL'))
    }
  }).then((url) => {
    if (url.startsWith('file://')) {
      return memfile(slot.title, slot.url, slot.notes, slot.data)
    }

    if (slot.notes.length > 0 || slot.data.length > 0) {
      return memfile(slot.title, slot.url, slot.notes, slot.data)
    }

    const fn = (bytes) => {
      const smf = midifile.parse(bytes)
      const song = midifile.toNotes(smf)

      return {
        name: song.name,
        file: url,
        notes: song.notes,
        data: new Uint8Array(bytes)
      }
    }

    return download(oid, url)
      .then(blob => blob.arrayBuffer())
      .then(bytes => fn(bytes))
      .catch((err) => onError(slot, err))
  })
}

export function enqueue (oid, file, title, notes, data) {
  switch (true) {
    case OID.matches(oid, anySlot):
      queue.set(oid, { oid, file, title, notes, data })
      dispatch(`${oid}${suffixes.playlist.slot.state}`, 'queued')
      break

    default:
      QID++
      queue.set(`${SONG}${suffixes.playlist.song.queueid}.${QID}`,
        {
          oid: `${SONG}${suffixes.playlist.song.queueid}.${QID}`,
          file,
          title,
          notes,
          data
        })

      dispatch(`${SONG}${suffixes.playlist.song.state}`, 'queued')
  }
}

export function unqueue (oid) {
  if (oid == null || oid === SONG) {
    [...queue.keys()]
      .filter((k) => OID.contains(k, SONG))
      .forEach((k) => queue.delete(k))

    dispatch(`${SONG}${suffixes.playlist.song.state}`, 'dequeued')
  } else if (queue.has(oid)) {
    queue.delete(oid)
    dispatch(`${oid}${suffixes.playlist.slot.state}`, 'dequeued')
  }
}

export function stash (oid, file, type) {
  const slot = SLOTS.find((v) => v.oid === `${oid}`)

  if (slot != null && type === 'file') {
    slot
      .stash(file, `file://${file.name}`)
      .then(() => save())
  }

  if (slot != null && type === 'url') {
    return download(oid, file)
      .then(blob => slot.stash(blob, file))
      .then(() => save())
      .catch((err) => onError(slot, err))
  }
}

export function reset (oid) {
  const slot = SLOTS.find((v) => v.oid === `${oid}`)

  if (slot != null) {
    slot.reset()
    queue.delete(slot.oid)
    dispatch(`${slot.oid}${suffixes.playlist.slot.state}`, 'dequeued')
    save()
  }
}

export function next () {
  const keys = [...queue.keys()]

  if (keys.length > 0) {
    const k = keys.shift()
    const v = queue.get(k)

    queue.delete(k)

    if (OID.contains(v.oid, SONG)) {
      if (keys.find((k) => OID.contains(k, SONG)) == null) {
        dispatch(`${SONG}${suffixes.playlist.song.state}`, 'dequeued')
      }
    } else {
      dispatch(`${v.oid}${suffixes.playlist.slot.state}`, 'dequeued')
    }

    return v
  }

  return null
}

export function save () {
  const object = {
    slots: []
  }

  for (const slot of SLOTS) {
    object.slots.push(
      {
        oid: slot.oid,
        url: slot.url,
        title: slot.title,
        data: Array.from(slot.data)
      })
  }

  db.store('playlist', object)
}

export function restore () {
  const map = new Map([...SLOTS].map(v => [v.oid, v]))

  try {
    const object = db.retrieve('playlist')

    if (object != null) {
      if (Object.hasOwn(object, 'slots')) {
        for (const v of object.slots) {
          if (map.has(v.oid) && v.url !== '') {
            const slot = map.get(v.oid)

            slot.url = v.url
            slot.title = v.title
            slot.data = new Uint8Array(v.data)
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
}

function download (oid, url) {
  const f = (response) => {
    if (response.status === 200) {
      return response.blob()
    } else {
      throw new Error(response.statusText)
    }
  }

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
  }).then(response => f(response))
}

function memfile (title, url, notes, data) {
  if ((notes == null || notes.length === 0) && (data != null && data.length > 0)) {
    const smf = midifile.parse(data.buffer)
    const song = midifile.toNotes(smf)

    return new Promise((resolve) => {
      resolve({
        name: song.name,
        file: url,
        notes: song.notes,
        data
      })
    })
  }

  return new Promise((resolve) => {
    resolve({
      name: title,
      file: url,
      notes,
      data
    })
  })
}

function onError (slot, err) {
  dispatch(`${slot.oid}${suffixes.playlist.slot.state}`, 'error')
}

function dispatch (oid, value) {
  eventbus.publish(new CustomEvent('changed', {
    detail: {
      oid,
      value
    }
  }))
}
