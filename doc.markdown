---
layout: default
id: doc
---

{% assign opencurly = '{{' %}
{% assign closecurly = '}}' %}

Documentation
=============

<section class="doc-toc">

* <a href="#Getting started">Getting started</a>
* <a href="#Usage">Usage</a>
    * <a href="#Standalone usage">Standalone usage</a>
    * <a href="#AMD usage">AMD usage</a>
    * <a href="#Compiling">Compiling</a>
    * <a href="#Rendering">Rendering</a>
    * <a href="#Updating">Updating</a>
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
        * <a href="#Components">Components</a>
        * <a href="#External template inclusion">External template inclusion</a>
    * <a href="#Partials">Partials</a>
* <a href="#Single node creation">Single node creation</a>
* <a href="#Custom directives">Custom directives</a>
    * <a href="#Definition and syntax">Definition and syntax</a>
    * <a href="#Handling updates">Handling updates</a>
    * <a href="#Context objects">Context objects</a>
* <a href="#Version">Version</a>

</section>
<section class="doc">


## <a class="nohover" name="Getting started">Getting started</a><a class="toplink" href="#top">top</a>

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
`ist.script()`.

</section>
<section class="doc-code">
{% highlight js %}
var template = ist($("#example-template").html());
var template = ist.script("example-template");
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can also directly pass a string to `ist()`.

</section>
<section class="doc-code">
{% highlight js %}
var template = ist('h1 "{{ opencurly }} title {{ closecurly }}"');
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The variable `template` in the examples above is called a compiled template.
Passing a context object to the `render()` method of a compiled template renders
it into a DOM node tree.

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
Additionnaly, you can pass a DOM document as the second argument to `render()`
to render nodes into an other document.  This is mainly useful when using
multiple windows or frames.

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
You can update what ist.js rendered by calling the `update()` method.

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
    
var rendered = menuTemplate.render(context);
document.body.appendChild(rendered);

