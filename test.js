const _ = require('lodash')
const chai = require('chai')
const Sequencer = require('./index.js')

const expect = chai.expect

const getHrTime = () => Number(process.hrtime.bigint() / 1000000000n)
const getSequencer = () => Sequencer(() => getHrTime(), { useWorker: false })
const approxEqual = (a, b) => _.round(a, 5) === _.round(b, 5)
const arrApproxEqual = (a, b) =>
  _.zip(a, b).every(([a, b]) => approxEqual(a, b))

describe('Sequencer', () => {
  it('can play a simple sequence', (done) => {
    const sequencer = getSequencer()
    let startTime
    const times = []
    const callback = (time) => times.push(time - startTime)
    const events = [
      { time: 0, callback },
      { time: 3 / 4, callback },
      { time: 1 / 4, callback },
      { time: 1 / 2, callback }
    ]
    startTime = getHrTime() + 0.025
    sequencer.play(events, { tempo: 240 })

    setTimeout(() => {
      expect(times.length).to.equal(4)
      expect(arrApproxEqual(times, [0, 1 / 4, 1 / 2, 3 / 4])).to.be.true
      done()
    }, 850)
  })

  it('can loop a sequence', (done) => {
    const sequencer = getSequencer()
    let startTime
    const times = []
    const callback = (time) => times.push(time - startTime)
    const events = [{ time: 0, callback }, { time: 1 / 4, callback }]
    startTime = getHrTime() + 0.025
    sequencer.play(events, { tempo: 240, loopLength: 1 / 2 })

    setTimeout(() => {
      sequencer.stop()
      expect(times.length).to.equal(4)
      expect(arrApproxEqual(times, [0, 1 / 4, 1 / 2, 3 / 4])).to.be.true
      done()
    }, 800)
  })
})
