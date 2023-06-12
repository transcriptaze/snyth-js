import { snNode } from './sn.js'
import { pack } from '../synth/synth.js'

export class DDSNode extends snNode {
  constructor (context) {
    super(context, 'dds')
  }

  /* eslint-disable-next-line accessor-pairs */
  set (parameters, envelope) {
    if (this.sab.parameters != null) {
      const version = this.sab.version + 1
      const pages = this.sab.pages < 1 ? 1 : this.sab.pages
      const page = version % pages

      pack(version, parameters, envelope, this.sab.parameters, page)

      this.sab.version = version

      this.port.postMessage({
        message: 'parameters.updated',
        version
      })
    }
  }
}
