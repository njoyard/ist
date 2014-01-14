---
layout: default
id: devel
---

Development
===========

Source code
-----------

The source code for ist.js is accessible on [GitHub][master]. The [master branch][master] contains the latest released (and hopefully stable) version, while the [devel branch][devel] features the latest developments but may be unstable.

You can also directly grab the source code as a [zip archive][zip] or a [tar.gz archive][targz].

Building
--------

### Installing build dependencies

You will need make, [nodejs][nodejs] and npm to build or test ist.js.  Just clone the repository or download a source tarball, and run `npm install` from the repository root to install build dependencies.  The following dependencies are installed:

* [pegjs][pegjs] to build the template parser
* [requirejs][requirejs] to build ist.js components into a single file and to run tests
* [karma][karma] to run the test suite, including support for Chrome and Firefox
* [karma-opera-launcher][karma-opera-launcher] to run the test suite on Opera
* [karma-sauce-launcher][karma-sauce-launcher] to run the test suite on [Sauce Labs][saucelabs].  This is only used when running tests from [Travis][travis].

### Building

Run `make` from the repository root to build both ist.js and the minified version.  You can also run `make ist` or `make ist-min` to only build one version at a time.  Output files are created in the repository root.

### Testing

ist.js includes a thorough test suite which uses [Karma][karma] and [Jasmine][jasmine].  There are two ways to run the test suite from a local repository clone:

* `make test` runs the test suite with PhantomJS, Chrome, Firefox and Opera, and then exits.  You must have both those browsers installed for this to succeed (except for PhantomJS, which is built-in with Karma).
* `make test-dev` launches Karma but does not launch any browsers.  You can then point any browser to http://localhost:9876/ to run the test suite with this browser.

Compatibility
-------------

ist.js builds are tested automatically on [Travis][travis] with [Sauce Labs][saucelabs].

[![Build Status](https://travis-ci.org/njoyard/ist.png?branch=master)][travis]

[![Selenium Test Status](https://saucelabs.com/browser-matrix/istjs.svg)][saucelabs]

Contributing
------------

Don't hesitate to [report bugs][issues] on GitHub, even the little hitches _do_ matter.  You can also fork ist.js and send me pull requests.  Also please feel free to contact me as [@njoyard on twitter][twitter].

[devel]: https://github.com/njoyard/ist/tree/devel
[master]: https://github.com/njoyard/ist/tree/master
[zip]: https://github.com/njoyard/ist/archive/master.zip
[targz]: https://github.com/njoyard/ist/archive/master.tar.gz
[issues]: https://github.com/njoyard/ist/issues
[twitter]: http://twitter.com/njoyard
[nodejs]: http://nodejs.org/
[pegjs]: http://pegjs.majda.cz/
[requirejs]: http://requirejs.org/
[jasmine]: http://pivotal.github.com/jasmine/
[karma]: http://karma-runner.github.io/
[karma-opera-launcher]: https://github.com/karma-runner/karma-opera-launcher
[karma-sauce-launcher]: https://github.com/karma-runner/karma-sauce-launcher
[saucelabs]: https://saucelabs.com/u/istjs
[travis]: https://travis-ci.org/njoyard/ist