context.isAdmin = false;
context.menuItems.push({ url: "shop.html", label: "Shop" });
rendered.update();
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
ist.js also allows easy [single node creation](#Single node creation) using
`ist.create()`.

</section>
<section class="doc-code">
{% highlight js %}
var myLink = ist.create("a.link[href=#]");
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Usage">Usage</a><a class="toplink" href="#top">top</a>

### <a class="nohover" name="Standalone usage">Standalone usage</a><a class="toplink" href="#top">top</a>

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

### <a class="nohover" name="AMD usage">AMD usage</a><a class="toplink" href="#top">top</a>

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

### <a class="nohover" name="Compiling">Compiling</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
Calling `ist()` with a template string compiles it and returns the compiled
template.

</section>
<section class="doc-code">
{% highlight js %}
var compiled = ist('h1 "{{ opencurly }} title {{ closecurly }}"');
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Templates stored in a `<script>` tag are compiled when you get them using
`ist.script()`.

</section>
<section class="doc-code">
{% highlight html %}
<script id="example-template" type="text/x-ist">
    article
        h1 "{{ opencurly }} title {{ closecurly }}"
        p "{{ opencurly }} text {{ closecurly }}"    
</script>

<script>
    var compiled = ist.script("example-template");
</script>
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When loading templates with the `ist!` AMD plugin, what you get are also
compiled templates.

</section>
<section class="doc-code">
{% highlight js %}
define(['ist!path/to/template'], function(compiledTemplate) {
    /* ... */ 
});
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Rendering">Rendering</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
Rendering a compiled template is done by calling its `render()` method.  When
your template uses [expressions](#Expressions), you can pass a context object to
use as an argument.

</section>
<section class="doc-code">
{% highlight js %}
var compiled = ist('h1 "{{ opencurly }} title {{ closecurly }}"'),
    rendered = compiled.render({ title: "Hello, world !" });
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can also pass a DOM document as a second argument when the rendered nodes
are to be put in a separate window or frame.

</section>
<section class="doc-code">
{% highlight js %}
var popup = window.open(),
    compiled = ist('h1 "{{ opencurly }} title {{ closecurly }}"'),
    rendered = compiled.render(
        { title: "Hello, world !" },
        popup.document
    );
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The result from `render()` is a DOM DocumentFragment.  If you are not familiar
with them, a DocumentFragment is a transparent container node that can contain
child nodes as any other DOM node, but that disappears once you insert it in an
other node.

</section>
<section class="doc-code">
{% highlight html %}
<!-- DocumentFragment content -->
    <h1>Hello, world !</h1>

<!-- Document content -->
<div id="container"></div>

<!-- After calling container.appendChild(fragment): -->
<div id="container">
    <!-- The fragment still exists, but outside of
    the document, and it is now empty -->
    <h1>Hello, world !</h1>
</div>
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
As such, you can directly insert what `render()` returns into your document.

</section>
<section class="doc-code">
{% highlight js %}
var container = document.querySelector("#container"),
    compiled = ist('h1 "{{ opencurly }} title {{ closecurly }}"'),
    rendered = compiled.render({ title: "Hello, world !" });

container.appendChild(rendered);
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Updating">Updating</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
The DocumentFragment returned by `render()` has an additional `update()` method.
If you keep a reference to the fragment even after having inserted it in your
document, you can use this method to update the rendered nodes by passing it
an updated context object.

</section>
<section class="doc-code">
{% highlight js %}
var container = document.querySelector("#container"),
    compiled = ist('h1 "{{ opencurly }} title {{ closecurly }}"'),
    rendered = compiled.render({ title: "Hello, world !" });

container.appendChild(rendered);
// <h1>Hello, world !</h1>

rendered.update({ title: "My Web App" });
// <h1>My Web App</h1>
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You can also call `update()` without any argument, in which case it will reuse
the same context object.

</section>
<section class="doc-code">
{% highlight js %}
var container = document.querySelector("#container"),
    compiled = ist('h1 "{{ opencurly }} title {{ closecurly }}"'),
    context = { title: "Hello, world !" },
    rendered = compiled.render(context);

container.appendChild(rendered);
// <h1>Hello, world !</h1>

context.title = "My Web App";
rendered.update();
// <h1>My Web App</h1>
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Template Syntax">Template Syntax</a><a class="toplink" href="#top">top</a>

### <a class="nohover" name="Node tree">Node tree</a><a class="toplink" href="#top">top</a>

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

### <a class="nohover" name="Comments">Comments</a><a class="toplink" href="#top">top</a>

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

### <a class="nohover" name="Element selectors">Element selectors</a><a class="toplink" href="#top">top</a>

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

<section class="doc-item">
<section class="doc-desc">
If you have many qualifiers, you may want to have them on separate lines to improve readability.  You can escape newlines with a backslash to make ist.js ignore them.  All spaces before the backslash and on the beginning of the following line will be ignored, but take care not to leave spaces _after_ the escaping backslash.

</section>
<section class="doc-code">
{% highlight css %}
.div-with-very-long-selector-qualifier-list#and-long-id \
    [and-long-attribute-list=value1][and-long-attribute-list-2=value2] \
    [and-long-attribute-list-3=value3][and-long-attribute-list-4=value4]
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Text nodes">Text nodes</a><a class="toplink" href="#top">top</a>

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

### <a class="nohover" name="Expressions">Expressions</a><a class="toplink" href="#top">top</a>

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
You can define global variables that will be usable in any expression using `ist.global("name", "value")`.  Context variables with the same name will overwrite those.

</section>
<section class="doc-code">
{% highlight js %}
ist.global("upper", function(text) {
    return text.toUpperCase();
});
{% endhighlight %}
</section>
</section>

{% highlight css %}
<section class="doc-item">
<section class="doc-desc">
"{{ opencurly }} upper('will be uppercased') {{ closecurly }}"
</section>
<section class="doc-code">
{% endhighlight %}

Expressions cannot be used inside id or class qualifiers, but you can use
attribute qualifiers instead.

{% highlight css %}
</section>
</section>
<section class="doc-item">
<section class="doc-desc">
div[class={{ opencurly }} cssClass {{ closecurly }}]
div[.className={{ opencurly }} cssClass {{ closecurly }}]
div[id={{ opencurly }} id {{ closecurly }}]
</section>
<section class="doc-code">
{% endhighlight %}

</section>
</section>
### <a class="nohover" name="Event handlers">Event handlers</a><a class="toplink" href="#top">top</a>

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

### <a class="nohover" name="Directives">Directives</a><a class="toplink" href="#top">top</a>

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

#### <a class="nohover" name="Conditionals">Conditionals</a><a class="toplink" href="#top">top</a>

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
The `@unless` directive has the same goal, just reversed.

</section>
<section class="doc-code">
{% highlight css %}
@unless user.isRegistered
    a[href=register.html] "Sign up now !"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The `@else` directive can be used just after a `@if` or `@unless` directive to
match the opposite condition.

</section>
<section class="doc-code">
{% highlight css %}
@if user.isAdmin
    a[href=admin.html] "Administration zone"
@else
    "No admin zone for you :("
{% endhighlight %}
</section>
</section>

#### <a class="nohover" name="Context switching">Context switching</a><a class="toplink" href="#top">top</a>

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

#### <a class="nohover" name="Array iteration">Array iteration</a><a class="toplink" href="#top">top</a>

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
		
    "Item {{ opencurly }} loop.index + 1 {{ closecurly }} of {{ opencurly }} loop.length {{ closecurly }}"
    " is {{ opencurly }} this {{ closecurly }}"
	
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

#### <a class="nohover" name="Object property iteration">Object property iteration</a><a class="toplink" href="#top">top</a>

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
#### <a class="nohover" name="Components">Components</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
The `@define` and `@use` directives can be used to define components (or what
other templating engines also call macros).  This enables reusing parts of
templates.  To define a component, use the `@define` directive with the
component name as a parameter.

</section>
<section class="doc-code">
{% highlight css %}
@define "article"
    .article
        h1 "{{ opencurly }} title {{ closecurly }}"
        .content "{{ opencurly }} text {{ closecurly }}"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The component name can be any string value.  Any existing component with the
same name will be overriden.  You can then use the component with the `@use`
directive.

</section>
<section class="doc-code">
{% highlight css %}
/* articles should be an array of objects with title and text properties */
@each articles
    @use "article"
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
There is no direct way to pass a specific context to a component when
`@use`-ing it, but you can use the `@with` directive to achieve the same.

</section>
<section class="doc-code">
{% highlight css %}
@with { title: "My article", text: "Hello, world !" }
    @use "article"
{% endhighlight %}
</section>
</section>

#### <a class="nohover" name="External template inclusion">External template inclusion</a><a class="toplink" href="#top">top</a>

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
		ist.script("menu").render([
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
	ist.script("main").render(/* ... */);
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
	ist.script("main").render(/* ... */);
});
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Partials">Partials</a><a class="toplink" href="#top">top</a>

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

They can be accessed using the `partial()` method of a compiled template, which
takes the partial name as argument.  It returns the first matching partial,
which can be manipulated as any other compiled template.

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
        partial = myTemplate.partial("tweet");
        
    container.appendChild(
        partial.render({ author: author, text: text })
    );
}
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Single node creation">Single node creation</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
ist.js provides a shortcut "single node" creation interface that support the
same syntax as full template files.  Just call `ist.create()` and pass it an
element selector.

</section>
<section class="doc-code">
{% highlight js %}
var myDiv = ist.create(
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
var myDiv = ist.create(
		"div[class={{ opencurly }} cls {{ closecurly }}]",
		{ cls: 'myclass' }
	);
{% endhighlight %}
</section>
</section>
    
<section class="doc-item">
<section class="doc-desc">
`ist.create()` is also able to create several nodes at once using a CSS-like
angle-bracket syntax.

</section>
<section class="doc-code">
{% highlight js %}
var myParentDiv = ist.create(
		'div.parent > div.child > "{{ opencurly }} text {{ closecurly }}"',
		{ text: "Text node content" }
	);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
And you can even use directives.

Please note however that `create` has a quite naive angle-bracket parser, and as
such does not support angle brackets anywhere else than between nodes.
Therefore you should only use it for trivial node tree creation.

</section>
<section class="doc-code">
{% highlight js %}
var myParentDiv = ist.create(
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
var popupDiv = ist.create(
		'div.inPopup', 
		{},
		popup.document
	);
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Custom directives">Custom directives</a><a class="toplink" href="#top">top</a>

### <a class="nohover" name="Definition and syntax">Definition and syntax</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
ist.js allows defining custom directives, and built-in directives are actually
defined the same way.  If you're used to [handlebars block helpers][1], you'll
find that ist.js directives work in a very similar way.

A directive helper is registered by calling `ist.helper()` and passing it a
directive name (case-sensitive) and a helper function.

</section>
<section class="doc-code">
{% highlight js %}
/* Helper for '@foo' */
ist.helper("foo", function(context, value, template, fragment) {
	/* Do stuff */
});
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The arguments passed to helpers are:

* `context`: a [Context object](#Context objects) for the outer rendering
  context, ie. the value of the rendering context where the directive is called;
* `value`: the value that is passed as an argument to the directive; this
  argument is undefined when no parameter is passed;
* `template`: an ist compiled template that enables access to nodes defined as
  children of the directive;
* `fragment`: a DocumentFragment where the directive should render nodes.  When
  updating a previously rendered template, it contains all nodes the directive
  rendered; otherwise it is empty.

Here are some example calls to `@foo` with the parameters the helper receives:

</section>
<section class="doc-code">
{% highlight css %}
@with { hello: "world" }
    /* @foo called with a parameter, the handler receives:
        - context: a Context object for { hello: "world" }
        - value: "world"
        - template: a compiled ist template for
                div.childA
                div.childB
     */
    @foo hello
        div.childA
        div.childB

    /* @foo called without a parameter, the handler receives:
        - context: a Context object for { hello: "world" }
        - value: undefined
        - template: a compiled ist template for
                div.child
                    div.grandChild
     */
    @foo
        div.child
            div.grandChild
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
To create nodes from a directive helper, you should not use `document` or any of
its methods, as you don't know which DOM document your directive will be used
to create nodes in.  You can use helper properties and methods of the context
argument instead.

</section>
<section class="doc-code">
{% highlight js %}
/* Always create a text node containing the value passed as argument, ignoring
   children template nodes */
ist.helper(
    "echo",
    function(context, value, template, fragment) {
    	var node = context.createTextNode(
                value || "no value passed to @echo !"
            );

        fragment.appendChild(node);
    }
);
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Handling updates">Handling updates</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
When rendering a template, the `fragment` argument to directive helpers is
empty.  However, when updating, it contains previously rendered nodes.  When the
helper returns, whatever the fragment contains will be added to the rendered
node tree.  It is up to directive helpers to decide what to do based on the
fragment contents.

A naive approach to handling node updates is to just empty the fragment and
render nodes in all cases.  This approach works, but it is not very efficient.
Here is how the `@echo` directive above could handle updates using this
approach.

</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    'echo',
    function(context, value, template, fragment) {
        /* Empty the fragment first */
        while (fragment.hasChildNodes()) {
            fragment.removeChild(fragment.firstChild);
        }

        /* Render node */
        var node = context.createTextNode(
                value || "no value passed to @echo !"
            );

        fragment.appendChild(node);
    }
);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
A better approach is to reuse already rendered nodes and update them.

</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    'echo',
    function(context, value, template, fragment) {
        var node = fragment.firstChild;

        if (!node) {
            /* No previously rendered node available */
            node = context.createTextNode("");
            fragment.appendChild(node);
        }

        /* Update node content */
        node.textContent = value || "no value passed to @echo !";
    }
);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
Helpers that render templates need access to the rendered template `update()`
method when updating.  Therefore they need to save the rendered fragment
returned by calling `render()` and retrieve it when updating.  The `fragment`
argument to helpers comes with two additional methods to help with that:

* `fragment.appendRenderedFragment(rendered)` appends the contents from
  `rendered` (just like calling `fragment.appendChild(rendered)`) to the
  fragment, but also saves `rendered` itself for later retrieval.
* `fragment.extractRenderedFragment()` looks for a previously saved rendered
  fragment, and returns it.  When no rendered fragment has been saved, it
  returns `undefined`.  Otherwise, all previously rendered nodes are removed
  from `fragment` and returned in the resulting rendered fragment.  In that
  case, you will need to re-append the nodes to `fragment` after updating.

Here is an example showing how this works with the `@with` directive.

</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    'with',
    function(context, value, template, fragment) {
        /* Retrieve previously saved rendered fragment */
        var rendered = fragment.extractRenderedFragment();

        if (rendered) {
            /* A rendered fragment was found, update it */
            rendered.update(value);
        } else {
            /* Nothing was saved, render the template */
            rendered = template.render(value);
        }

        /* Put nodes back in the fragment */
        fragment.appendRenderedFragment(rendered);
    }
);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
When a helper renders multiple templates at once, you can pass an additional key
argument to both `appendRenderedFragment` and `extractRenderedFragment` to
distinguish them.  Keys can be any Javascript value.

Here is an example of a `doubleWith` directive that renders its inner template
twice and is able to update correctly.

</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    'doubleWith',
    function(context, value, template, fragment) {
        var first = fragment.extractRenderedFragment("first"),
            second = fragment.extractRenderedFragment("second");

        if (first) {
            first.update(value);
        } else {
            first = template.render(value);
        }

        if (second) {
            second.update(value);
        } else {
            second = template.render(value);
        }

        fragment.appendRenderedFragment(first, "first");
        fragment.appendRenderedFragment(second, "second");
    }
);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
You may throw exceptions inside helpers.  Those exceptions will be reported with
some added context data (including which template and which line it occured on).
Here is a more robust version of `@with`.

