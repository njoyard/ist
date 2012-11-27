---
layout: default
id: doc
---

{% assign opencurly = '{{' %}
{% assign closecurly = '}}' %}

Documentation
=============

## Table of contents

* <a href="#Getting started">Getting started</a>
* <a href="#Usage">Usage</a>
    * <a href="#Standalone usage">Standalone usage</a>
    * <a href="#AMD usage">AMD usage</a>
* <a href="#Template Syntax">Template Syntax</a>
    * <a href="#Node tree">Node tree</a>
    * <a href="#Element selectors">Element selectors</a>
    * <a href="#Text nodes">Text nodes</a>
    * <a href="#Expressions">Expressions</a>
    * <a href="#Directives">Directives</a>
        * <a href="#Conditionals">Conditionals</a>
        * <a href="#Context switching">Context switching</a>
        * <a href="#Array iteration">Array iteration</a>
        * <a href="#Object property iteration">Object property iteration</a>
        * <a href="#External template inclusion">External template inclusion</a>
* <a href="#Defining custom directives">Defining custom directives</a>
* <a href="#Error reporting">Error reporting</a>
* <a href="#Version">Version</a>

## <a name="Getting started">Getting started</a>

<section class="doc-item">
<section class="doc-desc">
An ist.js template looks like a tree of CSS selectors and text nodes, with
embedded expressions delimited by double curly braces.

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
Templates can include directives to change the way they are rendered depending
on context content. Directives start with an `@` symbol and take an expression
as a parameter.

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
Templates can also include comments and blank lines for clarity.

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

## <a name="Usage">Usage</a>

### <a name="Standalone usage">Standalone usage</a>

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

### <a name="AMD usage">AMD usage</a>

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

## <a name="Template Syntax">Template Syntax</a>

### <a name="Node tree">Node tree</a>

<section class="doc-item">
<section class="doc-desc">
ist.js uses indentation to specify node trees.  All children of a same node must
have the same indentation.  You can use spaces or tabs, but ist.js will not see
a tab as the equivalent of any number of spaces.

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

### <a name="Element selectors">Element selectors</a>

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

### <a name="Text nodes">Text nodes</a>

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

### <a name="Expressions">Expressions</a>

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
provided they are a valid identifier.

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

### <a name="Directives">Directives</a>

<section class="doc-item">
<section class="doc-desc">
ist.js directives allow controlling the rendering of templates depending on
context content. The general syntax is as follows, where `parameter` can be any
ist.js expression.  Note that expressions don't need braces when used with
directives.

</section>
<section class="doc-code">
{% highlight css %}
div.parent
    @directive parameter
        div.subtemplate
{% endhighlight %}
</section>
</section>

#### <a name="Conditionals">Conditionals</a>

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

#### <a name="Context switching">Context switching</a>

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

#### <a name="Array iteration">Array iteration</a>

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

#### <a name="Object property iteration">Object property iteration</a>

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
#### <a name="External template inclusion">External template inclusion</a>

## <a name="Defining custom directives">Defining custom directives</a>

## <a name="Error reporting">Error reporting</a>

## <a name="Version">Version</a>

<section class="doc-item">
<section class="doc-desc">
This documentation was last updated for ist.js version 0.5.4.

</section>
</section>

