
{% assign opencurly = '{{' %}
{% assign closecurly = '}}' %}

Documentation
=============

Introduction
------------

IST is a javascript DOM templating engine using a CSS selector-like syntax.
Templates are text files, which are first parsed and compiled into a template
object, and then rendered into a DOM document using a context object.  This file
documents usage of version 0.5.3.

Here is a brief overview of an IST template file:

{% highlight css %}
div#content
    /* Article list */
    @each articles
        div.article
            h1
                "{{ opencurly }} title {{ closecurly }}"
            "{{ opencurly }} text {{ closecurly }}"
            
        @unless comments.length
            "No comments yet !"
            
        @each comments
            div.comment
                "{{ opencurly }} this {{ closecurly }}"
                
        form.newcomment
            label[for=name]
                "Name :"
            input.commentInput#name[type=text]
            textarea[cols=55]#commentArea
                "Enter your comment here"
                
@include "common/footer"
{% endhighlight %}

IST tries to reuse many syntax elements from CSS so that, in most cases, setting
your editor to highlight CSS syntax will give nice results.

IST can be used either as a standalone script, as an AMD module or as a
RequireJS plugin.

Usage
-----

### Standalone usage

When loaded as a standalone script, IST registers as `ist` (or `window.ist`).
You can compile a template string by simply passing it to ist:

{% highlight javascript %}
var myTemplate = ist("...");
{% endhighlight %}

When `window.ist` is already used, you can call `ist.noConflict` to restore its
previous value:

{% highlight javascript %}
var istTemplatingEngine = ist.noConflict();
// window.ist is now restored to its previous value

var myTemplate = istTemplatingEngine("...");
{% endhighlight %}

To avoid hard-coding IST templates in Javascript strings, you can use `<script>`
tags with an `id` attribute and a `type` attribute of `text/x-ist`.  You can
refer to these templates using their `id` as in the following example:

{% highlight html %}
<html>
    <head>
        <script type="text/javascript" src="ist.js"></script>
        
        <script type="text/x-ist" id="myTemplate">
            /* IST template code */
            div.parent
                div#child
        </script>
        
        <script type="text/javascript">
            function startup() {
                var myTemplate = ist.fromScriptTag("myTemplate");
                
                /* ... */
            }
        </script>
    </head>
    <body onload="startup();">
        <!-- ... -->
    </body>
</html>
{% endhighlight %}

### AMD usage

IST can also be used as an AMD module or as a RequireJS plugin.  To compile a
template string, use the module syntax as follows:

{% highlight javascript %}
require(['ist'], function(ist) {
    var myTemplate = ist('...');
    /* ... */
});
{% endhighlight %}
    
To compile a template file, you can use the RequireJS plugin syntax:

{% highlight javascript %}
require(['ist!path/to/template'], function(myTemplate) {
    /* ... */
});
{% endhighlight %}

Note that the plugin automatically adds a `.ist` extension to file names.

Of course you can also access `<script>` tags as in the standalone case.

### Rendering

You can render a template using the `render` method of compiled templates and
passing it a context object as its first argument.  By defaut, it will render
using the global object `document` property (eg. `window.document`).

{% highlight javascript %}
document.body.appendChild(myTemplate.render({ articles: [ /*...*/ ] }));
{% endhighlight %}
    
When rendering to an other document, you can pass it as a second argument:

{% highlight javascript %}
popup.document.body.appendChild(myTemplate.render({ /*...*/ }, popup.document));
{% endhighlight %}

Template syntax
---------------

### Basics

All nodes are specified on a separate line.  Empty lines (other than whitespace)
are ignored by IST.  The tree structure is specified using indentation.  You can
indent using (any number of) either spaces or tabs, but you have to be
consistent.  An increase in indent means a parent-child relationship:

{% highlight css %}
div.parent
    div.child
{% endhighlight %}

Likewise, nodes with the same indent are siblings:

{% highlight css %}
div.parent
    div.child
    div.child
{% endhighlight %}

When decreasing indent, be careful to match a previous line with the same indent
level:

{% highlight css %}
div.parent
    div.child
  div.invalid

div.parent
    div.child
div.valid
{% endhighlight %}
      
There is no restriction in the size of indent. The following are all equivalent:

