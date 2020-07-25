const Sequencer = (getCurrentTime, options = {}) => {
  // NOTE
  // All absolute times are in seconds.
  // All musical times are in whole notes.

  //// Setup ///////////////////////////////////////////////////////////////////

  const _interval = options.interval || 0.025 // Time between ticks.
  const _lookahead = options.lookahead || 0.1 // Time to look ahead for events to schedule.
  const _useWorker = options.useWorker == null ? true : options.useWorker
  const _clockWorker = _useWorker && new Worker(clockWorkerUrl())
  if (_clockWorker) {
    _clockWorker.onmessage = onTick
  }

  let _timerId
  let _isPlaying = false
  let _tempo
  let _onStop
  let _nextEventIndex
  let _nextEventTime
  let _events
  let _deltas

  //// Playback ////////////////////////////////////////////////////////////////

  const init = (events, options) => {
    _tempo = options.tempo || 120
    _onStop = options.onStop || (() => {})

    // Add the loop event if present & sort the events by time.
    _events = events.slice()
    if (options.loopLength) {
      _events.push({ time: options.loopLength, loop: true })
    }
    _events.sort((a, b) => a.time - b.time)

    // For each event, get the delta time since the previous event.
    _deltas = _events.map(
      ({ time, callback }, i, arr) => (i === 0 ? time : time - arr[i - 1].time)
    )
  }

  // While there are notes that will need to play during the next lookahead period,
  // schedule them and advance the pointer.
  const onTick = () => {
    const horizon = getCurrentTime() + _lookahead
    while (_isPlaying && _nextEventTime < horizon) {
      dispatch()
      advance()
    }
  }

  const dispatch = () => {
    const callback = _events[_nextEventIndex].callback
    if (callback) {
      callback(_nextEventTime)
    }
  }

  // Move the pointer to the next note.
  const advance = () => {
    const loop = _events[_nextEventIndex].loop
    const isLastEvent = _nextEventIndex === _deltas.length - 1

    // If we are not looping and this is the end of the sequence, stop.
    if (isLastEvent && !loop) {
      stopInternal('finished')
      return
    }

    // If we are at the loop point, move it to the first note.
    _nextEventIndex = loop ? 0 : _nextEventIndex + 1
    _nextEventTime += secsFromWholeNotes(_deltas[_nextEventIndex])
  }

  const secsFromWholeNotes = (whns) => whns * (240 / _tempo)

  //// Clock ///////////////////////////////////////////////////////////////////

  const startClock = () => {
    if (_useWorker) {
      _clockWorker.postMessage({ action: 'start', interval: _interval })
    } else {
      // Run first tick on next event loop
      setTimeout(onTick)
      // Run subsequent ticks every _interval seconds
      _timerId = setInterval(onTick, _interval * 1000)
    }
  }

  const stopClock = () => {
    if (_useWorker) {
      _clockWorker.postMessage({ action: 'stop' })
    } else {
      clearInterval(_timerId)
      _timerId = null
    }
  }

  const ClockWorker = () => {
    // NOTE This function runs in a separate context, so does not have access to
    // instance variables!
    let _workerTimerId

    onmessage = (e) => {
      const action = e.data.action

      if (action === 'start') {
        // Run first tick on next event loop
        setTimeout(() => {
          postMessage({ action: 'tick' })
        })
        // Run subsequent ticks every e.data.interval seconds
        _workerTimerId = setInterval(() => {
          postMessage({ action: 'tick' })
        }, e.data.interval * 1000)
      }

      if (action === 'stop') {
        clearInterval(_workerTimerId)
        _workerTimerId = null
      }
    }
  }

  const clockWorkerUrl = () => {
    const blob = new Blob([`(${ClockWorker.toString()})()`], {
      type: 'application/javascript'
    })
    return URL.createObjectURL(blob)
  }

  const stopInternal = (reason) => {
    if (_isPlaying) {
      _isPlaying = false
      stopClock()
    }
    _onStop(reason)
  }

  //// API /////////////////////////////////////////////////////////////////////

  const play = (events, options = {}) => {
    if (_isPlaying) {
      stop()
    }
    _isPlaying = true
    init(events, options)

    // Point the sequencer to the first event.
    _nextEventIndex = 0

    // Schedule the first event.
    const { startTime = getCurrentTime() + _lookahead } = options
    _nextEventTime = startTime + secsFromWholeNotes(_deltas[0])

    startClock()
  }

  const stop = () => stopInternal('stopped')

  const changeTempo = (tempo) => {
    // Tempo changes may take up to [lookahead] to take effect.
    if (!_isPlaying) {
      return
    }
    _tempo = tempo
  }

  const isPlaying = () => _isPlaying

  return { play, stop, changeTempo, isPlaying }
}

module.exports = Sequencer
