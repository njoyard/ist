
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

Additionnaly, you can pass a DOMDocument as the second argument to `render()` to
render nodes into an other document.  This is mainly useful when using multiple
windows or frames.

```js
var popup = window.open();
var node = template.render(context, popup.document);

popup.document.body.appendChild(node);
```

Templates can include [directives](#Directives) to change the way they are
rendered depending on context content. Directives start with an `@` symbol and
take an expression as a parameter.

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

ist.js uses indentation to specify node trees.  All children of a same node must
have the same indent.  You can use spaces or tabs, but ist.js will not see a tab
as the equivalent of any number of spaces.

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

## Defining custom directives

ist.js allows defining custom directives.  If you're used to
[handlebars block helpers][1], you'll find out that ist.js directives work in a
very similar way.

A directive helper is registered by calling `ist.registerHelper()` and passing
it a directive name (case-sensitive) and a helper function.

```js
/* Helper for '@foo' */
ist.registerHelper('foo', function(subContext, subTemplate) {
	/* Do stuff */
});
```

Directive helpers must return a DOM node or a DOM document fragment, which will
be inserted in the DOM node tree where the directive is called. Returning
`undefined` (ie. not returning anything) is also allowed and has the same result
as returning an empty document fragment.

Note that you should not use `document` or any of its methods directly in
directive helpers as you don't know the target document the template is being
rendered into.

```js
ist.registerHelper('foo', function(subContext, subTemplate) {
	return this.createTextNode("foo");
});

ist.registerHelper('bar', function(subContext, subTemplate) {
	var fragment = this.createDocumentFragment();
	
	fragment.appendChild(this.createTextNode("foo"));
	fragment.appendChild(this.createTextNode("bar"));
	
	return fragment;
});
```

The first argument a helper receives gives access to the result of the
expression parameter passed when the directive is called.  This result is
wrapped in a [Context object](#Context objects).  For now, just note that the
resulting value is accessible with its `value` property.

```js
/* '@echo' directive
 * Outputs a text node containing its parameter value
 * (usage example: @echo "foo")
 */
ist.registerHelper('echo', function(subContext, subTemplate) {
	return this.createTextNode(subContext.value);
});
```

The second argument helpers are called with is the compiled subtemplate, ie.
all nodes defined as children of the directive.  This example shows how the
`@with` directive just renders its compiled subtemplate using the subcontext
value.

```js
/* The actual '@with' directive helper is
 * a little bit different, more on that later.
 */
ist.registerHelper('with', function(subContext, subTemplate) {
	return subTemplate.render(subContext.value);
});
```

Finally, helpers are called with the current rendering context as `this`.  Like
the first argument, `this` is actually a Context object.

### Context objects

Directive helpers receive `Context` objects to encapsulate rendering contexts as
well as the DOMDocument where templates are rendered.  The following members
give access to the DOMDocument where the template is being rendered:

* `Context.document` is a reference to the document where the template is being
  rendered;
* `Context#createDocumentFragment()` is an alias to the same method of the
  rendering document;
* `Context#createTextNode(text)` is an alias to the same method of the rendering
  document;
* `Context#createElement(tagName[, namespace])` is an alias to either
  createElement or createElementNS on the rendering document.
  
```js
ist.registerHelper("divtext", function(subContext, subTemplate) {
	var fragment = this.createDocumentFragment();
	var div = this.createElement("div");
	var text = this.createTextNode(subContext.value);
	
	div.appendChild(text);
	fragment.appendChild(div);
	return fragment;
});
```

`Context` objects can be passed directly to any compiled template `render()`
method.

```js
ist.registerHelper('test', function(subContext, subTemplate) {
	return subTemplate.render(subContext);
	
	/* Would be the same as :
		return subTemplate.render(
			subContext.value,
			subContext.document
		);
	*/
});
```

The following members can be used to create new contexts and access their value:

* `Context.value` contains the value of the rendering context.
* `Context#createContext(newValue)` returns a new `Context` object with the same
  target document but a new value.

```js
ist.registerHelper('test', function(subContext, subTemplate) {
	var testValue = { foo: "bar" },
		testCtx = this.createContext(testValue);
	
	console.log(testValue === testCtx.value); // true
});
```

The following members can be used to help evaluate expressions:

* `Context#interpolate(string)` replaces expressions in double curly braces
  inside `string` by their value in the rendering context.
* `Context#evaluate(string)` returns the result of evaluating `string` in the
  rendering context.  This method is called by `Context#interpolate()` for each
  double curly braces expression.
  
```js
ist.registerHelper('test', function(subContext, subTemplate) {
	var testCtx = this.createContext({ foo: "bar" });
	
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "BAR"
	console.log(testCtx.interpolate("foo={{ foo }}")); // "foo=bar"
});
```

And finally, the following members can be used to change the way expressions are
evaluated:

* `Context#pushEvalVar(name, value)` adds a variable named `name` with value
  `value` to the expression evaluation context.  Variable values are stacked,
  every new definition hiding any previously defined variable or context
  property with the same name.  This is what is used to set the `loop` variable
  in the `@each` directive helper.
* `Context#popEvalVar(name)` undoes what `pushEvalVar` did, popping the last
  value set for `name` and restoring any previously defined value.
  
```js
ist.registerHelper('test', function(subContext, subTemplate) {
	var testCtx = this.createContext({ foo: "bar" });
	
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "BAR"
	
	testCtx.pushEvalVar("foo", "baz");
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "BAZ"
	
	testCtx.pushEvalVar("foo", "ding");
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "DING"
	
	testCtx.popEvalVar("foo");
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "BAZ"
	
	testCtx.popEvalVar("foo");
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "BAR"
});
```

### Simple examples

You can define a `@noop` directive that simply renders the inner template
without any context switching as follows:

```js
ist.registerHelper('noop', function(subContext, subTemplate) {
	// Render inner template with
});
```

XXX

```js
ist.registerHelper('disabled', function() {
	return this.createDocumentFragment();
});
```

Say you have a markdown library that sets a `parseMarkdown()` method to turn
markdown code into HTML code.  You could define a `@markdown` directive to

```js
/*
 * Syntax: @markdown markdownString
 */
ist.registerHelper('markdown', function(subContext) {
	var container = this.createElement('section');
	
	section.innerHTML = parseMarkdown(subContext.value);
	
	return container;
});
```

## TODO

* simple examples (+ markdown)
* builtin
* error handling
* partials

## Version

This documentation was last updated for ist.js version 0.5.5.

[1]: http://handlebarsjs.com/block_helpers.html