{% highlight css %}
div.parent
 div.child

div.parent
             div.child

div.parent
    div.child
{% endhighlight %}

However, indent is compared strictly: it has to be identical for all sibling
nodes (ie nodes at the same level with the same parent).  Therefore it's best to
avoid mixing tabs and spaces.

You can add C-syntax block comments (like in CSS) anywhere in templates:

{% highlight css %}
div.parent
    /* Children specified
        below */
    div.child
{% endhighlight %}

### Element nodes - Selectors

CSS-like selectors are used to specify element nodes.  The element tag name is
always specified first, and qualifiers follow, in any order, but without
spacing. You can use ID qualifiers :

{% highlight css %}
div#an_id
{% endhighlight %}

class qualifiers:

{% highlight css %}
span.a_class
{% endhighlight %}
    
and attribute qualifiers:

{% highlight css %}
input[type=text]
{% endhighlight %}
    
All those can be mixed in any order:

{% highlight css %}
div#id.class1[style=display: none;].class2#final_id
{% endhighlight %}
    
Note that when specifying multiple IDs, only the last one is kept.  Finally, for
some corner-cases, properties can be specified as follows:

{% highlight css %}
div[.className=one two three]
{% endhighlight %}

You can also omit the tag name when at least one qualifier is present.  It will
implicitly mean 'div'.

{% highlight css %}
.anImplicitDiv
#anOtherOne
{% endhighlight %}

### Text nodes

Text nodes are specified with double or simple quotes:

{% highlight css %}
"top-level 'text node'"
div.text
    "child text node"
    "you can include \"escaped\" ch\x41ra\u0043ters"
    'including\nnewlines'
{% endhighlight %}

Of course text nodes cannot have any child nodes.

### String interpolation

You can insert values from the rendering context using double pairs of curly
braces in text nodes:

{% highlight css %}
"value is {{ opencurly }} value {{ closecurly }}, foo is {{ opencurly }} foo {{ closecurly }}"
{% endhighlight %}

Rendering it with `myTemplate.render({ value: 42, foo: 'bar' });` would result
in a text node containing "value is 42, foo is bar".  Spaces inside curly braces
are ignored, and you can also access subproperties:

{% highlight css %}
"value is {{ opencurly }}values.fortyTwo{{ closecurly }}, foo is {{ opencurly }}  foo         {{ closecurly }}"
{% endhighlight %}

would have the same result when rendered using:

{% highlight javascript %}
myTemplate.render({ values: { fortyTwo: 42 }, foo: 'bar' });
{% endhighlight %}

Curly braces can also be used in node attributes and properties:

{% highlight css %}
div[attribute={{ opencurly }} prop1 {{ closecurly }} and {{ opencurly }} prop2 {{ closecurly }}]
{% endhighlight %}

Using string interpolation is not currently possible with ID or class
qualifiers, but you can use `[.className={{ opencurly }} foo {{ closecurly }}]` and `[.id={{ opencurly }} bar.baz {{ closecurly }}]`
as a workaround.

Inside curly braces, you can access the rendering context itself using `this`:

{% highlight css %}
"{{ opencurly }} propertyName {{ closecurly }} is identical to {{ opencurly }} this.propertyName {{ closecurly }}"
{% endhighlight %}

Actually you can execute arbitrary javascript code inside curly braces.

{% highlight css %}
"7 * 6 = {{ opencurly }} 7 * 6 {{ closecurly }}"
div[title=current context has {{ opencurly }} Object.keys(this).length {{ closecurly }} properties]
    "{{ opencurly }} document.querySelector(\".new\") ? 'unread items !' : 'nothing new' {{ closecurly }}"
    "context method result = {{ opencurly }} aMethodName(42, Math.PI); {{ closecurly }}"
{% endhighlight %}

Don't forget escaping single or double quotes (whichever applicable) inside
curly braces.

Please note however that you cannot directly access context properties that are
also javascript reserved words.  You will have to use the subscript syntax on
`this`; consider the template below rendered using the context object
`{ "typeof": "a", "true": "b", "undefined": "c" }`:

{% highlight css %}
div.willThrowSyntaxError
    /* Throws SyntaxError when rendered */
    "{{ opencurly }} typeof {{ closecurly }}"
    
