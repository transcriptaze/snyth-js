export class AudioRecorder {
  constructor () {
    this.internal = {
      context: null,
      recorder: null,
      song: 'snyth',

      onAvailable: null,
      recording: false
    }

    this.audio = []
    this.blob = null
  }

  initialise (ctx, ...sources) {
    this.internal.context = ctx
    this.internal.stream = ctx.createMediaStreamDestination()
    this.internal.recorder = new MediaRecorder(this.internal.stream.stream)

    for (const source of sources) {
      source.connect(this.internal.stream)
    }

    this.internal.recorder.ondataavailable = (e) => {
      this.audio.push(e.data)
    }

    this.internal.recorder.onstop = (e) => {
      const blob = new Blob(this.audio, { type: 'audio/ogg; codecs=opus' })

      this.blob = blob

      if (this.internal.onAvailable != null) {
        this.internal.onAvailable(blob, this.song)
      }
    }
  }

  get song () {
    return this.internal.song
  }

  set song (v) {
    this.internal.song = v
  }

  get recording () {
    return this.internal.recording
  }

  get paused () {
    if (this.internal.recorder) {
      return this.internal.recorder.state === 'paused'
    }

    return false
  }

  start () {
    this.audio = []
    this.blob = null

    this.reset()

    if (this.internal.recorder) {
      if (this.paused) {
        this.internal.recorder.resume()
      } else {
        this.internal.recorder.start()
      }

      this.internal.recording = true
    }
  }

  stop () {
    if (this.internal.recorder) {
      this.internal.recorder.stop()
    }

    this.internal.recording = false
  }

  pause () {
    if (this.internal.recorder && this.recording) {
      this.internal.recorder.pause()
    }
  }

  resume () {
    if (this.internal.recorder) {
      this.internal.recorder.start()
    }
  }

  reset () {
    this.audio = []
    this.blob = null

    if (this.internal.onAvailable != null) {
      this.internal.onAvailable(null, '')
    }
  }

  /* eslint-disable-next-line accessor-pairs */
  set onavailable (handler) {
    this.internal.onAvailable = handler
  }
}

export const recorder = new AudioRecorder()
