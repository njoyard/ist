
## Getting started

An ist.js template looks like a tree of [CSS selectors](#Element selectors) and
[text nodes](#Text nodes), with embedded [expressions](#Expressions) delimited
by double curly braces.

```css
article
    header
        h1 "{{ title }}"
    p.articleParagraph
        "{{ text }}"
```

You can deliver templates to the browser using a `<script>` tag.

```html
<script id="example-template" type="text/x-ist">
    article
        header
            h1 "{{ title }}"
        p.articleParagraph
            "{{ text }}"    
</script>
```

You can then call `ist()` with the content of this tag, or you can use
`ist.fromScriptTag()`.

```js
var template = ist($("#example-template").html());
var template = ist.fromScriptTag("example-template");
```

You can also directly use strings.

```js
var template = ist('h1 "{{ title }}"');
```

The variable `template` in the examples above is a compiled template.  Passing a
context object to the `render()` method of a compiled template renders it into a
DOM node tree.

```js
var context = {
        title: "ist.js released",
        text: "ist.js has just been released"
    };
    
var node = template.render(context);

document.body.appendChild(node);
```

Additionnaly, you can pass a DOM document as the second argument to `render()` to
render nodes into an other document.  This is mainly useful when using multiple
windows or frames.

```js
var popup = window.open();
var node = template.render(context, popup.document);

popup.document.body.appendChild(node);
```

Templates can include [directives](#Directives) to change the way they are
rendered depending on context content. Directives start with an `@` symbol and
take an expression as parameter.

```css
ul.menu
    @if isAdmin
        li
            a.adminZone "Administration zone"
    @each menuItems
        li
            a[href={{ url }}] "{{ label }}"
```

The example above would be rendered with a context object similar to this one:

```js
var context = {
        isAdmin: true,
        menuItems: [
            { url: "home.html", label: "Home" },
            { url: "news.html", label: "News" },
            { url: "contact.html", label: "Contact" }
        ]
    };
    
document.body.appendChild(menuTemplate.render(context));
```

Templates can also include [comments](#Comments) and blank lines for clarity.

```css
ul.menu
    
    /* Only display admin link if user is an administrator */
    @if isAdmin
        li
            a.adminZone "Administration zone"
            
    @each menuItems
        li
            a[href={{ url }}] "{{ label }}"
```

ist.js also allows easy [single node creation](#Single node creation) using
`ist.createNode()`.

```js
var myLink = ist.createNode("a.link[href=#]");
```

## Usage

### Standalone usage

When loaded as a standalone `<script>` tag, ist.js registers as `window.ist` (or
just `ist`).

```js
var template = ist('h1 "{{ title }}"');
```

ist.js provides a `noConflict()` method to restore the previous value of
`window.ist` if necessary.

```js
var istjs = ist.noConflict();

// window.ist is now back to its previous value
```

### AMD usage

You can use ist.js with any AMD loader.

```js
require(['ist'], function(ist) {
    var template = ist('h1 "{{ title }}"'),
        node = template.render({
            title: "Title"
        });
        
    document.body.appendChild(node);
});
```

ist.js implements the AMD plugin interface.  You can store a template in a file
with a `.ist` extension and directly load the compiled template using the plugin
syntax.  Note that ist.js adds the extension automatically.

```js
require(['ist!path/to/template'], function(template) {
    var node = template.render({
            title: "Title"
        });
        
    document.body.appendChild(node);
});
```

## Template Syntax

### Node tree

ist.js uses indentation to specify node trees, not unlike YAML and Python.  All
children of a same node must have the same indent.  You can use spaces or tabs,
but ist.js will not see a tab as the equivalent of any number of spaces.

```css
div.parent
    div.child
        div.grandchild
    div.child
```

You can start a template with any indent and you may use different levels.  All
that matters is that sibling nodes have the exact same indent; thus, the first
child node defines the indent to use for all its siblings.

```css
     div.parent
       div.child
                    div.grandchild
                    div.grandchild
                div.invalid
                         div.invalid
```

You can use a different indent for nodes at the same tree level provided they
are not siblings.

```css
div.parent
    div.child
    div.child
div.parent
           div.child
           div.child
```

### Comments

Blank lines and CSS-like block comments are allowed in templates.  They can span
multiple lines but you shouldn't add a node after a comment on the same line as
it may make the node indent ambiguous.

```css
/* Comment */
div.parent
    div.child /* Comment */
    
        div.grandchild
        
    /* Multi-line
        comment */
    
    /* Error-prone
     comment
  */    div.child

```

### Element selectors

ist.js uses CSS3 selectors to specify elements.  Of course all selectors are
not supported, as they would not make sense.  In general, selectors start with
a tag name.

```css
article
    header
        h1
```

You can add qualifiers to selectors, for example id or class qualifiers.

```css
ul.menu
    li#item1
        a
```

You can also set attributes using an attribute qualifier (which has the same
syntax as a CSS3 attribute value selector).

```css
ul
    li
        a[href=index.html]
```

ist.js also allows setting properties on elements, using an attribute qualifier
with a `.` prefix.

```css
div[.className=header]
```

Qualifiers can be mixed in any order.  When multiple id qualifiers, or multiple
attribute qualifiers for the same attribute are present, only the last one
matters.  Spaces between qualifiers are not allowed.

```css
ul.menu.header
    li
        a.menuitem#item1[href=index.html]
```

When you want to create `<div>`s, ist.js allows omitting the tag name in
selectors.  Of course you will need at least one qualifier.

```css
.implicitDiv
	#implicitDiv
	[implicit=yes]
```

### Text nodes

You can add text nodes in a template by enclosing text with single or double
quotes.  Text nodes cannot have children.

```css
h1
    "Title"
h2
    'Subtitle'
```

Text nodes can also be specified on the same line as their parent node; in this
case they must be separated by at least one space.

```css
h1 "Title"
h2      'Subtitle'
```

This does not prevent adding more children to the parent node.  These examples
produce the same result, though the first one might not be as clear.  The choice
is yours.

```css
div "Text content"
    div.child
    
div
    "Text content"
    div.child
```

Text nodes can contain escaped characters, including their delimiting quote.

```css
h1
    "you 'can' include \"escaped\" ch\x41ra\u0043ters"
h2
    'you \'can\' include "escaped" ch\x41ra\u0043ters'
```

### Expressions

ist.js expressions can be used to include values from the rendering context in
text nodes or element attribute and property values.  They are delimited by
double curly braces.

```css
ul.links
    li
        a[href={{ url }}] "{{ label }}"
```

You can include any valid Javascript expression in an ist.js expression.  All
rendering context properties are accessible as variables in expressions,
provided they are valid identifiers.

```css
article[style=color: {{ read ? "blue" : "red" }}]
    h1
        "{{ title.toUpperCase() }}"
    h2
        "{{ \"don't forget escaping quotes\" }}"
    "{{ path.to.nested.property }}"
```

The rendering context itself is accessible as `this` in expressions, and thus
these two examples are equivalent.

```css
h1 "{{ title }}"

h1 "{{ this.title }}"
```

The `this` keyword is mainly useful to access properties that are not valid
identifiers, using the square bracket notation.

```css
"{{ this[12] }}"
"{{ this['weird property name'] }}"
"{{ this[\"typeof\"] }}"
```

Expressions cannot be used inside id or class qualifiers, but you can use
attribute qualifiers instead.

```css
div[class={{ cssClass }}]
div[.className={{ cssClass }}]
div[id={{ id }}]
```

### Event handlers

ist.js can associate event handlers to elements, using a similar syntax to
attribute/property qualifiers, but prefixed with an exclamation mark.

```css
ul#menu
	@each menu
		li[!click=action]
			"{{ label }}"
```

The value after the equal sign must be an ist.js expression, without any curly
braces, and of course it should return a function.

```js
myTemplate.render({
	menu: [
		{
			label: "about",
			action: function() {
				alert("About this application");
			}
		},
		{
			label: "quit",
			action: function() {
				location.href = "/";
			}
		}
	]
});
```

### Directives

ist.js directives allow controlling the rendering of templates depending on
context content. The general syntax is as follows, where `parameter` can be any
ist.js expression.  Note that expressions don't need braces when used with
directives.

You can also [define your own directives](#Defining custom directives).

```css
div.parent
    @directive parameter
        div.subtemplate
```

#### Conditionals

You can use an `@if` directive to toggle rendering of a section of template
depending on the value of an expression.

```css
@if user.isAdmin
    a[href=admin.html] "Administration zone"
```

The `@unless` directives has the same goal, just reversed.

```css
@unless user.isRegistered
    a[href=register.html] "Sign up now !"
```

#### Context switching

The `@with` directive allows context switching.  When accessing the same part of
the context repeatedly, you may want to use it to make the template more
readable.

```css
div.userData
    a[href=/userpanel/{{ user.id }}] "{{ user.name }}"

div.userData
    @with user
        a[href=/userpanel/{{ id }}] "{{ name }}"

```

The `@with` directive can also be used to hard-code some parts of the template.

```css
@with { version: '0.5.4', built: '2012-11-20' }
	footer
		"ist.js version {{ version }} built on {{ built }}"
```

#### Array iteration

The `@each` directive allows rendering a section of template repeatedly for each
element of an array.  For every iteration, the rendering context is switched to
a new element in the array.

```css
ul.menu
	@each menu
		a[href={{ url }}] "{{ label }}"
```

The example above would be rendered with a context similar to this one.

```js
var context = {
        menuItems: [
            { url: "home.html", label: "Home" },
            { url: "news.html", label: "News" },
            { url: "contact.html", label: "Contact" }
        ]
    };
    
document.body.appendChild(menuTemplate.render(context));
```

When using an `@each` directive, the special `loop` variable is set to an object
with details about the iteration.

* `loop.index` is the 0-based index of the rendered item in the array
* `loop.length` is the size of the array
* `loop.first` is true when `loop.index === 0`
* `loop.last` is true when `loop.index === loop.length - 1`
* `loop.outer` is a reference to the outer context object

```css
@each array
	@if loop.first
		"First item"
		
	"Item {{ loop.index + 1 }} of {{ loop.length }} is {{ this }}"
	
	@if loop.last
		"Last item"
```

The `loop` variable hides any `loop` property on the rendering context, but you
can still access it using `this`.

```css
@each array
	"Item.loop = {{ this.loop }}"
```

#### Object property iteration

The `@eachkey` directive is very similar to the `@each` directive, but it loops
over an objects own properties, setting the variables `key` and `value`.

```css
@eachkey { home: "home.html", news: "news.html" }
	a[href={{ value }}]
		"{{ key }}"
```

When using `@eachkey`, the `loop` variable is set to an object with details 
about the iteration.

* `loop.index` is the 0-based index of the rendered item in the array
* `loop.length` is the size of the array
* `loop.first` is true when `loop.index === 0`
* `loop.last` is true when `loop.index === loop.length - 1`
* `loop.outer` is a reference to the outer context object
* `loop.object` is a reference to the enumerated object

#### Components

The `@define` and `@use` directives can be used to define components (or what
other templating engines also call macros).  This enables reusing parts of
templates.  To define a component, use the `@define` directive with the
component name as a parameter.

```css
@define "article"
    .article
        h1 "{{ title }}"
        .content "{{ text }}"
```

The component name can be any string value.  Any existing component with the
same name will be overriden.  You can then use the component with the `@use`
directive.

```css
/* articles should be an array of objects with title and text properties */
@each articles
    @use "article"
```

There is no direct way to pass a specific context to a component when
`@use`-ing it, but you can use the `@with` directive to achieve the same.

```css
@with { title: "My article", text: "Hello, world !" }
    @use "article"
```

#### External template inclusion

The `@include` directive enables including an other template that will be
rendered using the current rendering context.  When using `<script>` tags, you
can pass an ID as a string to the `@include` directive.  Note that the order of
definition of `<script>` tags does not matter.

```html
<script type="text/x-ist" id="menu">
	ul#menu
		@each items
			@include "menu-item"
</script>

<script type="text/x-ist" id="menu-item">
	li
		a[href={{ url }}] "{{ label }}"
</script>

<script type="text/javascript">
	function renderMenu() {
		ist.fromScriptTag("menu").render([
			{ label: "Home", url: "index.html" },
			{ label: "News", url: "news.html" },
			{ label: "Contact", url: "contact.html" }
		});
	}
</script>
```

When using an AMD loader, you can also load modules from other files when your
templates are loaded with the `ist!` plugin syntax.  Simply pass their relative
path as a string parameter to `@include`.  You can omit the `.ist` extension.

```css
/* templates/main.ist */
@include "common/header"

section#main
	"Main content, yay!"
	
@include "common/footer.ist" /* Extension is optional */


/* templates/common/header.ist */
header
	h1 "My Website"


/* templates/common/footer.ist */
footer
	"Copyright (c) 2012 My Company"
```

When loading a template file with the `ist!` AMD plugin, `@include`d templates
are automatically loaded as dependencies.

```js
require(['ist!templates/main'], function(mainTemplate) {
	/* templates/common/{header,footer} are added as AMD
	   dependencies to 'ist!templates/main', and thus
	   are loaded automatically */
	   
	mainTemplate.render(/* ... */);
});
```

When a template is loaded from a string or a `<script>` tag however, any 
`@include`d template must be either an other `<script>` tag ID, or an already
loaded AMD module name.

```html
<script type="text/x-ist" id="main">
	@include "included-template"
</script>
```

The "included-template" module name above may resolve to an ist.js compiled
template.

```js
define("included-template", ["ist!some/template"], function(tmpl) {
	return tmpl;
});

require(["ist", "included-template"], function(ist) {
	ist.fromScriptTag("main").render(/* ... */);
});
```

It may also resolve to a template string.

```js
define("included-template", [], function() {
	return "div\n  h1 'included content'";
});

require(["ist", "included-template"], function(ist) {
	ist.fromScriptTag("main").render(/* ... */);
});
```

### Partials

Partials enable you to access part of a template as if it were an other
template.  This is often useful for arrays rendered using and `@each` directive
that you need to update.

Partials are declared with the `!name` notation next to an element.

```css
div.liveTweets
    @each tweets
        /* Tweet partial */
        div.tweet !tweet
            span.author
                "@{{ author }}"
            span.text
                "{{ text }}"
```

Partial names must be specified last on an element line, and must be preceded by
at least one space or tab character.  If an inline text node is present, the
partial name must be placed after it.

They can be accessed using the `findPartial()` method of a compiled template,
which takes the partial name as argument.  It returns the first matching
partial, which can be manipulated as any other compiled template.

```js
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
```

## Single node creation

ist.js provides a shortcut "single node" creation interface that support the
same syntax as full template files.  Just call `ist.createNode()` and pass it
an element selector.

```js
var myDiv = ist.createNode(
		"div.class#id[attribute=Value]"
	);
```
    
It also supports rendering with context.

```js
var myDiv = ist.createNode(
		"div[class={{ cls }}]",
		{ cls: 'myclass' }
	);
```
    
Actually `ist.createNode()` is able to create several nodes at once using a
CSS-like angle-bracket syntax.

```js
var myParentDiv = ist.createNode(
		'div.parent > div.child > "{{ text }}"',
		{ text: "Text node content" }
	);
```

And you can even use directives.

Please note however that `createNode` has a quite naive angle-bracket parser,
and as such does not support angle brackets anywhere else than between nodes.
Therefore you should only use it for trivial node tree creation.

```js
var myParentDiv = ist.createNode(
		'div.parent > @each children > "{{ name }}"',
		{
			children: [
				{ name: 'alice' },
				{ name: 'bob' }
			]
		}
	);
```

Finally, you can create nodes in an alternate document by passing it as third
argument.

```js
var popupDiv = ist.createNode(
		'div.inPopup', 
		{},
		popup.document
	);
```

## Custom directives

ist.js allows defining custom directives, and built-in directives are actually
defined the same way.  If you're used to [handlebars block helpers][1], you'll
find that ist.js directives work in a very similar way.

A directive helper is registered by calling `ist.registerHelper()` and passing
it a directive name (case-sensitive) and a helper function.

```js
/* Helper for '@foo' */
ist.registerHelper("foo", function(outer, inner, template, fragment) {
	/* Do stuff */
});
```

The arguments passed to helpers are:

* `outer`: a [Context object](#Context objects) for the outer rendering context,
  ie. the value of the rendering context where the directive is called;
* `inner`: a [Context object](#Context objects) for the inner rendering context,
  ie. the value that is passed as an argument to the directive; this argument
  is undefined when no parameter is passed;
* `template`: an ist compiled template that enables access to nodes defined as
  children of the directive;
* `fragment`: an empty DocumentFragment where the directive should add the nodes
  it creates.

Here are some example calls to `@foo` with the parameters the helper receives:

```css
@with { hello: "world" }
    /* Call with a parameter, the handler receives:
        - outer: a Context object for { hello: "world" }
        - inner: a Context object for "world" (ie. the value of hello)
        - template: a compiled ist template for
                div.childA
                div.childB
     */
    @foo hello
        div.childA
        div.childB

    /* Call with a parameter, the handler receives:
        - outer: a Context object for { hello: "world" }
        - inner: undefined
        - template: a compiled ist template for
                div.child
                    div.grandChild
     */
    @foo
        div.child
            div.grandChild
```

To create nodes from a directive helper, you should not use `document` or any of
its methods, as you don't know which DOM document your directive will be used
to create nodes in.  You can use helper properties and methods on any of the
[Context object](#Context objects) arguments instead (you may prefer always
using `outer` as it is always present).

```js
/* Always create a text node containing "foo", ignoring context values and
   children template nodes */
ist.registerHelper("foo", function(outer, inner, template, fragment) {
	var node = outer.createTextNode("foo");
    fragment.appendChild("foo");
});
```

You can access the value wrapped by a [Context object](#Context objects) with
its `value` property.  Here is a simple `@echo` directive that creates a single
text node with the string passed as a parameter.

```js
/* Example: @echo "foo" */
ist.registerHelper("echo", function(outer, inner, template, fragment) {
    var node = outer.createTextNode(inner ? inner.value : "no value passed to @echo !");
    fragment.appendChild(node);
});
```

Here is another simple example showing how the built-in `@with` directive could
be defined.  It simply renders its child template using the inner context value.

```js
ist.registerHelper("with", function(outer, inner, template, fragment) {
    var nodes = template.render(inner.value);
    fragment.appendChild(nodes);
}
```

You may throw exceptions inside helpers.  Those exceptions will be reported with
some added context data (including which template and which line it occured on).
Here is a more robust version of `@with`.

```js
ist.registerHelper("with", function(outer, inner, template, fragment) {
    if (!inner) {
        throw new Error("No data passed to @with");
    }

    /* You can directly pass Context objects to the render() method of templates */
    var nodes = template.render(inner);

    fragment.appendChild(nodes);    
});
```

### Context objects

Directive helpers receive `Context` objects to encapsulate rendering contexts as
well as the DOM document where templates are rendered.  The following members
give access to the DOM document where the template is being rendered:

* `Context.doc` is a reference to the DOM document where the template is being
  rendered;
* `Context#createDocumentFragment()` is an alias to the same method of the
  target document;
* `Context#createTextNode(text)` is an alias to the same method of the target
  document;
* `Context#createElement(tagName[, namespace])` is an alias to either
  createElement or createElementNS on the target document.
* `Context#importNode(node)` is an alias to the same method of the target
  document
  
```js
/* Creates a <div> with a text child node containing the value passed as a 
   parameter, ie @divtext "foo" renders to <div>foo</div> */
ist.registerHelper("divtext", function(outer, inner, template, fragment) {
	var div = outer.createElement("div");
	var text = outer.createTextNode(inner.value);
	
	div.appendChild(text);
	fragment.appendChild(div);
});
```

`Context` objects can be passed directly to any compiled template `render()`
method.

```js
ist.registerHelper('with', function(outer, inner, template, fragment) {
	fragment.appendChild(
        template.render(inner)
     );
	
	/* Would be the same as :
		fragment.appendChild(
            template.render(
    			inner.value,
    			inner.document
    		)
        );
	*/
});
```

The following members can be used to create new contexts and access their value:

* `Context.value` contains the value wrapped by the `Context` object.
* `Context#createContext(newValue)` returns a new `Context` object with the same
  target document but a new value.

```js
ist.registerHelper('test', function(outer, inner, template, fragment) {
	var testValue = { foo: "bar" },
		testCtx = outer.createContext(testValue);
	
	assert(testValue === testCtx.value);
});
```

The following members can be used to help evaluate expressions:

* `Context#interpolate(string)` replaces expressions in double curly braces
  inside `string` by their value in the rendering context.
* `Context#evaluate(string)` returns the result of evaluating `string` in the
  rendering context.  This method is called by `Context#interpolate()` for each
  double curly braces expression.
  
```js
ist.registerHelper('test', function(outer, inner, template, fragment) {
	var testCtx = outer.createContext({ foo: "bar" });
	
    assert(textCtx.evaluate("foo.toUpperCase()") === "BAR");
	assert(testCtx.interpolate("foo={{ foo }}") === "foo=bar");
});
```

And finally, the following members can be used to change the way expressions are
evaluated:

* `Context#pushScope(scope)` pushes properties of the `scope` object on the
  scope used when evaluating expressions, possibly hiding previously existing
  variables with the same name (from previously pushed scopes of from the
  rendering context).
* `Context#popScope()` undoes what pushScope did, popping the last pushed scope
  object.
  
```js
ist.registerHelper('test', function(outer, inner, template, fragment) {
	var testCtx = outer.createContext({ foo: "bar" });
	
    assert(testCtx.evaluate("foo.toUpperCase()") === "BAR");
	
	testCtx.pushScope({ foo: "baz", hello: "world" });
    assert(testCtx.evaluate("foo.toUpperCase()") === "BAZ");
    assert(testCtx.evaluate("hello") === "world");

	testCtx.pushScope({ foo: "ding" });
    assert(testCtx.evaluate("foo.toUpperCase()") === "DING");
    assert(testCtx.evaluate("hello") === "world");

	testCtx.popScope();
    assert(testCtx.evaluate("foo.toUpperCase()") === "BAZ");
    assert(testCtx.evaluate("hello") === "world");
	
	testCtx.popScope();
    assert(testCtx.evaluate("foo.toUpperCase()") === "BAR");
});
```

### Simple examples

You can define a `@noop` directive that simply renders the inner template
without any context switching as follows:

```js
ist.registerHelper('noop', function(outer, inner, template, fragment) {
	// Render inner template with the current context
    fragment.appendChild(template.render(outer));
});
```

The following example allows disabling part of a tree with a `@disable`
directive.  It simply does not insert any nodes in the fragment parameter.

```js
ist.registerHelper('disabled', function() {
});
```

Say you have a markdown library that sets a `parseMarkdown()` method to turn
markdown code into HTML code.  You could define a `@markdown` directive to
insert rendered markdown in your tree.

```js
ist.registerHelper('markdown', function(outer, inner, template, fragment) {
    // Create temporary container
	var container = outer.createElement('div');

    // Render markdown
	container.innerHTML = parseMarkdown(inner.value);

    // Dump container children into fragment
    while (container.hasChildNodes()) {
        fragment.appendChild(container.firstChild);
    }
});
```

You could then use it as follows:

```html
<script type="text/x-ist" id="template">
	@each articles
		article
			@markdown content
</script>

<script type="text/javascript">
ist.fromScriptTag("template")
   .render({
   	articles: [
   		{ content: "# Title\n## Subtitle" },
   		/* ... */
   	]
   });
</script>
```

### Built-in directives

Here is how the `@if` directive can be defined.

```js
ist.registerHelper('if', function(outer, inner, template, fragment) {
	if (inner.value) {
        fragment.appendChild(template.render(outer));
	}
});
```

Of course the `@unless` directive is very similar.

```js
ist.registerHelper('unless', function(outer, inner, template, fragment) {
    if (!inner.value) {
        fragment.appendChild(template.render(outer));
    }
});
```

Here is how the `@each` directive can be defined.  Note the use of `pushScope`
to define the `loop` variable.  Calling `popScope` is not necessary, as `subCtx`
is used only once.  Additionnaly, the directive could throw an exception when
its argument is not an array.

```js
ist.registerHelper('each', function(outer, inner, template, fragment) {
	var outerValue = outer.value,
        innerValue = inner.value;

	if (Array.isArray(innerValue)) {
		innerValue.forEach(function(item, index) {
			var subCtx = outer.createContext(item);
		
			subCtx.pushScope({
                loop: {
    				first: index === 0,
    				index: index,
    				last: index === innerValue.length - 1,
    				length: innerValue.length,
    				outer: outerValue
    			}
            });

			fragment.appendChild(template.render(subCtx));
		});
	}

	return fragment;
});
```

Finally, here is how `@define` and `@use` are defined.  The helper code for
these is really simple.

```js
// Component store
var defined = {};

ist.registerHelper('define', function(outer, inner, template, fragment) {
    defined[inner.value] = template;
});

ist.registerHelper('use', function(outer, inner, template, fragment) {
    var t = defined[inner.value];

    if (!t) {
        throw new Error("Component " + inner.value + " was not @define-d");
    }

    fragment.appendChild(t.render(outer));
});
```

## Version

This documentation was last updated for ist.js version 0.5.7.

[1]: http://handlebarsjs.com/block_helpers.html