div.willRenderCorrectly
    /* Renders to "a" */
    "{{ opencurly }} this['typeof'] {{ closecurly }}"
    
div.willNotAccessContext
    /* Renders to "true undefined" */
    "{{ opencurly }} true {{ closecurly }} {{ opencurly }} undefined {{ closecurly }}"
    
div.willAccessContext
    /* Renders to "b c" */
    "{{ opencurly }} this['true'] {{ closecurly }} {{ opencurly }} this['undefined'] {{ closecurly }}"
{% endhighlight %}

### Control structures

#### Conditionals

You can render parts of the tree conditionnaly using `@if` and `@unless`
directives as follows:

{% highlight css %}
@if some.property.is.truthy
	div.willBeRendered
	
@unless some.property.is.truthy
	div.willNotBeRendered
{% endhighlight %}

Usual javascript truthiness is used here.  As inside curly braces, you can
actually use an arbitrary JS expression instead:

{% highlight css %}
@if !document.querySelector('.mustAppearOnce')
	div.mustAppearOnce
	
@if user === 'admin'
	div.adminPanel
	    /* ... */
{% endhighlight %}

#### Context switching

When accessing the same part of the context object repeatedly, you may want to
use the `@with` directive to make the template more readable:

{% highlight css %}
span
    "{{ opencurly }} deeply.nested.object.property1 {{ closecurly }}"
    "{{ opencurly }} deeply.nested.object.property2 {{ closecurly }}"
    
div.better
    @with deeply.nested.object
        "{{ opencurly }} property1 {{ closecurly }}"
        "{{ opencurly }} property2 {{ closecurly }}"
{% endhighlight %}

As with `@if` and `@unless`, you can use expressions:

{% highlight css %}
@with { name: clients[12].firstName + ' ' + clients[12].lastName }
    "Name: {{ opencurly }} name {{ closecurly }}"
{% endhighlight %}

#### Array iteration

You can render part of the tree repeatedly for each element of an array using
the `@each` directive as follows:

{% highlight css %}
@each articles
    h1
        "{{ opencurly }} title {{ closecurly }}"
    div
        "{{ opencurly }} content {{ closecurly }}"
{% endhighlight %}
            
Under the `@each` directive, the special `loop` variable enables access to
iteration details:

{% highlight css %}
@each elements
    @if loop.first
        "first element"
        br
    "element {{ opencurly }} loop.index {{ closecurly }} of {{ opencurly }} loop.length {{ closecurly }}"
    br
    @if loop.last
        "the last one"
{% endhighlight %}

The `loop` variable hides any context property with the same name, but you can
still access it using `this.loop` (or `this["loop"]`).
            
The `loop.outer` variable enables acces to the outer context:

{% highlight css %}
@each elements
    "{{ opencurly }} loop.outer.elements.length {{ closecurly }} should equal {{ opencurly }} loop.length {{ closecurly }}"
{% endhighlight %}

And once again, you can use expressions:

