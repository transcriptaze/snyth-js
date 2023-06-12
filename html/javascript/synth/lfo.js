import { suffixes } from '../schema.js'
import * as eventbus from '../eventbus.js'

export class LFO {
  constructor (oid, frequency, range, plug) {
    this.internal = {
      oid,
      on: false,
      frequency,
      range,
      plug
    }

    this.defaults = {
      on: false,
      frequency: 0.1,
      range: { min: -1, max: +1 },
      plug: null
    }
  }

  get oid () {
    return this.internal.oid
  }

  get on () {
    return this.internal.on
  }

  set on (v) {
    const [value, event] = Array.isArray(v) ? v : [v, 'changed']

    this.internal.on = value === true

    dispatch(event, this.oid, suffixes.lfo.on, this.on)
  }

  get frequency () {
    return this.internal.frequency
  }

  set frequency (v) {
    const [value, event] = Array.isArray(v) ? v : [v, 'changed']
    const f = parseFloat(value)

    if (!Number.isNaN(f)) {
      this.internal.frequency = f
      dispatch(event, this.oid, suffixes.lfo.frequency, this.frequency)
    }
  }

  get range () {
    return this.internal.range
  }

  set range (v) {
    const [value, event] = Array.isArray(v) ? v : [v, 'changed']
    const min = Number.isNaN(value.min) ? this.range.min : parseFloat(value.min)
    const max = Number.isNaN(value.max) ? this.range.max : parseFloat(value.max)

    this.internal.range = {
      min: Math.min(min, max),
      max: Math.max(min, max)
    }

    dispatch(event, this.oid, suffixes.lfo.range.min, this.range.min)
    dispatch(event, this.oid, suffixes.lfo.range.max, this.range.max)
  }

  get plug () {
    return this.internal.plug
  }

  set plug (v) {
    const [value, event] = Array.isArray(v) ? v : [v, 'changed']

    this.internal.plug = value

    dispatch(event, this.oid, suffixes.lfo.plug, this.plug)
  }

  reset () {
    this.frequency = this.defaults.frequency
  }

  serialise () {
    return {
      oid: this.oid,
      on: this.on,
      frequency: this.frequency,
      range: this.range,
      plug: this.plug
    }
  }

  deserialise (v) {
    if (v != null) {
      let on = this.on
      let frequency = this.frequency
      let min = this.range.min
      let max = this.range.max
      let plug = this.plug

      if (v.on === true) {
        on = true
      }

      if (!Number.isNaN(v.frequency)) {
        frequency = v.frequency
      }

      if (v.range != null && !Number.isNaN(v.range.min)) {
        min = parseFloat(`${v.range.min}`)
      }

      if (v.range != null && !Number.isNaN(v.range.max)) {
        max = parseFloat(`${v.range.max}`)
      }

      if (v.plug != null) {
        plug = v.plug
      }

      this.on = on
      this.frequency = frequency
      this.range = { min, max }
      this.plug = plug
    }
  }
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
