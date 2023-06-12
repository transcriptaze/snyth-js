export class NoteList {
  constructor () {
    this.internal = {
      notes: new Map(),
      keys: [],
      sortkey: 'default'
    }

    makeKeys(this)
  }

  * [Symbol.iterator] () {
    const list = this.keys
    const notes = this.notes

    for (const k of list) {
      yield notes.get(k)
    }
  }

  get size () {
    return this.internal.notes.size
  }

  get empty () {
    return this.internal.notes.size === 0
  }

  get notes () {
    return this.internal.notes
  }

  get keys () {
    return this.internal.keys
  }

  set keys (v) {
    this.internal.keys = v
  }

  get sortkey () {
    return this.internal.sortkey
  }

  set sortkey (v) {
    this.internal.sortkey = v
  }

  add (...notes) {
    for (const note of notes) {
      this.internal.notes.set(note.ID, note)
    }

    makeKeys(this)
  }

  release (...notes) {
    for (const { ID, at, release } of notes) {
      const note = this.notes.get(ID)

      if (note != null) {
        note.state = 'R'
        note.release = at
        note.envelope.release = release
      }
    }
  }

  flush () {
    const complete = []

    this.notes.forEach((note) => {
      if (note.state === 'x') {
        complete.push(note.ID)
      }
    })

    if (complete.length > 0) {
      complete.forEach((k) => this.internal.notes.delete(k))
      makeKeys(this)
    }
  }

  clear () {
    this.internal.notes = new Map()
    makeKeys(this)
  }
}

function makeKeys (notelist) {
  const notes = notelist.notes
  const sortkey = `${notelist.sortkey}`
  const keys = Array.from(notes.keys())

  if (sortkey.includes('onset')) {
    keys.sort((p, q) => notes.get(p).onset - notes.get(q).onset)
  }

  if (sortkey.includes('reverse')) {
    keys.reverse()
  }

  notelist.keys = keys
}
