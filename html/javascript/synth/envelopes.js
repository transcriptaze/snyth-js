import { AR } from '../dsp/envelopes/AR.js'
import { ADSR } from '../dsp/envelopes/ADSR.js'
import { schema, suffixes } from '../schema.js'
import * as eventbus from '../eventbus.js'
import * as db from '../db.js'

const state = {
  selected: null
}

export function select (oid) {
  const env = ENVELOPES.find((e) => e.oid === oid)

  if (env != null) {
    state.selected = env.oid

    const evt = new CustomEvent('changed', {
      detail: {
        oid: `${schema.synth}${suffixes.synth.envelope.oid}`,
        value: env.oid
      }
    })

    eventbus.publish(evt)
  }
}

export function selected () {
  return state.selected == null ? DEFAULT : get(state.selected)
}

// FIXME hardcoded OID
export function get (oid) {
  if (oid.match(/^0.3.[0-9]+$/)) {
    return ENVELOPES.find((e) => e.oid === oid)
  } else {
    return ENVELOPES.find((e) => oid.startsWith(`${e.oid}.`))
  }
}

export function next (oid) {
  const ix = ENVELOPES.findIndex((e) => e.oid === oid)
  const next = (ix + 1) % ENVELOPES.length

  return ENVELOPES[next]
}

export function favourite (oid, favourited) {
  const env = ENVELOPES.find((e) => e.oid === oid)

  if (env != null) {
    env.favourite = favourited
  }
}

export function pack (envelope, array) {
  if (envelope && envelope.type) {
    switch (envelope.type) {
      case 'AR':
        envelope.pack(array)
        return

      case 'ADSR':
        envelope.pack(array)
        return
    }
  }

  array[OFFSET] = 0
}

export function unpack (array) {
  switch (array[OFFSET]) {
    case 1:
      return AR.unpack(array)

    case 2:
      return ADSR.unpack(array)
  }

  return DEFAULT
}

export function save () {
  const objects = ENVELOPES
    .filter((v) => v !== DEFAULT)
    .map((v) => v.serialise())

  db.store('envelopes', objects)
}

export function restore () {
  try {
    const objects = db.retrieve('envelopes')

    if (objects != null) {
      for (const [ix, v] of objects.entries()) {
        if (ix < 12 && v.type) {
          ENVELOPES[ix].deserialise(v)
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export function set ({ oid, attack, decay, sustain, release }) {
  for (const env of ENVELOPES) {
    if (env.oid === oid) {
      env.attack = attack
      env.decay = decay
      env.sustain = sustain
      env.release = release

      select(oid)
    }
  }
}

export function reset (oid) {
  const env = ENVELOPES.find((e) => e.oid === oid)

  if (env != null) {
    env.reset()
  }
}

const OFFSET = 48

const FLUGELHORN = new AR(`${schema.envelope}.1`, 'F', 'F', "Vaguely like a sort of cockney flugelhorn'ish thing", 1.0, 0.5, true)
const BELLS = new AR(`${schema.envelope}.2`, 'B', 'B', 'Untubular bells', 0, 0.5, true)
const CATHEDRAL_ORGAN = new AR(`${schema.envelope}.3`, 'O', 'O', 'Ye oldde chyrchhe orgynne', 1.0, 1.0, true)
const CHURCH_ORGAN = new ADSR(`${schema.envelope}.5`, 'O2', 'O2', 'Also an organ but more cathedrally', 0.114, 0.203, 0.74, 0.552, true)

export const DEFAULT = new AR(`${schema.envelope}.0`, '', '', '', 0.05, 0.1, true)

export const ENVELOPES = [
  FLUGELHORN,
  BELLS,
  CATHEDRAL_ORGAN,
  new AR(`${schema.envelope}.4`, '4', '', '', 0, 0, false),

  CHURCH_ORGAN,
  new ADSR(`${schema.envelope}.6`, '6', '', '', 0, 0, 1, 0.0, false),
  new ADSR(`${schema.envelope}.7`, '7', '', '', 0, 0, 1, 0.0, false),
  new ADSR(`${schema.envelope}.8`, '8', '', '', 0, 0, 1, 0.0, false),

  new ADSR(`${schema.envelope}.9`, '9', '', '', 0, 0, 1, 0.0, false),
  new ADSR(`${schema.envelope}.10`, '10', '', '', 0, 0, 1, 0.0, false),
  new ADSR(`${schema.envelope}.11`, '11', '', '', 0, 0, 1, 0.0, false),
  new ADSR(`${schema.envelope}.12`, '12', '', '', 0, 0, 1, 0.0, false),

  DEFAULT
]
