
## Getting started

An ist.js template looks like a tree of CSS selectors and text nodes, with
embedded expressions delimited by double curly braces.

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

Templates can include directives to change the way they are rendered depending
on context content. Directives start with an `@` symbol and take an expression
as a parameter.

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

Templates can also include comments and blank lines for clarity.

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
template:

```js
define("included-template", ["ist!some/template"], function(tmpl) {
	return tmpl;
});

require(["ist", "included-template"], function(ist) {
	ist.fromScriptTag("main").render(/* ... */);
});
```

It may also resolve to a template string:

```js
define("included-template", [], function() {
	return "div\n  h1 'included content'";
});

require(["ist", "included-template"], function(ist) {
	ist.fromScriptTag("main").render(/* ... */);
});
```

## Partials

## Defining custom directives

## Error reporting

## Version

This documentation was last updated for ist.js version 0.5.5.

