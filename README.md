# um-sequencer

A simple and generic JavaScript music sequencer library with no dependencies.

## Installation

`yarn add um-sequencer` or `npm install um-sequencer --save`

## Example

```
import Sequencer from 'um-sequencer'

let audioContext = new window.AudioContext()
let sequencer = Sequencer(() => audioContext.currentTime)

sequencer.play([
  { time:   0, callback: Beep(440) },
  { time: 1/4, callback: Beep(440) },
  { time: 1/2, callback: Beep(440) },
  { time: 3/4, callback: Beep(880) }
], {
  tempo: 140,
  loopLength: 1
})

setTimeout(sequencer.stop, 5000)

function Beep(freq) {
  return (time) => {
    let osc = audioContext.createOscillator()
    osc.frequency.value = freq
    osc.connect(audioContext.destination)
    osc.start(time)
    osc.stop(time + 0.1)
  }
}
```

## API

### Sequencer(getCurrentTime, [options])

Creates a sequencer object with the given clock source & timing options.

`getCurrentTime` is a function which should return the current time in seconds. The most typical source for this would be the Web Audio API `AudioContext` `currentTime` property, but it could be any high-resolution clock.

`options` is a config object which may include:

- `interval`, the time between clock ticks in seconds. Defaults to 0.025.
- `lookahead`, the window of time after a tick in which found events will be scheduled. Defaults to 0.1.
- `useWorker`, whether or not to run the clock in a web worker. Defaults to true.

If you do not understand these options, don't mess with them. For more information see [A Tale Of Two Clocks](https://www.html5rocks.com/en/tutorials/audio/scheduling/).

### sequencer.play(events, [options])

Begins playback of a sequence of events with the given options.

`events` is an array of event objects each of which must include two attributes:

- `time`, the **musical** time in [whole notes](https://en.wikipedia.org/wiki/Whole_note) at which the event should fire.
- `callback`, the function to be called at the given time.

`options` is a config object which may include:

- `tempo`, the tempo in beats per minute. Defaults to 120bpm.
- `loopLength`, a length in whole notes at which to loop the sequence. If omitted, the sequence will not loop.
- `onStop`, a callback which will be called when the sequence stops playback. The callback will be passed a string, either 'stopped' if the `stop()` method was called or 'finished' if the end of the sequence was reached and no `loopLength` was specified.

### sequencer.changeTempo(tempo)

Changes the tempo of the sequence during playback. Note that this method has no effect if called while the sequencer is stopped.

### sequencer.isPlaying()

Returns a boolean indicating whether or not the sequencer is playing.

### sequencer.stop()

Stops playback of the sequence.
