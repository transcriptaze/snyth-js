const MAX_VERSION = 1048575

export class LFONode extends AudioWorkletNode {
  constructor (context, name) {
    super(context, name, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })

    this.port.onmessage = this.onMessage.bind(this)
    this.wavetable = []
    this.version = 0
    this.table = null
  }

  onMessage (event) {
    if (event.data.message === 'wavetable') {
      const sab = event.data.sab
      const N = event.data.N
      const pages = event.data.pages
      const pagesize = N * Float32Array.BYTES_PER_ELEMENT
      const wavetable = []

      for (let page = 0; page < pages; page++) {
        wavetable.push(new Float32Array(sab, page * pagesize, N))
      }

      this.wavetable = wavetable
      this.version = event.data.version

      if (this.table != null) {
        load(this, this.table)
      }
    }
  }

  load (table) {
    this.table = table

    if (this.wavetable.length > 0) {
      return new Promise(() => {
        this.version = load(this, table)
      })
    }
  }
}

function load (node, table) {
  const pages = node.wavetable.length
  const page = (node.version + 1) % pages
  const wavetable = node.wavetable[page]
  const version = (node.version + 1) % MAX_VERSION

  wavetable.set(table)

  node.port.postMessage({
    message: 'wavetable',
    version
  })

  return version
}
