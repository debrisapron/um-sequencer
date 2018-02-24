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
  { time: 0, callback: Beep(440) },
  { time: 1, callback: Beep(440) },
  { time: 2, callback: Beep(440) },
  { time: 3, callback: Beep(880) }
], {
  tempo: 140,
  loopLength: 4
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

### Sequencer(getCurrentTime, { interval, lookahead })

Creates a sequencer object with the given clock source & timing options.

`getCurrentTime` is a function which should return the current time in seconds. The most typical source for this would be the Web Audio API `AudioContext` `currentTime` property, but it could be any high-resolution clock.

The config options are `interval`, to set the time between clock ticks, and `lookahead`, to set the window of time after a tick in which found events will be scheduled. If you do not understand these parameters, don't mess with them. For more information see [A Tale Of Two Clocks](https://www.html5rocks.com/en/tutorials/audio/scheduling/).

### sequencer.play(events, { tempo, loopLength })

Begins playback of a sequence of events with the given options.

`events` is an array of event objects each of which should have two attributes, `time`, the time in quarter-notes from the beginning of the sequence at which the event should fire, and `callback`, the function to be called at that time.

The optional config options are `tempo`, the tempo in bpm at which to play the sequence, and `loopLength`, a length in quarter-notes at which to loop the sequence. If no `loopLength` is specified, the sequence will not loop. If tempo is not specified it defaults to 120bpm.

### sequencer.changeTempo(tempo)

Changes the tempo of the sequence during playback. Note that this method has no effect if called while the sequencer is stopped.

### sequencer.isPlaying()

Returns a boolean indicating whether or not the sequencer is playing.

### sequencer.stop()

Stops playback of the sequence.

## TODO

- Change tempo during playback
- Optionally run timer in a web worker
- Handle changing sequence during playback (same length)
- Handle changing sequence during playback (different length)
