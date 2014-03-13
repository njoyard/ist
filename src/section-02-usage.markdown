
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

### Compiling

Calling `ist()` with a template string compiles it and returns the compiled
template.

```js
var compiled = ist('h1 "{{ title }}"');
```

Templates stored in a `<script>` tag are compiled when you get them using
`ist.script()`.

```html
<script id="example-template" type="text/x-ist">
    article
        h1 "{{ title }}"
        p "{{ text }}"
</script>

<script>
    var compiled = ist.script("example-template");
</script>
```

When loading templates with the `ist!` AMD plugin, what you get are also
compiled templates.

```js
define(['ist!path/to/template'], function(compiledTemplate) {
    /* ... */
});
```

### Rendering

Rendering a compiled template is done by calling its `render()` method.  When
your template uses [expressions](#Expressions), you can pass a context object to
use as an argument.

```js
var compiled = ist('h1 "{{ title }}"'),
    rendered = compiled.render({ title: "Hello, world !" });
```

You can also pass a DOM document as a second argument when the rendered nodes
are to be put in a separate window or frame.

```js
var popup = window.open(),
    compiled = ist('h1 "{{ title }}"'),
    rendered = compiled.render(
        { title: "Hello, world !" },
        popup.document
    );
```

The result from `render()` is a DOM DocumentFragment.  If you are not familiar
with them, a DocumentFragment is a transparent container node that can contain
child nodes as any other DOM node, but that disappears once you insert it in an
other node.

```html
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
```

As such, you can directly insert what `render()` returns into your document.

```js
var container = document.querySelector("#container"),
    compiled = ist('h1 "{{ title }}"'),
    rendered = compiled.render({ title: "Hello, world !" });

container.appendChild(rendered);
```

### Updating

The DocumentFragment returned by `render()` has an additional `update()` method.
If you keep a reference to the fragment even after having inserted it in your
document, you can use this method to update the rendered nodes by passing it
an updated context object.

```js
var container = document.querySelector("#container"),
    compiled = ist('h1 "{{ title }}"'),
    rendered = compiled.render({ title: "Hello, world !" });

container.appendChild(rendered);
// <h1>Hello, world !</h1>

rendered.update({ title: "My Web App" });
// <h1>My Web App</h1>
```

You can also call `update()` without any argument, in which case it will reuse
the same context object.

```js
var container = document.querySelector("#container"),
    compiled = ist('h1 "{{ title }}"'),
    context = { title: "Hello, world !" },
    rendered = compiled.render(context);

container.appendChild(rendered);
// <h1>Hello, world !</h1>

context.title = "My Web App";
rendered.update();
// <h1>My Web App</h1>
```
