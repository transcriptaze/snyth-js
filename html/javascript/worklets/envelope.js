export function apply (env, t, note, sn) {
  return ADSR(t, note, sn, env.attack, env.decay, env.sustain, env.release)
}

function ADSR (t, note, sn, attack, decay, sustain, release) {
  let m = 1

  switch (note.state) {
    case 'x':
      m = 0
      break

    case 'A':
      { const dt = t - note.onset

        if (dt <= attack) {
          m = clamp(dt / attack, 0, 1, 1)
        } else {
          m = sustain + clamp(1 - ((dt - attack) / decay), 0, 1, 1) * (1 - sustain)
        }
      }
      break

    case 'R':
      m = note.level * clamp(1 - (t - note.release) / release, 0, 1, 0)
      break
  }

  if (note.state === 'A') {
    note.level = m
  } else if (note.state === 'R' && m <= 0.0) {
    note.state = 'x'
  }

  return {
    snl: sn.left.map((v) => m * v),
    snr: sn.right.map((v) => m * v)
  }
}

function clamp (v, min, max, defval) {
  const m = Math.min(Math.max(v, min), max)

  return Number.isNaN(m) ? defval : m
}

function _log (v) {
  if (_log.count == null) {
    _log.count = 0
  }

  if ((_log.count % 1000) === 0) {
    console.log(v)
  }

  _log.count++
}
