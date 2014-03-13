
## Template Syntax

### Node tree

ist.js uses indentation to specify node trees, not unlike YAML and Python.  All
children of a same node must have the same indent.  You can use spaces and/or
tabs, but ist.js considers them different and will always look for strictly
identical indents.

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
are not direct siblings.

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

ist.js uses a syntax similar to CSS3 selectors to specify elements.  In general, selectors start with a tag name.

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
with a `.` prefix.  You can also specify nested property paths (ist.js will
create intermediate objects if necessary).

```css
div[.className=header]
div[.path.to.property=value]
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

If you have many qualifiers, you may want to have them on separate lines to improve readability.  You can escape newlines with a backslash to make ist.js ignore them.  All spaces before the backslash and on the beginning of the following line will be ignored, but take care not to leave spaces _after_ the escaping backslash.

```css
.div-with-very-long-selector-qualifier-list#and-long-id \
    [and-long-attribute-list=value1][and-long-attribute-list-2=value2] \
    [and-long-attribute-list-3=value3][and-long-attribute-list-4=value4]
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
produce the same result, though the first one may seem ambiguous.

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

You can define global variables that will be usable in any expression using `ist.global("name", "value")`.

```js
ist.global("upper", function(text) {
    return text.toUpperCase();
});
```

Context variables with the same name will overwrite global variable, as you're used to in Javascript.

```css
"{{ upper('will be uppercased') }}"
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

The `@unless` directive has the same goal, just reversed.

```css
@unless user.isRegistered
    a[href=register.html] "Sign up now !"
```

The `@else` directive can be used just after a `@if` or `@unless` directive to
match the opposite condition.

```css
@if user.isAdmin
    a[href=admin.html] "Administration zone"
@else
    "No admin zone for you :("
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

    "Item {{ loop.index + 1 }} of {{ loop.length }}"
    " is {{ this }}"

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
        ist.script("menu").render([
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
    ist.script("main").render(/* ... */);
});
```

It may also resolve to a template string.

```js
define("included-template", [], function() {
    return "div\n  h1 'included content'";
});

require(["ist", "included-template"], function(ist) {
    ist.script("main").render(/* ... */);
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

They can be accessed using the `partial()` method of a compiled template, which
takes the partial name as argument.  It returns the first matching partial,
which can be manipulated as any other compiled template.

```js
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
```