</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    "with",
    function(context, value, template, fragment) {
        if (!value) {
            throw new Error("No data passed to @with");
        }

        /* Retrieve previously saved rendered fragment */
        var rendered = fragment.extractRenderedFragment();

        if (rendered) {
            /* A rendered fragment was found, update it */
            rendered.update(value);
        } else {
            /* Nothing was saved, render the template */
            rendered = template.render(value);
        }

        /* Put nodes back in the fragment */
        fragment.appendRenderedFragment(rendered);
    }
);
{% endhighlight %}
</section>
</section>

### <a class="nohover" name="Context objects">Context objects</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
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
  
</section>
<section class="doc-code">
{% highlight js %}
/* Creates a <div> with a text child node containing
   the value passed as a  parameter, ie @divtext "foo"
   renders to <div>foo</div>.

   Note: for the sake of simplicity, this example does
   not handle updates */
ist.helper(
    "divtext",
    function(context, value, template, fragment) {
    	var div = context.createElement("div");
    	var text = context.createTextNode(value);
    	
    	div.appendChild(text);
    	fragment.appendChild(div);
    }
);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
The following members can be used to create new contexts and access their value:

* `Context.value` contains the value wrapped by the `Context` object.
* `Context#createContext(newValue)` returns a new `Context` object with the same
  target document but a new value.

