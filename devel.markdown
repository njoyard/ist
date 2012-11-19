---
layout:default
id:devel
---

Development
===========

Source code
-----------

The source code for ist.js is accessible on [github][2]. The [master branch][2] contains the latest released (and hopefully stable) version, while the [devel branch][1] features the latest developments but may be unstable.

You can also directly grab the source code as a [zip archive][3] or a [tar.gz archive][4].

Building
--------

You will need make, [node.js][7] and [PEG.js][8] to build ist.js, and optionally [UglifyJS][9] to build the minified version.  You can get PEG.js and UglifyJS using npm.

To build ist.js, just clone the repository or download a source tarball, and run `make` from the repository root.

Testing
-------

ist.js includes a thorough test suite which uses [Jasmine][10]. To run it, fire a web server from the repository root (I use [Serve][11]) and open `tests/runtests.html` in your target web browser.

ist.js has currently been successfully tested on the following browsers:

* Chrome 18
* Firefox 13
* Opera 11
* Epiphany 3.4

Feel free to report additional working browsers so I can add them here.

Contributing
------------

Don't hesitate to [report bugs][5] on GitHub, even the little hitches _do_ matter.  You can also fork ist.js and send me pull requests.  Also please feel free to contact me as [@njoyard on twitter][6].

[1]: https://github.com/njoyard/ist/tree/devel
[2]: https://github.com/njoyard/ist/tree/master
[3]: https://github.com/njoyard/ist/archive/master.zip
[4]: https://github.com/njoyard/ist/archive/master.tar.gz
[5]: https://github.com/njoyard/ist/issues
[6]: http://twitter.com/njoyard
[7]: http://nodejs.org/
[8]: http://pegjs.majda.cz/
[9]: https://github.com/mishoo/UglifyJS
[10]: http://pivotal.github.com/jasmine/
[11]: http://get-serve.com/
