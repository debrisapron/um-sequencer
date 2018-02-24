module.exports = function(config) {
  config.set({
    files: ['test.js'],
    frameworks: ['mocha'],
    browsers: ['Chrome'],
    preprocessors: {
      'test.js': ['webpack']
    },
    reporters: ['mocha'],
    mochaReporter: {
      showDiff: true
    }
  })
}
