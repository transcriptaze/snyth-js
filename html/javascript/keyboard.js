const KEYBOARD = new Map([
  [0, ['A', 'A#', 'B']],
  [1, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [2, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [3, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [4, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [5, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [6, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [7, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']],
  [8, ['C']]
])

export class Keyboard {
  constructor (id, noteOn, noteOff) {
    this.id = id
    this.keyboard = document.querySelector(`${id} div`)
    this.noteOn = noteOn
    this.noteOff = noteOff

    const makeKey = function (note, octave) {
      const key = document.createElement('div')
      const label = document.createElement('div')

      label.innerHTML = `${note}<sub>${octave}</sub>`
      key.className = 'key'
      key.dataset.note = `${note}${octave}`
      key.appendChild(label)

      return key
    }

    KEYBOARD.forEach((keys, idx) => {
      const octave = document.createElement('div')
      octave.className = 'octave'

      keys.forEach((key) => {
        if (key.length === 1) {
          octave.appendChild(makeKey(key, idx))
        }
      })

      this.keyboard.appendChild(octave)
    })

    this.keyboard.addEventListener('mousedown', e => this.onMouseDown(e), true)
    this.keyboard.addEventListener('mouseup', e => this.onMouseUp(e), true)
    this.keyboard.addEventListener('contextmenu', e => this.onRightClick(e), false)
  }

  reset () {
    const keys = this.keyboard.querySelectorAll('div.key')

    keys.forEach(key => {
      const dataset = key.dataset

      if (dataset.note && this.noteOff && this.noteOff(key.dataset.note)) {
        delete dataset.pressed
      }
    })
  }

  onMouseDown (event) {
    event.preventDefault()

    if (event.button === 0 && event.target.classList.contains('key')) {
      const dataset = event.target.dataset

      if (!dataset.pressed || dataset.pressed !== 'yes') {
        if (dataset.note && this.noteOn && this.noteOn(event.target.dataset.note)) {
          dataset.pressed = 'yes'
        }
      }
    }

    return false
  }

  onMouseUp (event) {
    event.preventDefault()

    if (event.button === 0 && event.target.classList.contains('key')) {
      const dataset = event.target.dataset

      if (dataset.note && this.noteOff && this.noteOff(event.target.dataset.note)) {
        delete dataset.pressed
      }
    }

    return false
  }

  onRightClick (event) {
    event.preventDefault()

    if (event.target.classList.contains('key')) {
      const dataset = event.target.dataset

      if (!dataset.pressed || dataset.pressed !== 'yes') {
        if (dataset.note && this.noteOn && this.noteOn(event.target.dataset.note)) {
          dataset.pressed = 'yes'
        }
      } else {
        if (dataset.note && this.noteOff && this.noteOff(event.target.dataset.note)) {
          delete dataset.pressed
        }
      }
    }

    return false
  }
}
