const _ = require('lodash')
const chai = require('chai')
const Sequencer = require('./index.js')

const expect = chai.expect

const getHrTime = () => Number(process.hrtime.bigint() / 1000000n) / 1000
const getSequencer = () => Sequencer(() => getHrTime(), { useWorker: false })
const approxEqual = (a, b) => _.round(a, 5) === _.round(b, 5)
const arrApproxEqual = (a, b) =>
  _.zip(a, b).every(([a, b]) => approxEqual(a, b))

describe('Sequencer', () => {
  it('can play a simple sequence', (done) => {
    const sequencer = getSequencer()
    let startTime
    let stopReason
    const times = []
    const callback = (time) => times.push(time - startTime)
    const events = [
      { time: 0, callback },
      { time: 3 / 4, callback },
      { time: 1 / 4, callback },
      { time: 1 / 2, callback }
    ]
    startTime = getHrTime() + 0.1 // By default sequencer starts after 0.1s
    sequencer.play(events, {
      tempo: 240,
      onStop: (reason) => (stopReason = reason)
    })

    setTimeout(() => {
      expect(stopReason).to.equal('finished')
      expect(times.length).to.equal(4)
      expect(arrApproxEqual(times, [0, 1 / 4, 1 / 2, 3 / 4])).to.be.true
      done()
    }, 900) // Includes sequencer start time of 0.1s
  })

  it('can loop a sequence', (done) => {
    const sequencer = getSequencer()
    let startTime
    const times = []
    const callback = (time) => times.push(time - startTime)
    const events = [{ time: 0, callback }, { time: 1 / 4, callback }]
    startTime = getHrTime() + 0.1 // By default sequencer starts after 0.1s
    sequencer.play(events, { tempo: 240, loopLength: 1 / 2 })

    setTimeout(() => {
      sequencer.stop()
      expect(times.length).to.equal(4)
      expect(arrApproxEqual(times, [0, 1 / 4, 1 / 2, 3 / 4])).to.be.true
      done()
    }, 900) // Includes sequencer start time of 0.1s
  })

  it('can delay the start of a sequence', (done) => {
    const sequencer = getSequencer()
    let startTime
    const times = []
    const callback = (time) => times.push(time - startTime)
    const events = [{ time: 0, callback }, { time: 1 / 4, callback }]
    startTime = getHrTime()
    sequencer.play(events, {
      tempo: 240,
      loopLength: 1 / 2,
      startTime: startTime + 1 / 2
    })

    setTimeout(() => {
      sequencer.stop()
      expect(times.length).to.equal(3)
      expect(arrApproxEqual(times, [1 / 2, 3 / 4, 1])).to.be.true
      done()
    }, 1100) // Includes sequencer start time of 0.1s
  })
})
