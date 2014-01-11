ist.js - Indented Selector Templating
=====================================

[![Build Status](https://travis-ci.org/njoyard/ist.png?branch=master)](http://travis-ci.org/njoyard/ist)

[![Selenium Test Status](https://saucelabs.com/browser-matrix/istjs.svg)](https://saucelabs.com/u/istjs)

Introduction
------------

ist.js is a javascript DOM templating engine using a CSS selector-like syntax.
Templates are text files, which are first parsed and compiled into a template
object, and then rendered into a DOM document using a context object.

Head to the [ist.js website][1] for downloads and more information, including
the [complete documentation][2].

Here is a brief overview of an ist.js template:

```css
div#content
    /* Article list */
    @each articles
        div.article
            h1 "{{ title }}"
            "{{ text }}"
            
        @unless comments.length
            "No comments yet !"
            
        @each comments
            div.comment "{{ this }}"
                
        form.newcomment
            label[for=name] "Name :"
            input.commentInput#name[type=text]
            textarea[cols=55]#commentArea "Enter your comment here"
                
@include "common/footer"
```

ist.js tries to reuse many syntax elements from CSS so that, in most cases,
setting your editor to highlight CSS syntax will give nice results.

ist.js can be used either as a standalone script, as an AMD module or as a
RequireJS plugin.

Feedback
--------

Feedback is always welcome. Feel free to fork ist.js and send me pull requests,
to report bugs using the [issue tracker][4] or to contact me on twitter as
[@njoyard][5].

License
-------

ist.js is distributed under the MIT license. See the file [`LICENSE`][3] for
more information.

Copyright (c) 2012-2013 Nicolas Joyard


[1]: http://njoyard.github.io/ist
[2]: http://njoyard.github.iofire/ist/doc.html
[3]: https://github.com/njoyard/ist/blob/master/LICENSE
[4]: https://github.com/njoyard/ist/issues
[5]: http://twitter.com/njoyard


