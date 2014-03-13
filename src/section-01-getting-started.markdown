
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
`ist.script()`.

```js
var template = ist($("#example-template").html());
var template = ist.script("example-template");
```

You can also directly pass a string to `ist()`.

```js
var template = ist('h1 "{{ title }}"');
```

The variable `template` in the examples above is called a compiled template.
Passing a context object to the `render()` method of a compiled template renders
it into a DOM node tree.

```js
var context = {
        title: "ist.js released",
        text: "ist.js has just been released"
    };

var node = template.render(context);

document.body.appendChild(node);
```

Additionnaly, you can pass a DOM document as the second argument to `render()`
to render nodes into an other document.  This is mainly useful when using
multiple windows or frames.

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

You can update what ist.js rendered by calling the `update()` method.

```js
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
```

ist.js also allows easy [single node creation](#Single node creation) using
`ist.create()`.

```js
var myLink = ist.create("a.link[href=#]");
```
