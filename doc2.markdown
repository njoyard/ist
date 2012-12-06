---
layout: default
id: doc
---

{% assign opencurly = '{{' %}
{% assign closecurly = '}}' %}

Documentation
=============

## Table of contents

<section class="doc-toc">

* <a href="#Getting started">Getting started</a>
* <a href="#Usage">Usage</a>
    * <a href="#Standalone usage">Standalone usage</a>
    * <a href="#AMD usage">AMD usage</a>
* <a href="#Template Syntax">Template Syntax</a>
    * <a href="#Node tree">Node tree</a>
    * <a href="#Comments">Comments</a>
    * <a href="#Element selectors">Element selectors</a>
    * <a href="#Text nodes">Text nodes</a>
    * <a href="#Expressions">Expressions</a>
    * <a href="#Event handlers">Event handlers</a>
    * <a href="#Directives">Directives</a>
        * <a href="#Conditionals">Conditionals</a>
        * <a href="#Context switching">Context switching</a>
        * <a href="#Array iteration">Array iteration</a>
        * <a href="#Object property iteration">Object property iteration</a>
        * <a href="#External template inclusion">External template inclusion</a>
    * <a href="#Partials">Partials</a>
* <a href="#Single node creation">Single node creation</a>
* <a href="#Custom directives">Custom directives</a>
    * <a href="#Context objects">Context objects</a>
    * <a href="#Simple examples">Simple examples</a>
    * <a href="#Built-in directives">Built-in directives</a>
* <a href="#Version">Version</a>

</section>
<section class="doc">


## <a class="nohover" name="Getting started">Getting started</a>