</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    'test',
    function(context, value, template, fragment) {
    	var testValue = { foo: "bar" },
    		ctx = context.createContext(testValue);
    	
    	assert(testValue === ctx.value);
    }
);
{% endhighlight %}
</section>
</section>

<section class="doc-item">
<section class="doc-desc">
And finally, the following members can be used to change the way expressions are
evaluated:

* `Context#pushScope(scope)` pushes properties of the `scope` object on the
  scope used when evaluating expressions, possibly hiding previously existing
  variables with the same name (from previously pushed scopes of from the
  rendering context).
* `Context#popScope()` undoes what pushScope did, popping the last pushed scope
  object.
* `Context#pushValue(value)` (documentation pending)
  
</section>
<section class="doc-code">
{% highlight js %}
ist.helper(
    'test',
    function(outer, inner, template, fragment) {
    	var ctx = outer.createContext({ foo: "bar" });
    	
        assert(ctx.evaluate("foo.toUpperCase()") === "BAR");
    	
    	ctx.pushScope({ foo: "baz", hello: "world" });
        assert(ctx.evaluate("foo.toUpperCase()") === "BAZ");
        assert(ctx.evaluate("hello") === "world");

    	ctx.pushScope({ foo: "ding" });
        assert(ctx.evaluate("foo.toUpperCase()") === "DING");
        assert(ctx.evaluate("hello") === "world");

    	ctx.popScope();
        assert(ctx.evaluate("foo.toUpperCase()") === "BAZ");
        assert(ctx.evaluate("hello") === "world");
    	
    	ctx.popScope();
        assert(ctx.evaluate("foo.toUpperCase()") === "BAR");
    }
);
{% endhighlight %}
</section>
</section>

## <a class="nohover" name="Version">Version</a><a class="toplink" href="#top">top</a>

<section class="doc-item">
<section class="doc-desc">
This documentation was last updated for ist.js version 0.6.6.

[1]: http://handlebarsjs.com/block_helpers.html
</section>
</section>


</section>
