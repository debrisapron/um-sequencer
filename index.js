function Sequencer(getCurrentTime, options = {}) {

  // NOTE
  // All absolute times are in seconds.
  // All musical times are in whole notes.

  //// Setup ///////////////////////////////////////////////////////////////////

  let _interval = options.interval || 0.025 // Time between ticks.
  let _lookahead = options.lookahead || 0.1 // Time to look ahead for events to schedule.
  let _useWorker = options.useWorker == null ? true : options.useWorker
  let _timerId
  let _clockWorker
  let _isPlaying = false
  let _tempo
  let _nextEventIndex
  let _nextEventTime
  let _events
  let _deltas

  if (_useWorker) {
    _clockWorker = new Worker(clockWorkerUrl())
    _clockWorker.onmessage = onTick
  }

  //// Playback ////////////////////////////////////////////////////////////////

  function init(events, options) {
    _tempo = options.tempo || 120

    // Add the loop event if present & sort the events by time.
    _events = events.slice()
    if (options.loopLength) {
      _events.push({ time: options.loopLength, loop: true })
    }
    _events.sort((a, b) => a.time - b.time)

    // For each event, get the delta time since the previous event.
    _deltas = _events.map(({ time, callback }, i, arr) => {
      return i === 0 ? time : (time - arr[i - 1].time)
    })

    // Point the sequencer to the first event.
    _nextEventIndex = 0

    // Schedule the first event to play after a tick has passed.
    _nextEventTime = getCurrentTime() + _interval + secsFromWholeNotes(_deltas[0])
  }

  // While there are notes that will need to play during the next lookahead period,
  // schedule them and advance the pointer.
  function onTick() {
    let horizon = getCurrentTime() + _lookahead
    while (_isPlaying && (_nextEventTime < horizon)) {
      dispatch()
      advance()
    }
  }

  function dispatch() {
    let callback = _events[_nextEventIndex].callback
    if (callback) { callback(_nextEventTime) }
  }

  // Move the pointer to the next note.
  function advance() {
    let loop = _events[_nextEventIndex].loop
    let isLastEvent = _nextEventIndex === _deltas.length - 1

    // If we are not looping and this is the end of the sequence, stop.
    if (isLastEvent && !loop) {
      stop()
      return
    }

    // If we are at the loop point, move it to the first note.
    _nextEventIndex = loop ? 0 : _nextEventIndex + 1
    _nextEventTime += secsFromWholeNotes(_deltas[_nextEventIndex])
  }

  function secsFromWholeNotes(whns) {
    return whns * (240 / _tempo)
  }

  //// Clock ///////////////////////////////////////////////////////////////////

  function startClock() {
    if (_useWorker) {
      _clockWorker.postMessage({ action: 'start', interval: _interval })
    } else {
      _timerId = setInterval(onTick, _interval * 1000)
    }
  }

  function stopClock() {
    if (_useWorker) {
      _clockWorker.postMessage({ action: 'stop' })
    } else {
      clearInterval(_timerId)
      _timerId = null
    }
  }

  function ClockWorker() {
    // NOTE This function runs in a separate context, so does not have access to
    // instance variables!
    let _workerTimerId
    onmessage = (e) => {
      let action = e.data.action

      if (action === 'start') {
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

  function clockWorkerUrl() {
    let blob = new Blob(
      [`(${ClockWorker.toString()})()`],
      { type: 'application/javascript' }
    )
    return URL.createObjectURL(blob)
  }

  //// API /////////////////////////////////////////////////////////////////////

  function play(events, options = {}) {
    if (_isPlaying) { stop() }
    _isPlaying = true
    init(events, options)
    startClock()
  }

  function stop() {
    if (_isPlaying) {
      _isPlaying = false
      stopClock()
    }
  }

  function changeTempo(tempo) {
    // Tempo changes may take up to [lookahead] to take effect.
    if (!_isPlaying) { return }
    _tempo = tempo
  }

  function isPlaying() {
    return _isPlaying
  }

  return { play, stop, changeTempo, isPlaying }
}

module.exports = Sequencer