<section class="doc-item">
<section class="doc-desc">
An ist.js template looks like a tree of [CSS selectors](#Element selectors) and
[text nodes](#Text nodes), with embedded [expressions](#Expressions) delimited
by double curly braces.

</section>
<section class="doc-code">
{% highlight css %}
article
    header
        h1 "{{ opencurly }} title {{ closecurly }}"
    p.articleParagraph
        "{{ opencurly }} text {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can deliver templates to the browser using a `<script>` tag.

</section>
<section class="doc-code">
{% highlight html %}
<script id="example-template" type="text/x-ist">
    article
        header
            h1 "{{ opencurly }} title {{ closecurly }}"
        p.articleParagraph
            "{{ opencurly }} text {{ closecurly }}"    
</script>
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can then call `ist()` with the content of this tag, or you can use
`ist.fromScriptTag()`.

</section>
<section class="doc-code">
{% highlight js %}
var template = ist($("#example-template").html());
var template = ist.fromScriptTag("example-template");
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can also directly use strings.

</section>
<section class="doc-code">
{% highlight js %}
var template = ist('h1 "{{ opencurly }} title {{ closecurly }}"');
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The variable `template` in the examples above is a compiled template.  Passing a
context object to the `render()` method of a compiled template renders it into a
DOM node tree.

</section>
<section class="doc-code">
{% highlight js %}
var context = {
        title: "ist.js released",
        text: "ist.js has just been released"
    };
    
var node = template.render(context);

document.body.appendChild(node);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Additionnaly, you can pass a DOMDocument as the second argument to `render()` to
render nodes into an other document.  This is mainly useful when using multiple
windows or frames.

</section>
<section class="doc-code">
{% highlight js %}
var popup = window.open();
var node = template.render(context, popup.document);

popup.document.body.appendChild(node);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Templates can include [directives](#Directives) to change the way they are
rendered depending on context content. Directives start with an `@` symbol and
take an expression as parameter.

</section>
<section class="doc-code">
{% highlight css %}
ul.menu
    @if isAdmin
        li
            a.adminZone "Administration zone"
    @each menuItems
        li
            a[href={{ opencurly }} url {{ closecurly }}] "{{ opencurly }} label {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The example above would be rendered with a context object similar to this one:

</section>
<section class="doc-code">
{% highlight js %}
var context = {
        isAdmin: true,
        menuItems: [
            { url: "home.html", label: "Home" },
            { url: "news.html", label: "News" },
            { url: "contact.html", label: "Contact" }
        ]
    };
    
document.body.appendChild(menuTemplate.render(context));
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Templates can also include [comments](#Comments) and blank lines for clarity.

</section>
<section class="doc-code">
{% highlight css %}
ul.menu
    
    /* Only display admin link if user is an administrator */
    @if isAdmin
        li
            a.adminZone "Administration zone"
            
    @each menuItems
        li
            a[href={{ opencurly }} url {{ closecurly }}] "{{ opencurly }} label {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
ist.js also allows easy [single node creation](#Single node creation) using
`ist.createNode()`.

</section>
<section class="doc-code">
{% highlight js %}
var myLink = ist.createNode("a.link[href=#]");
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Usage">Usage</a>

### <a class="nohover" name="Standalone usage">Standalone usage</a>

<section class="doc-item">
<section class="doc-desc">
When loaded as a standalone `<script>` tag, ist.js registers as `window.ist` (or
just `ist`).

</section>
<section class="doc-code">
{% highlight js %}
var template = ist('h1 "{{ opencurly }} title {{ closecurly }}"');
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
ist.js provides a `noConflict()` method to restore the previous value of
`window.ist` if necessary.

</section>
<section class="doc-code">
{% highlight js %}
var istjs = ist.noConflict();

// window.ist is now back to its previous value
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="AMD usage">AMD usage</a>

<section class="doc-item">
<section class="doc-desc">
You can use ist.js with any AMD loader.

</section>
<section class="doc-code">
{% highlight js %}
require(['ist'], function(ist) {
    var template = ist('h1 "{{ opencurly }} title {{ closecurly }}"'),
        node = template.render({
            title: "Title"
        });
        
    document.body.appendChild(node);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
ist.js implements the AMD plugin interface.  You can store a template in a file
with a `.ist` extension and directly load the compiled template using the plugin
syntax.  Note that ist.js adds the extension automatically.

</section>
<section class="doc-code">
{% highlight js %}
require(['ist!path/to/template'], function(template) {
    var node = template.render({
            title: "Title"
        });
        
    document.body.appendChild(node);
});
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Template Syntax">Template Syntax</a>

### <a class="nohover" name="Node tree">Node tree</a>

<section class="doc-item">
<section class="doc-desc">
ist.js uses indentation to specify node trees, not unlike YAML and Python.  All
children of a same node must have the same indent.  You can use spaces or tabs,
but ist.js will not see a tab as the equivalent of any number of spaces.

</section>
<section class="doc-code">
{% highlight css %}
div.parent
    div.child
        div.grandchild
    div.child
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can start a template with any indent and you may use different levels.  All
that matters is that sibling nodes have the exact same indent; thus, the first
child node defines the indent to use for all its siblings.

</section>
<section class="doc-code">
{% highlight css %}
     div.parent
       div.child
                    div.grandchild
                    div.grandchild
                div.invalid
                         div.invalid
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can use a different indent for nodes at the same tree level provided they
are not siblings.

</section>
<section class="doc-code">
{% highlight css %}
div.parent
    div.child
    div.child
div.parent
           div.child
           div.child
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Comments">Comments</a>

<section class="doc-item">
<section class="doc-desc">
Blank lines and CSS-like block comments are allowed in templates.  They can span
multiple lines but you shouldn't add a node after a comment on the same line as
it may make the node indent ambiguous.

</section>
<section class="doc-code">
{% highlight css %}
/* Comment */
div.parent
    div.child /* Comment */
    
        div.grandchild
        
    /* Multi-line
        comment */
    
    /* Error-prone
     comment
  */    div.child

{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Element selectors">Element selectors</a>

<section class="doc-item">
<section class="doc-desc">
ist.js uses CSS3 selectors to specify elements.  Of course all selectors are
not supported, as they would not make sense.  In general, selectors start with
a tag name.

</section>
<section class="doc-code">
{% highlight css %}
article
    header
        h1
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can add qualifiers to selectors, for example id or class qualifiers.

</section>
<section class="doc-code">
{% highlight css %}
ul.menu
    li#item1
        a
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can also set attributes using an attribute qualifier (which has the same
syntax as a CSS3 attribute value selector).

</section>
<section class="doc-code">
{% highlight css %}
ul
    li
        a[href=index.html]
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
ist.js also allows setting properties on elements, using an attribute qualifier
with a `.` prefix.

</section>
<section class="doc-code">
{% highlight css %}
div[.className=header]
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Qualifiers can be mixed in any order.  When multiple id qualifiers, or multiple
attribute qualifiers for the same attribute are present, only the last one
matters.  Spaces between qualifiers are not allowed.

</section>
<section class="doc-code">
{% highlight css %}
ul.menu.header
    li
        a.menuitem#item1[href=index.html]
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When you want to create `<div>`s, ist.js allows omitting the tag name in
selectors.  Of course you will need at least one qualifier.

</section>
<section class="doc-code">
{% highlight css %}
.implicitDiv
	#implicitDiv
	[implicit=yes]
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Text nodes">Text nodes</a>

<section class="doc-item">
<section class="doc-desc">
You can add text nodes in a template by enclosing text with single or double
quotes.  Text nodes cannot have children.

</section>
<section class="doc-code">
{% highlight css %}
h1
    "Title"
h2
    'Subtitle'
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Text nodes can also be specified on the same line as their parent node; in this
case they must be separated by at least one space.

</section>
<section class="doc-code">
{% highlight css %}
h1 "Title"
h2      'Subtitle'
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
This does not prevent adding more children to the parent node.  These examples
produce the same result, though the first one might not be as clear.  The choice
is yours.

</section>
<section class="doc-code">
{% highlight css %}
div "Text content"
    div.child
    
div
    "Text content"
    div.child
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Text nodes can contain escaped characters, including their delimiting quote.

</section>
<section class="doc-code">
{% highlight css %}
h1
    "you 'can' include \"escaped\" ch\x41ra\u0043ters"
h2
    'you \'can\' include "escaped" ch\x41ra\u0043ters'
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Expressions">Expressions</a>

<section class="doc-item">
<section class="doc-desc">
ist.js expressions can be used to include values from the rendering context in
text nodes or element attribute and property values.  They are delimited by
double curly braces.

</section>
<section class="doc-code">
{% highlight css %}
ul.links
    li
        a[href={{ opencurly }} url {{ closecurly }}] "{{ opencurly }} label {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can include any valid Javascript expression in an ist.js expression.  All
rendering context properties are accessible as variables in expressions,
provided they are valid identifiers.

</section>
<section class="doc-code">
{% highlight css %}
article[style=color: {{ opencurly }} read ? "blue" : "red" {{ closecurly }}]
    h1
        "{{ opencurly }} title.toUpperCase() {{ closecurly }}"
    h2
        "{{ opencurly }} \"don't forget escaping quotes\" {{ closecurly }}"
    "{{ opencurly }} path.to.nested.property {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The rendering context itself is accessible as `this` in expressions, and thus
these two examples are equivalent.

</section>
<section class="doc-code">
{% highlight css %}
h1 "{{ opencurly }} title {{ closecurly }}"

h1 "{{ opencurly }} this.title {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The `this` keyword is mainly useful to access properties that are not valid
identifiers, using the square bracket notation.

</section>
<section class="doc-code">
{% highlight css %}
"{{ opencurly }} this[12] {{ closecurly }}"
"{{ opencurly }} this['weird property name'] {{ closecurly }}"
"{{ opencurly }} this[\"typeof\"] {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Expressions cannot be used inside id or class qualifiers, but you can use
attribute qualifiers instead.

</section>
<section class="doc-code">
{% highlight css %}
div[class={{ opencurly }} cssClass {{ closecurly }}]
div[.className={{ opencurly }} cssClass {{ closecurly }}]
div[id={{ opencurly }} id {{ closecurly }}]
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Event handlers">Event handlers</a>

<section class="doc-item">
<section class="doc-desc">
ist.js can associate event handlers to elements, using a similar syntax to
attribute/property qualifiers, but prefixed with an exclamation mark.

</section>
<section class="doc-code">
{% highlight css %}
ul#menu
	@each menu
		li[!click=action]
			"{{ opencurly }} label {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The value after the equal sign must be an ist.js expression, without any curly
braces, and of course it should return a function.

</section>
<section class="doc-code">
{% highlight js %}
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
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Directives">Directives</a>

<section class="doc-item">
<section class="doc-desc">
ist.js directives allow controlling the rendering of templates depending on
context content. The general syntax is as follows, where `parameter` can be any
ist.js expression.  Note that expressions don't need braces when used with
directives.

You can also [define your own directives](#Defining custom directives).

</section>
<section class="doc-code">
{% highlight css %}
div.parent
    @directive parameter
        div.subtemplate
{% endhighlight %}
</section>
</section>

#### <a class="nohover" name="Conditionals">Conditionals</a>

<section class="doc-item">
<section class="doc-desc">
You can use an `@if` directive to toggle rendering of a section of template
depending on the value of an expression.

</section>
<section class="doc-code">
{% highlight css %}
@if user.isAdmin
    a[href=admin.html] "Administration zone"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The `@unless` directives has the same goal, just reversed.

</section>
<section class="doc-code">
{% highlight css %}
@unless user.isRegistered
    a[href=register.html] "Sign up now !"
{% endhighlight %}
</section>
</section>

#### <a class="nohover" name="Context switching">Context switching</a>

<section class="doc-item">
<section class="doc-desc">
The `@with` directive allows context switching.  When accessing the same part of
the context repeatedly, you may want to use it to make the template more
readable.

</section>
<section class="doc-code">
{% highlight css %}
div.userData
    a[href=/userpanel/{{ opencurly }} user.id {{ closecurly }}] "{{ opencurly }} user.name {{ closecurly }}"

div.userData
    @with user
        a[href=/userpanel/{{ opencurly }} id {{ closecurly }}] "{{ opencurly }} name {{ closecurly }}"

{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The `@with` directive can also be used to hard-code some parts of the template.

</section>
<section class="doc-code">
{% highlight css %}
@with { version: '0.5.4', built: '2012-11-20' }
	footer
		"ist.js version {{ opencurly }} version {{ closecurly }} built on {{ opencurly }} built {{ closecurly }}"
{% endhighlight %}
</section>
</section>

#### <a class="nohover" name="Array iteration">Array iteration</a>

<section class="doc-item">
<section class="doc-desc">
The `@each` directive allows rendering a section of template repeatedly for each
element of an array.  For every iteration, the rendering context is switched to
a new element in the array.

</section>
<section class="doc-code">
{% highlight css %}
ul.menu
	@each menu
		a[href={{ opencurly }} url {{ closecurly }}] "{{ opencurly }} label {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The example above would be rendered with a context similar to this one.

</section>
<section class="doc-code">
{% highlight js %}
var context = {
        menuItems: [
            { url: "home.html", label: "Home" },
            { url: "news.html", label: "News" },
            { url: "contact.html", label: "Contact" }
        ]
    };
    
document.body.appendChild(menuTemplate.render(context));
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When using an `@each` directive, the special `loop` variable is set to an object
with details about the iteration.

* `loop.index` is the 0-based index of the rendered item in the array
* `loop.length` is the size of the array
* `loop.first` is true when `loop.index === 0`
* `loop.last` is true when `loop.index === loop.length - 1`
* `loop.outer` is a reference to the outer context object

</section>
<section class="doc-code">
{% highlight css %}
@each array
	@if loop.first
		"First item"
		
	"Item {{ opencurly }} loop.index + 1 {{ closecurly }} of {{ opencurly }} loop.length {{ closecurly }} is {{ opencurly }} this {{ closecurly }}"
	
	@if loop.last
		"Last item"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The `loop` variable hides any `loop` property on the rendering context, but you
can still access it using `this`.

</section>
<section class="doc-code">
{% highlight css %}
@each array
	"Item.loop = {{ opencurly }} this.loop {{ closecurly }}"
{% endhighlight %}
</section>
</section>

#### <a class="nohover" name="Object property iteration">Object property iteration</a>

<section class="doc-item">
<section class="doc-desc">
The `@eachkey` directive is very similar to the `@each` directive, but it loops
over an objects own properties, setting the variables `key` and `value`.

</section>
<section class="doc-code">
{% highlight css %}
@eachkey { home: "home.html", news: "news.html" }
	a[href={{ opencurly }} value {{ closecurly }}]
		"{{ opencurly }} key {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When using `@eachkey`, the `loop` variable is set to an object with details 
about the iteration.

* `loop.index` is the 0-based index of the rendered item in the array
* `loop.length` is the size of the array
* `loop.first` is true when `loop.index === 0`
* `loop.last` is true when `loop.index === loop.length - 1`
* `loop.outer` is a reference to the outer context object
* `loop.object` is a reference to the enumerated object 

</section>
</section>
#### <a class="nohover" name="External template inclusion">External template inclusion</a>

<section class="doc-item">
<section class="doc-desc">
The `@include` directive enables including an other template that will be
rendered using the current rendering context.  When using `<script>` tags, you
can pass an ID as a string to the `@include` directive.  Note that the order of
definition of `<script>` tags does not matter.

</section>
<section class="doc-code">
{% highlight html %}
<script type="text/x-ist" id="menu">
	ul#menu
		@each items
			@include "menu-item"
</script>

<script type="text/x-ist" id="menu-item">
	li
		a[href={{ opencurly }} url {{ closecurly }}] "{{ opencurly }} label {{ closecurly }}"
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
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When using an AMD loader, you can also load modules from other files when your
templates are loaded with the `ist!` plugin syntax.  Simply pass their relative
path as a string parameter to `@include`.  You can omit the `.ist` extension.

</section>
<section class="doc-code">
{% highlight css %}
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
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When loading a template file with the `ist!` AMD plugin, `@include`d templates
are automatically loaded as dependencies.

</section>
<section class="doc-code">
{% highlight js %}
require(['ist!templates/main'], function(mainTemplate) {
	/* templates/common/{header,footer} are added as AMD
	   dependencies to 'ist!templates/main', and thus
	   are loaded automatically */
	   
	mainTemplate.render(/* ... */);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When a template is loaded from a string or a `<script>` tag however, any 
`@include`d template must be either an other `<script>` tag ID, or an already
loaded AMD module name.

</section>
<section class="doc-code">
{% highlight html %}
<script type="text/x-ist" id="main">
	@include "included-template"
</script>
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The "included-template" module name above may resolve to an ist.js compiled
template.

</section>
<section class="doc-code">
{% highlight js %}
define("included-template", ["ist!some/template"], function(tmpl) {
	return tmpl;
});

require(["ist", "included-template"], function(ist) {
	ist.fromScriptTag("main").render(/* ... */);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
It may also resolve to a template string.

</section>
<section class="doc-code">
{% highlight js %}
define("included-template", [], function() {
	return "div\n  h1 'included content'";
});

require(["ist", "included-template"], function(ist) {
	ist.fromScriptTag("main").render(/* ... */);
});
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Partials">Partials</a>

<section class="doc-item">
<section class="doc-desc">
Partials enable you to access part of a template as if it were an other
template.  This is often useful for arrays rendered using and `@each` directive
that you need to update.

Partials are declared with the `!name` notation next to an element.

</section>
<section class="doc-code">
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
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Partial names must be specified last on an element line, and must be preceded by
at least one space or tab character.  If an inline text node is present, the
partial name must be placed after it.

They can be accessed using the `findPartial()` method of a compiled template,
which takes the partial name as argument.  It returns the first matching
partial, which can be manipulated as any other compiled template.

</section>
<section class="doc-code">
{% highlight js %}
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
</section>
</section>

## <a class="nohover" name="Single node creation">Single node creation</a>

<section class="doc-item">
<section class="doc-desc">
ist.js provides a shortcut "single node" creation interface that support the
same syntax as full template files.  Just call `ist.createNode()` and pass it
an element selector.

</section>
<section class="doc-code">
{% highlight js %}
var myDiv = ist.createNode(
		"div.class#id[attribute=Value]"
	);
{% endhighlight %}
</section>
</section>
<section class="doc-item">
<section class="doc-desc">
    
It also supports rendering with context.

</section>
<section class="doc-code">
{% highlight js %}
var myDiv = ist.createNode(
		"div[class={{ opencurly }} cls {{ closecurly }}]",
		{ cls: 'myclass' }
	);
{% endhighlight %}
</section>
</section>
<section class="doc-item">
<section class="doc-desc">
    
Actually `ist.createNode()` is able to create several nodes at once using a
CSS-like angle-bracket syntax.

</section>
<section class="doc-code">
{% highlight js %}
var myParentDiv = ist.createNode(
		'div.parent > div.child > "{{ opencurly }} text {{ closecurly }}"',
		{ text: "Text node content" }
	);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
And you can even use directives.

Please note however that `createNode` has a quite naive angle-bracket parser,
and as such does not support angle brackets anywhere else than between nodes.
Therefore you should only use it for trivial node tree creation.

</section>
<section class="doc-code">
{% highlight js %}
var myParentDiv = ist.createNode(
		'div.parent > @each children > "{{ opencurly }} name {{ closecurly }}"',
		{
			children: [
				{ name: 'alice' },
				{ name: 'bob' }
			]
		}
	);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Finally, you can create nodes in an alternate document by passing it as third
argument.

</section>
<section class="doc-code">
{% highlight js %}
var popupDiv = ist.createNode(
		'div.inPopup', 
		{},
		popup.document
	);
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Custom directives">Custom directives</a>

<section class="doc-item">
<section class="doc-desc">
ist.js allows defining custom directives, and built-in directives are actually
defined the same way.  If you're used to [handlebars block helpers][1], you'll
find that ist.js directives work in a very similar way.

A directive helper is registered by calling `ist.registerHelper()` and passing
it a directive name (case-sensitive) and a helper function.

</section>
<section class="doc-code">
{% highlight js %}
/* Helper for '@foo' */
ist.registerHelper('foo', function(subContext, subTemplate) {
	/* Do stuff */
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Directive helpers must return a DOM node or a DOM document fragment, which will
be inserted in the DOM node tree where the directive is called. Returning
`undefined` (ie. not returning anything) is also allowed and has the same result
as returning an empty document fragment.

Note that you should not use `document` or any of its methods directly in
directive helpers as you don't know the target document the template is being
rendered into.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('foo', function(subContext, subTemplate) {
	return this.createTextNode("foo");
});

ist.registerHelper('bar', function(subContext, subTemplate) {
	var fragment = this.createDocumentFragment();
	
	fragment.appendChild(this.createTextNode("foo"));
	fragment.appendChild(this.createTextNode("bar"));
	
	return fragment;
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The first argument a helper receives gives access to the result of the
expression parameter passed when the directive is called.  This result is
wrapped in a [Context object](#Context objects).  For now, just note that the
resulting value is accessible with its `value` property.

</section>
<section class="doc-code">
{% highlight js %}
/* '@echo' directive
 * Outputs a text node containing its parameter value
 * (usage example: @echo "foo")
 */
ist.registerHelper('echo', function(subContext, subTemplate) {
	return this.createTextNode(subContext.value);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The second argument helpers are called with is the compiled subtemplate, ie.
all nodes defined as children of the directive.  This example shows how the
`@with` directive just renders its compiled subtemplate using the subcontext
value.

</section>
<section class="doc-code">
{% highlight js %}
/* The actual '@with' directive helper is
 * a little bit different, more on that later.
 */
ist.registerHelper('with', function(subContext, subTemplate) {
	return subTemplate.render(subContext.value);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Helpers are called with the current rendering context as `this`.  Like the first
argument, `this` is a Context object.  The first argument to helpers can be
`undefined` when a directive is used without any argument, thus you might prefer
always calling Context object utilities on `this`.

Finally, you can throw exceptions in directive helpers.  Those will be reported
with added context data (such as the current template and line number).

</section>
</section>
### <a class="nohover" name="Context objects">Context objects</a>

<section class="doc-item">
<section class="doc-desc">
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
  
</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper("divtext", function(subContext, subTemplate) {
	var fragment = this.createDocumentFragment();
	var div = this.createElement("div");
	var text = this.createTextNode(subContext.value);
	
	div.appendChild(text);
	fragment.appendChild(div);
	return fragment;
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
`Context` objects can be passed directly to any compiled template `render()`
method.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('with', function(subContext, subTemplate) {
	return subTemplate.render(subContext);
	
	/* Would be the same as :
		return subTemplate.render(
			subContext.value,
			subContext.document
		);
	*/
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The following members can be used to create new contexts and access their value:

* `Context.value` contains the value of the rendering context.
* `Context#createContext(newValue)` returns a new `Context` object with the same
  target document but a new value.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('test', function(subContext, subTemplate) {
	var testValue = { foo: "bar" },
		testCtx = this.createContext(testValue);
	
	console.log(testValue === testCtx.value); // true
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The following members can be used to help evaluate expressions:

* `Context#interpolate(string)` replaces expressions in double curly braces
  inside `string` by their value in the rendering context.
* `Context#evaluate(string)` returns the result of evaluating `string` in the
  rendering context.  This method is called by `Context#interpolate()` for each
  double curly braces expression.
  
</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('test', function(subContext, subTemplate) {
	var testCtx = this.createContext({ foo: "bar" });
	
	console.log(testCtx.evaluate("foo.toUpperCase()")); // "BAR"
	console.log(testCtx.interpolate("foo={{ opencurly }} foo {{ closecurly }}")); // "foo=bar"
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
And finally, the following members can be used to change the way expressions are
evaluated:

* `Context#pushEvalVar(name, value)` adds a variable named `name` with value
  `value` to the expression evaluation context.  Variable values are stacked,
  every new definition hiding any previously defined variable or context
  property with the same name.  This is what is used to set the `loop` variable
  in the `@each` directive helper.
* `Context#popEvalVar(name)` undoes what `pushEvalVar` did, popping the last
  value set for `name` and restoring any previously defined value.
  
</section>
<section class="doc-code">
{% highlight js %}
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
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Simple examples">Simple examples</a>

<section class="doc-item">
<section class="doc-desc">
You can define a `@noop` directive that simply renders the inner template
without any context switching as follows:

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('noop', function(subContext, subTemplate) {
	// Render inner template with the current context
	return subTemplate.render(this);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The following example allows disabling part of a tree with a `@disable`
directive.  It returns an empty document fragment, but could as well return
nothing.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('disabled', function() {
	return this.createDocumentFragment();
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Say you have a markdown library that sets a `parseMarkdown()` method to turn
markdown code into HTML code.  You could define a `@markdown` directive to
insert rendered markdown in your tree.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('markdown', function(subContext) {
	var container = this.createElement('section');
	
	section.innerHTML = parseMarkdown(subContext.value);
	
	return container;
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You could then use it as follows:

</section>
<section class="doc-code">
{% highlight html %}
<script type="text/x-ist" id="template">
	@each articles
		article
			@markdown content
</script>

<script type="text/javascript">
ist.fromScriptTag("template")
   .render({
   	articles: [
   		{ content: "# <a class="nohover" name="Title\n## Subtitle" },">Title\n## Subtitle" },</a>
   		/* ... */
   	]
   });
</script>
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Built-in directives">Built-in directives</a>

<section class="doc-item">
<section class="doc-desc">
Here is how the `@if` directive is defined.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('if', function(ctx, tmpl) {
	if (ctx.value) {
		return tmpl.render(this);
	}
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Of course the `@unless` directive is very similar.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('unless', function(ctx, tmpl) {
	if (!ctx.value) {
		return tmpl.render(this);
	}
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Examples for a `@with` directive have been shown above, here is the actual code.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('with', function(ctx, tmpl) {
	return tmpl.render(ctx);
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The code for `@each` is still quite simple.  Note the use of `pushEvalVar()` to
define the `loop` variable.  Calling `popEvalVar()` is not really necessary, as
`sctx` is destroyed immediately.  Additionnaly, the directive could throw an
exception when its argument is not an array.

</section>
<section class="doc-code">
{% highlight js %}
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
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The code for `@eachkey` is also very similar.  `pushEvalVar()` is not used here
as we create a new context object that has nothing to do with the original
rendering context.  As with the `@each` directive, it would be possible to add
more checks and throw exceptions when the directive argument is not what we
expect.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('eachkey', function(ctx, tmpl) {
	var fragment = this.createDocumentFragment(),
		outer = this.value,
		value = ctx.value,
		keys;

	if (value) {
		keys = Object.keys(value);
		keys.forEach(function(key, index) {
			var sctx = ctx.createContext({
				key: key,
				value: value[key],
				loop: {
					first: index == 0,
					index: index,
					last: index == keys.length - 1,
					length: keys.length,
					object: value,
					outer: outer
				}
			});
			
			fragment.appendChild(tmpl.render(sctx));
		});
	}

	return fragment;
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Finally, here is the code for the `@include` directive.  It looks for `<script>`
tags and already loaded AMD modules, and renders what it finds.  Note that
the `ist!` requireJS plugin code also looks for `@include` directives in
templates in order to set included templates as dependencies.

Also note that `isAMD` is the result of looking for a global `define` function
and checking whether `define.amd` is true.

</section>
<section class="doc-code">
{% highlight js %}
ist.registerHelper('include', function(ctx, tmpl) {
	var what = ctx.value.replace(/\.ist$/, ''),
		scripts, found, tryReq;
	
	found = findScriptTag(what);
	
	if (isAMD)
	{
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
				// Pass
			}
		}
	}
	
	if (!found) {
		throw new Error("Cannot find included template '" + what + "'");
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
</section>
</section>

## <a class="nohover" name="Version">Version</a>

<section class="doc-item">
<section class="doc-desc">
This documentation was last updated for ist.js version 0.5.5.

[1]: http://handlebarsjs.com/block_helpers.html
</section>
</section>


</section>