{% highlight css %}
ul#menu
    @each ['home', 'products', 'contact']
        li
            a[href=#sections/{{ opencurly }} this {{ closecurly }}]
                "{{ opencurly }} this {{ closecurly }}"
{% endhighlight %}

#### External template inclusion

A template file can be included in an other one using the `@include` directive.
The usage of this directive depends on whether you loaded IST as a standalone
script or using an AMD loader, but in both cases, the `@include`d template
will be rendered with the current context.

In both cases, you can include templates from an existing `<script>` tag using
its `id` attribute:

{% highlight html %}
<script type="text/x-ist" id="mainTemplate">
    div.container
        div.content
    @include "footerTemplate"
</script>

<script type="text/x-ist" id="footerTemplate">
    div.footer
        "Copyright (c) MyCompany"
</script>
{% endhighlight %}

Note that the order of definition does not matter.  In the example above,
"footerTemplate" can be included in "mainTemplate" even if defined afterwards.

When using an AMD loader, you can additionnaly use the following syntax to
include other templates:

{% highlight css %}
@include "path/to/template"
@include "path/to/template.ist"
@include 'path/to/template'
@include 'path/to/template.ist'
{% endhighlight %}
    
When loading templates with the `ist!` plugin, included template paths must be
relative (ie. path/to/a must refer to path/to/b as `@include "b"` or
`@include "b.ist"` when loaded as `ist!path/to/a`), and are loaded
automatically.

However, when a template string is compiled directly, dependencies must have
been loaded prior to rendering (unless the dependency is a `<script>` tag ID).
In the first example above, the helper will look for AMD modules named either
`path/to/template`, `path/to/template.ist`, `ist!path/to/template` or
`text!path/to/template.ist`.  One of these modules must resolve to either a
template string or a compiled IST template.

### Partials

Partials allow accessing part of a template tree as if it were a full template.
It may be useful for example when an update to an array (rendered using an @each
directive) is needed.  Partial names are specified in a template using the
`!name` syntax next to a regular node:

{% highlight css %}
div.liveTweets
    @each tweets
        /* Tweet partial */
        div.tweet !tweet
            span.author
                "@{{ opencurly }} author {{ closecurly }}"
            span.text
                "{{ opencurly }} text {{ closecurly }}"
{% endhighlight %}

Partial names must be specified last on a node line, and must be preceded by at
least one space or tab character.

Partials can be accessed using the `findPartial` method of a template, which
takes the partial name as an argument.  It returns the first matching partial,
which can be manipulated as any other template :

{% highlight javascript %}
var myTemplate = ist(...);

function initialRender(tweets) {
    document.body.appendChild(
        myTemplate.render({ tweets: tweets });
    );
}

function addNewTweet(author, text) {
    var container = document.querySelector(".liveTweets"),
        partial = myTemplate.findPartial("tweet");
        
    container.appendChild(
        partial.render({ author: author, text: text })
    );
}

{% endhighlight %}

Additionnaly, partials can be nested, and a sub-partial may be accessed using
`findPartial` on either the "main" template or any "parent" partial.

Single node creation
--------------------

IST also has a shortcut "single node" creation interface that support the same
syntax as full template files.  You can call it as follows:

{% highlight javascript %}
var myDiv = ist.createNode("div.class#id[prop=Value]");
{% endhighlight %}
    
It also supports rendering with context:

{% highlight javascript %}
var myDiv = ist.createNode("div[class={{ opencurly }} cls {{ closecurly }}]", { cls: 'myclass' });
{% endhighlight %}
    
Actually `createNode` is able to create several nodes at once using a CSS-like
angle-bracket syntax:

{% highlight javascript %}
var myParentDiv = ist.createNode(
    'div.parent > div.child > "{{ opencurly }} text {{ closecurly }}"',
    { text: "Text node content" }
);
{% endhighlight %}

And you can even use directives:

{% highlight javascript %}
var myParentDiv = ist.createNode(
    'div.parent > @each children > "{{ opencurly }} name {{ closecurly }}"',
    { children: [ { name: 'alice' }, { name: 'bob' } ] }
);
{% endhighlight %}

Please note however that `createNode` has a quite naive angle-bracket parser,
and as such does not support angle brackets anywhere else than between nodes.
Therefore you should only use it for trivial node tree creation.

Finally, you can create nodes in an alternate document by passing it as a third
argument:

{% highlight javascript %}
var popupDiv = ist.createNode('div.inPopup', {}, popup.document);
{% endhighlight %}

Custom directives
-----------------

Directives are used to control node generation with the help of context
properties.  They allow defining custom iterators and handlers to operate on a
narrowed down rendering context.  If you're used to [handlebars blocks][2],
you'll find out that IST directives work in a very similar way. All built-in
control structures are implemented this way.

### Registering directive helpers

The syntax of directives in templates files is as follows:

{% highlight css %}
@directiveName path.to.context.property
    div.subtree
        /* ... */
{% endhighlight %}

Instead of a context "property path", directives can be called with any valid JS
expression as an argument:

{% highlight css %}
@directiveName "direct string value"
    div.subtree
        /* ... */
    
@directiveName { a: 42, foo: 'bar' }
    div.subtree
        /* ... */
{% endhighlight %}

Finally, directives can be called without any argument:

{% highlight css %}
@directiveName
    div.subtree
        /* ... */
{% endhighlight %}

Directive helpers are defined using the following call:

{% highlight javascript %}
ist.registerHelper('directiveName', function(subContext, subTemplate) {
    // Helper code, more on that later
});
{% endhighlight %}

### Context objects

Directive helpers receive `Context` objects to encapsulate the current rendering
context as well as the target Document and helper methods.  `Context` objects
have the following API:

* `Context.document` is the target document
* `Context#createDocumentFragment()` is an alias to the same method in the
  target document
* `Context#createTextNode(textContent)` is an alias to the same method in the
  target document
* `Context#createElement(tagName[, namespace])` is an alias to createElement or
  createElementNS (when called with `namespace`) in the current rendering
  document
* `Context.value` is the context value
* `Context#evaluate(expr)` evaluates `expr` in a scope where all context
  properties are available as locals, and where `this` evaluates to the Context
  object itself.
* `Context#interpolate(string)`    interpolates "{{ opencurly }} ... {{ closecurly }}" occurences inside
  `string`
* `Context#createContext(newValue)`    creates and returns a new `Context` object
  with `newValue` as value, but with the same rendering document
* `Context#pushEvalVal(name, value)` adds a variable to the scope used in
  `evaluate`, overriding any previous value.  This can be used to add variables
  that can be used in expressions in `{{ opencurly }}...{{ closecurly }}` blocks or after directive names.
  For an example of usage, see below how the `@each` directive pushes the `loop`
  variable.
* `Context#popEvalVal(name)` removes a variable from the scope used in
  `evaluate`, restoring its previous value if any, and returning the popped
  value.  For an example of usage, see the `@each` directive.
  
Internally, IST always works with `Context` objects when rendering templates.
Actually, you can directly pass a `Context` object to the `render` method of any
IST compiled template (instead of a context object and an optional target
document).
    
### Writing directive helpers

Helpers are called with the current rendering `Context` as `this`, and with the
"narrowed down" context, taking the value from the expression following the
`@directiveName` as the first argument (or `undefined` when the directive
is used without any argument).  The second argument is an IST compiled template
created from what is "inside" the directive.

Block helpers must return their result as either a DOM node or a (possibly
empty) DOM document fragment.  Returning `undefined` is also possible and has
the same result as returning an empty fragment.

Note that helpers must only be defined at the time a template is rendered.
Template files can be parsed before the necessary block helpers are defined; 
this enables loading templates with the requirejs plugin syntax and defining
helpers later.

#### Basic examples

You can define a simple '@noop' block that simply renders the inner template
without any context switching as follows:

{% highlight javascript %}
ist.registerHelper('noop', function(subCtx, subTemplate) {
    return subTemplate.render(this);
});
{% endhighlight %}

Having defined this helper, the following template:

{% highlight css %}
@noop
    div.example
        "using a {{ opencurly }} context.property {{ closecurly }}"
{% endhighlight %}
    
will render the same as:

{% highlight css %}
div.example
    "using a {{ opencurly }} context.property {{ closecurly }}"
{% endhighlight %}

You could also use the same helper to annotate templates, although comments are
already available for this purpose:

{% highlight css %}
@noop "this block renders to an example div"
    div.example
{% endhighlight %}

An other simple example would be a '@disabled' block that prevents rendering
part of a template tree:

{% highlight css %}
div.rendered
    @disabled
        div.notRendered
@disabled
    div.alsoNotRendered
{% endhighlight %}

The associated helper simply returns an empty fragment:

{% highlight javascript %}
ist.registerHelper('disabled', function() {
    return this.createDocumentFragment();
});
{% endhighlight %}
    
As said before, returning `undefined` is the same, so you can simply write:

{% highlight javascript %}
ist.registerHelper('disabled', function() {});
{% endhighlight %}

#### Built-in directive helpers

Following are helper definitions for built-in directives as examples of what can
be achieved with custom directives.

##### Conditionals

Conditional directives enable conditional rendering of a subtree:

{% highlight css %}
@if some.property.is.truthy
    div.willBeRendered
    
@unless some.property.is.truthy
    div.willNotBeRendered
{% endhighlight %}

They are defined as follows:

{% highlight javascript %}
ist.registerHelper('if', function(ctx, tmpl) {
    if (ctx.value) {
        return tmpl.render(this);
    }
});

ist.registerHelper('unless', function(ctx, tmpl) {
    if (!ctx.value) {
        return tmpl.render(this);
    }
});
{% endhighlight %}

##### The 'with' block directive

The `@with` directive enables context narrowing:

{% highlight css %}
div.suboptimal
    "{{ opencurly }} deeply.nested.object.property1 {{ closecurly }}"
    "{{ opencurly }} deeply.nested.object.property2 {{ closecurly }}"
    
div.better
    @with deeply.nested.object
        "{{ opencurly }} property1 {{ closecurly }}"
        "{{ opencurly }} property2 {{ closecurly }}"
{% endhighlight %}

It is defined as follows:

{% highlight javascript %}
ist.registerHelper('with', function(ctx, tmpl) {
    return tmpl.render(ctx);
});
{% endhighlight %}

##### Basic iterator

The `@each` loop directive iterates over an array.  Context for the subtree is
switched to each of the array elements in turn:

{% highlight css %}
@each articles
    h1
        "{{ opencurly }} title {{ closecurly }}"
    div
        "{{ opencurly }} content {{ closecurly }}"
{% endhighlight %}

The 'each' helper is defined as follows; note how `pushEvalVar` and `popEvalVar`
are used to create the `loop` variable (even if `popEvalVar` is useless in this
particular example as the subcontext is destroyed immediately most of the time).

{% highlight javascript %}
ist.registerHelper('each', function(ctx, tmpl) {
    var fragment = this.createDocumentFragment(),
        outer = this.value,
        value = ctx.value;
    
    if (value && Array.isArray(value)) {
        value.forEach(function(item, index) {
            var sctx = ctx.createContext(item);
            
            sctx.pushEvalVar('loop', {
                first: index == 0,
                index: index,
                last: index == value.length - 1,
                length: value.length,
                outer: outer
            });
            fragment.appendChild(tmpl.render(sctx));
            sctx.popEvalVar('loop');
        });
    }
    
    return fragment;
});
{% endhighlight %}

##### External template inclusion

A template file can be included in an other one using the `@include` directive:

{% highlight css %}
@include "path/to/template"
@include "path/to/template.ist"
{% endhighlight %}

The code for the corresponding helper is shown below.  Please note that this
helper alone is not sufficient: the requirejs plugin code also parses templates
to add `@include`d templates to dependencies.

{% highlight javascript %}
ist.registerHelper('include', function(ctx, tmpl) {
    var what = ctx.value.replace(/\.ist$/, ''),
        found, tryReq;
        
    // Try to find a previously require()-d template or string
    tryReq = [
        what,
        what + '.ist',
        'ist!' + what,
        'text!' + what + '.ist'
    ];
    
    while (!found && tryReq.length) {
        try {
            found = requirejs(tryReq.shift());
        } catch(e) {
            if (tryReq.length === 0) {
                throw new Error("Cannot find included template '" + what + "'");
            }
        }
    }
    
    if (typeof found === 'string') {
        // Compile template
        found = ist(found, what);
    }
    
    if (typeof found.render === 'function') {
        // Render included template
        return found.render(this, tmpl.document);
    } else {
        throw new Error("Invalid included template '" + what + "'");
    }
});
{% endhighlight %}

Compatibility
-------------

IST has been successfully tested with the following browsers:
- Chrome 18
- Epiphany 3.4
- Firefox 13

Feedback
--------

Feedback is always welcome. Feel free to fork IST and send me pull requests, to
report bugs using the [issue tracker][4] or to contact me on twitter as
[@njoyard][5].

License
-------

IST is distributed under the MIT license. See the file [`LICENSE`][3] for more
information.

Copyright (c) 2012 Nicolas Joyard


[1]: http://njoyard.github.com/ist
[2]: http://handlebarsjs.com/block_helpers.html
[3]: https://github.com/njoyard/ist/blob/master/LICENSE
[4]: https://github.com/njoyard/ist/issues
[5]: http://twitter.com/njoyard
[6]: https://github.com/njoyard/ist/raw/master/dist/ist.js
[7]: https://github.com/njoyard/ist/raw/master/dist/ist-min.js
[8]: http://pegjs.majda.cz/

