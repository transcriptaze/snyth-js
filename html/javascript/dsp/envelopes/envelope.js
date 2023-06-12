import { suffixes } from '../../schema.js'
import * as eventbus from '../../eventbus.js'

export class Envelope {
  constructor (type, oid, deflabel, label, text, favourite) {
    this.type = type
    this.oid = oid

    this.defaults = {
      label: deflabel,
      text,
      favourite,
      envelope: {}
    }

    this.internal = {
      label,
      text,
      favourite,
      onChange: eventbus.publish,
      onChanged: eventbus.publish
    }

    this.limits = {
      attack: {
        min: 0,
        max: 1
      },
      release: {
        min: 0,
        max: 1
      }
    }
  }

  get label () {
    if (this.internal.label.trim() !== '') {
      return this.internal.label
    } else {
      return this.defaults.label
    }
  }

  set label (v) {
    this.internal.label = v != null ? `${v}` : ''
    this.dispatch('changed', suffixes.envelope.label, this.label)
  }

  get text () {
    return this.internal.text
  }

  set text (v) {
    this.internal.text = v != null ? `${v}` : ''
    this.dispatch('changed', suffixes.envelope.description, this.text)
  }

  get favourite () {
    return Boolean(this.internal.favourite)
  }

  set favourite (v) {
    this.internal.favourite = Boolean(v)
    this.dispatch('changed', suffixes.envelope.favourite, this.favourite)
  }

  get edited () {
    return false
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChange (handler) {
    this.internal.onChange = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set onChanged (handler) {
    this.internal.onChanged = handler
  }

  dispatch (eventType, suffix, value) {
    const evt = new CustomEvent(eventType, {
      detail: {
        oid: this.oid + suffix,
        value
      }
    })

    if (eventType === 'change' && this.internal.onChange) {
      this.internal.onChange(evt)
    }

    if (eventType === 'changed' && this.internal.onChange) {
      this.internal.onChanged(evt)
    }
  }

  reset () {
    this.label = this.defaults.label
    this.text = this.defaults.text
    this.favourite = this.defaults.favourite
  }

  serialise () {
    return {}
  }

  deserialise (v) {
  }
}
