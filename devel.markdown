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

You will need [nodejs][nodejs] and npm to build ist.js.  Just clone the repository or download a source tarball, run `npm install` from the repository root to install build dependencies, and then `make` to build ist.js.

Testing
-------

ist.js includes a thorough test suite which uses [Karma][karma] and [Jasmine][jasmine]. To launch the test suite, run `make tests` from the repository root.

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
[uglifyjs]: https://github.com/mishoo/UglifyJS
[jasmine]: http://pivotal.github.com/jasmine/
[karma]: http://karma-runner.github.io/
