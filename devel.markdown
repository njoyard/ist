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

You will need make, [node.js][nodejs] and [PEG.js][pegjs] to build ist.js, and optionally [UglifyJS][uglifyjs] to build the minified version.  You can get PEG.js and UglifyJS using npm.

To build ist.js, just clone the repository or download a source tarball, and run `make` from the repository root.

Testing
-------

ist.js includes a thorough test suite which uses [Jasmine][jasmine]. To run it, fire a web server from the repository root (I use [Serve][serve]) and open `tests/runtests.html` in your target web browser.

ist.js has currently been successfully tested on the following browsers:

* Chrome 18
* Firefox 13
* Opera 11
* Epiphany 3.4

Feel free to report additional working browsers so I can add them here.

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
[serve]: http://get-serve.com/
