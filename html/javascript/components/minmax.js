export class MinMax extends HTMLElement {
  static get observedAttributes () {
    return ['tag', 'min', 'max', 'default', 'value', 'colour', 'color']
  }

  constructor () {
    super()

    this.internal = {
      tag: '',
      value: { min: -1, max: 1 },
      min: -1,
      max: +1,
      defval: 0,
      onChange: null,
      onChanged: null,

      colour: '#4eccff80'
    }

    this.drag = {
      dragging: false,
      marker: '',
      start: { x: 0, y: 0, value: 0 },
      scale: { m: 3.826, c: -262 }
    }

    const template = document.querySelector('#template-minmax')
    const stylesheet = document.createElement('link')
    const content = template.content
    const shadow = this.attachShadow({ mode: 'open' })
    const clone = content.cloneNode(true)

    stylesheet.setAttribute('rel', 'stylesheet')
    stylesheet.setAttribute('href', './css/components.css')

    shadow.appendChild(stylesheet)
    shadow.appendChild(clone)
  }

  connectedCallback () {
    const shadow = this.shadowRoot
    const overlay = shadow.querySelector('div.overlay')

    overlay.oncontextmenu = (event) => onReset(this, event)

    overlay.onpointerdown = (event) => {
      if (onPointerDown(this, event)) {
        overlay.setPointerCapture(event.pointerId)

        overlay.onpointermove = (event) => {
          if (onPointerMove(this, event)) {
            if (this.internal.onChange != null) {
              this.internal.onChange(this.tag, this.value)
            }
          }
        }
      }
    }

    overlay.onpointerup = (event) => {
      if (onPointerUp(this, event)) {
        if (this.internal.onChanged != null) {
          this.internal.onChanged(this.tag, this.value)
        }
      }
    }
  }

  disconnectedCallback () {
  }

  adoptedCallback () {
  }

  attributeChangedCallback (name, from, to) {
    if (name === 'tag') {
      this.tag = to
    }

    if (name === 'min') {
      this.min = to
    }

    if (name === 'max') {
      this.max = to
    }

    if (name === 'default') {
      this.defval = to
    }

    if (name === 'value') {
      this.value = to
    }

    if (name === 'colour' || name === 'color') {
      this.colour = to
    }
  }

  get tag () {
    return this.internal.tag
  }

  set tag (v) {
    this.internal.tag = v
  }

  get min () {
    return this.internal.min
  }

  set min (v) {
    const val = Number.parseFloat(v)

    if (val && !Number.isNaN(val)) {
      this.internal.min = Math.round(val * 100) / 100
      redraw(this)
    }
  }

  get max () {
    return this.internal.max
  }

  set max (v) {
    const val = Number.parseFloat(v)

    if (val && !Number.isNaN(val)) {
      this.internal.max = Math.round(val * 100) / 100
      redraw(this)
    }
  }

  get default () {
    return this.internal.defval
  }

  set default (v) {
    const val = Number.parseFloat(v)

    if (val && !Number.isNaN(val)) {
      this.internal.defval = Math.round(val * 100) / 100
    }
  }

  get value () {
    return this.internal.value
  }

  set value (v) {
    if (v && !Number.isNaN(v.min) && !Number.isNaN(v.max)) {
      const min = clamp(v.min, this.min, this.internal.value.max)
      const max = clamp(v.max, this.internal.value.min, this.max)

      this.internal.value = {
        min: Math.min(min, max),
        max: Math.max(min, max)
      }

      redraw(this)
    }
  }

  get colour () {
    return this.internal.colour
  }

  set colour (v) {
    this.internal.colour = v
  }

  get color () {
    return this.internal.colour
  }

  set color (v) {
    this.internal.colour = v
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchange (handler) {
    this.internal.onChange = handler
  }

  /* eslint-disable-next-line accessor-pairs */
  set onchanged (handler) {
    this.internal.onChanged = handler
  }

  reset () {
    this.value = {
      min: this.min,
      max: this.max
    }
  }
}

function onReset (minmax, event) {
  event.preventDefault()

  minmax.reset()

  if (minmax.internal.onChanged != null) {
    minmax.internal.onChanged(this)
  }

  return true
}

function onPointerDown (minmax, event) {
  const shadow = minmax.shadowRoot
  const svg = shadow.querySelector('svg')
  const overlay = event.currentTarget
  const v = minmax.value

  const svgHeight = svg.getAttribute('viewBox').split(' ')[3]
  const m = svgHeight / overlay.offsetHeight
  const c = -svgHeight / 2

  const f = function () {
    const y = overlay.offsetHeight - event.offsetY
    const h = overlay.offsetHeight
    const minY = h * (v.min - minmax.min) / (minmax.max - minmax.min)
    const maxY = h * (v.max - minmax.min) / (minmax.max - minmax.min)
    const dmin = Math.abs(y - minY)
    const dmax = Math.abs(y - maxY)

    if (dmin <= 16 && dmax < 16 && y > maxY) {
      return 'max'
    } else if (dmin <= 16 && dmax < 16 && y < minY) {
      return 'min'
    } else if (dmax <= 16) {
      return 'max'
    } else if (dmin <= 16) {
      return 'min'
    }

    return ''
  }

  if (event.button === 0) {
    const marker = f()

    if (marker !== '') {
      minmax.drag.dragging = true
      minmax.drag.marker = marker
      minmax.drag.start = { x: event.offsetX, y: event.offsetY, value: { min: v.min, max: v.max } }
      minmax.drag.scale = { m, c }
      return true
    }
  }

  return false
}

function onPointerMove (minmax, event) {
  const overlay = event.currentTarget
  const h = overlay.offsetHeight

  if (minmax.drag.dragging) {
    const dy = event.offsetY - minmax.drag.start.y
    const dv = -(dy / h) * (minmax.max - minmax.min)

    switch (minmax.drag.marker) {
      case 'min':
        minmax.value = {
          min: minmax.drag.start.value.min + dv,
          max: minmax.drag.start.value.max
        }
        return true

      case 'max':
        minmax.value = {
          min: minmax.drag.start.value.min,
          max: minmax.drag.start.value.max + dv
        }
        return true
    }
  }

  return false
}

function onPointerUp (minmax, event) {
  if (minmax.drag.dragging) {
    minmax.drag.dragging = false
    return true
  }

  return false
}

function redraw (minmax) {
  try {
    const shadow = minmax.shadowRoot
    const svg = shadow.querySelector('svg')

    const colour = svg.getElementById('colour')
    const extent = svg.getElementById('extent')
    const range = svg.getElementById('range')
    const top = svg.getElementById('top')
    const bottom = svg.getElementById('bottom')

    const offset = parseFloat(extent.getAttribute('y'))
    const height = parseFloat(extent.getAttribute('height'))
    const m = -height / (minmax.max - minmax.min)
    const c = offset - m

    const y1 = m * minmax.value.min + c
    const y2 = m * minmax.value.max + c
    const y = Math.min(y1, y2)
    const h = Math.max(y1, y2) - y

    range.setAttribute('y', `${y}`)
    range.setAttribute('height', `${h}`)
    colour.setAttribute('stroke', `${minmax.colour}`)

    top.setAttribute('transform', `translate(0 ${y + 232})`)
    bottom.setAttribute('transform', `translate(0 ${y + 232 + h - 464})`)
  } catch (err) {
    console.log(err)
  }
}

function clamp (v, min, max) {
  return Math.min(Math.max(v, min), max)
}

customElements.define('snyth-minmax', MinMax)
