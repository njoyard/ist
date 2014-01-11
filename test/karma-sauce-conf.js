/*jshint node:true*/
// Karma configuration

module.exports = function(config) {
  config.set({
    basePath: '..',

    frameworks: ['jasmine', 'requirejs'],

    files: [
      'test/main.js',
      {pattern: 'ist.js', included: false},
      {pattern: 'test/lib/*.js', included: false},
      {pattern: 'test/**/*.ist', included: false},
      {pattern: 'test/usage/standalone.html', included: false},
      {pattern: 'test/**/included_*.js', included: false},
      {pattern: 'test/**/*-spec.js', included: false},
      {pattern: 'test/build/*.out.js', included: false}
    ],

    preprocessors: {
        '**/*.html': []
    },

    exclude: [],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    captureTimeout: 10000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 20000,
    singleRun: true,

    sauceLabs: {
      build: 'Travis #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')',
      startConnect: false,
      testName: 'ist.js',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
    },

    customLaunchers: {
      sl_chrome_linux:    { base: 'SauceLabs', browserName: 'chrome',  platform: 'linux' },
      sl_chrome_windows:  { base: 'SauceLabs', browserName: 'chrome',  platform: 'windows' },
      sl_chrome_osx:      { base: 'SauceLabs', browserName: 'chrome',  platform: 'OSX 10.9' },
      sl_firefox_linux:   { base: 'SauceLabs', browserName: 'firefox', platform: 'linux' },
      sl_firefox_windows: { base: 'SauceLabs', browserName: 'firefox', platform: 'windows' },
      sl_firefox_osx:     { base: 'SauceLabs', browserName: 'firefox', platform: 'OSX 10.9' },
      sl_opera_linux:     { base: 'SauceLabs', browserName: 'opera',   platform: 'linux' },
      sl_opera_windows:   { base: 'SauceLabs', browserName: 'opera',   platform: 'windows' }
    },

    browsers: [
      'sl_chrome_linux',
      'sl_chrome_windows',
      'sl_chrome_osx',
      'sl_firefox_linux',
      'sl_firefox_windows',
      'sl_firefox_osx',
      'sl_opera_linux',
      'sl_opera_windows'
    ],

    transports: ['xhr-polling']
  });
};
