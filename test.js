// FIXME:
// Karma is garbage, use node for testing with high precision timer
import _ from 'lodash'
import chai from 'chai'
import Sequencer from './index.js'

let expect = chai.expect
let audioContext

describe('Sequencer', () => {

  before(() => {
    audioContext = window._testAudioContext ||
      (window._testAudioContext = new window.AudioContext())
  })

  it('can play a simple sequence', (done) => {
    let sequencer = Sequencer(() => audioContext.currentTime)
    let startTime
    let times = []
    let callback = (time) => times.push(time - startTime)
    let events = [
      { time: 0, callback },
      { time: 3/4, callback },
      { time: 1/4, callback },
      { time: 1/2, callback }
    ]
    startTime = audioContext.currentTime + 0.025
    sequencer.play(events, { tempo: 240 })
    setTimeout(finish, 850)

    function finish() {
      expect(times.length).to.equal(4)
      expect(arrApproxEqual(times, [0, 1/4, 1/2, 3/4])).to.be.true
      done()
    }
  })

  it('can loop a sequence', (done) => {
    let sequencer = Sequencer(() => audioContext.currentTime)
    let startTime
    let times = []
    let callback = (time) => times.push(time - startTime)
    let events = [
      { time: 0, callback },
      { time: 1/4, callback }
    ]
    startTime = audioContext.currentTime + 0.025
    sequencer.play(events, { tempo: 240, loopLength: 1/2 })
    setTimeout(finish, 800)

    function finish() {
      sequencer.stop()
      expect(times.length).to.equal(4)
      expect(arrApproxEqual(times, [0, 1/4, 1/2, 3/4])).to.be.true
      done()
    }
  })

})

function arrApproxEqual(a, b) {
  return _.zip(a, b).every(([a, b]) => approxEqual(a, b))
}

function approxEqual(a, b) {
  return _.round(a, 5) === _.round(b, 5)
}
