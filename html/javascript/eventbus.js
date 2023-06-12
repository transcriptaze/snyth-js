import { filters } from './schema.js'

class EventBus extends EventTarget {
  constructor () {
    super()

    this.change = {
      handlers: new Set(),
      filters: new Map()
    }

    this.changed = {
      handlers: new Set(),
      filters: new Map()
    }

    this.addEventListener('change', (e) => {
      this.onChange(e)
    })

    this.addEventListener('changed', e => {
      this.onChanged(e)
    })
  }

  subscribe (tag, handler, filter) {
    if (tag === 'change') {
      this.change.handlers.add(handler)

      if (filter == null) {
        this.change.filters.set(handler, filters.any)
      } else {
        this.change.filters.set(handler, filter)
      }
    } else if (tag === 'changed') {
      this.changed.handlers.add(handler)

      if (filter == null) {
        this.changed.filters.set(handler, filters.any)
      } else {
        this.changed.filters.set(handler, filter)
      }
    } else {
      this.addEventListener(tag, handler)
    }
  }

  unsubscribe (tag, handler, filter) {
    if (tag === 'change') {
      this.change.handlers.delete(handler)
      this.change.filters.delete(handler)
    } else if (tag === 'changed') {
      this.changed.handlers.delete(handler)
      this.changed.filters.delete(handler)
    } else {
      this.removeEventListener(tag, handler)
    }
  }

  onChange (event) {
    this.dispatch(event, this.change.handlers, this.change.filters)
  }

  onChanged (event) {
    this.dispatch(event, this.changed.handlers, this.changed.filters)
  }

  dispatch (event, handlers, filters) {
    Array.from(handlers)
      .filter((h) => event.detail.oid.match(filters.get(h)))
      .forEach((h) => h(event))
  }
}

const eventBus = new EventBus()

export function subscribe (tag, handler, filter) {
  eventBus.subscribe(tag, handler, filter)
}

export function unsubscribe (tag, handler) {
  eventBus.unsubscribe(tag, handler)
}

export function publish (event) {
  eventBus.dispatchEvent(event)
}
