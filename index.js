function Sequencer(getCurrentTime, opts = {}) {

  // NOTE
  // All absolute times are in seconds.
  // All musical times are in quarter-notes.

  let _interval = opts.interval || 0.025 // Time between ticks.
  let _lookahead = opts.lookahead || 0.1 // Time to look ahead for events to schedule.
  let _tempo
  let _timerId
  let _nextEventIndex
  let _nextEventTime
  let _events
  let _deltas

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
    _nextEventTime += secsFromQuarterNotes(_deltas[_nextEventIndex])
  }

  // While there are notes that will need to play during the next lookahead period,
  // schedule them and advance the pointer.
  function onTick() {
    let horizon = getCurrentTime() + _lookahead
    while (isPlaying() && (_nextEventTime < horizon)) {
      dispatch()
      advance()
    }
  }

  function startClock() {
    _timerId = setInterval(onTick, _interval * 1000)
  }

  function secsFromQuarterNotes(qns) {
    return qns * (60 / _tempo)
  }

  function init(events, opts) {
    _tempo = opts.tempo || 120

    // Add the loop event if present & sort the events by time.
    _events = events.slice()
    if (opts.loopLength) {
      _events.push({ time: opts.loopLength, loop: true })
    }
    _events.sort((a, b) => a.time - b.time)

    // For each event, get the delta time since the previous event.
    _deltas = _events.map(({ time, callback }, i, arr) => {
      return i === 0 ? time : (time - arr[i - 1].time)
    })

    // Point the sequencer to the first event.
    _nextEventIndex = 0

    // Schedule the first event to play after a tick has passed.
    _nextEventTime = getCurrentTime() + _interval + secsFromQuarterNotes(_deltas[0])
  }

  //////////////////////////////////////////////////////////////////////////////

  function changeTempo(tempo) {
    // Tempo changes may take up to [lookahead] to take effect.
    if (!isPlaying()) { return }
    _tempo = tempo
  }

  function stop() {
    if (isPlaying()) {
      clearInterval(_timerId)
      _timerId = null
    }
  }

  function isPlaying() {
    return !!_timerId
  }

  function play(events, opts = {}) {
    if (isPlaying()) { stop() }
    init(events, opts)
    startClock()
  }

  return { play, isPlaying, stop, changeTempo }
}

export default Sequencer
