
## Custom directives

### Definition and syntax

ist.js allows defining custom directives, and built-in directives are actually
defined the same way.  If you're used to [handlebars block helpers][1], you'll
find that ist.js directives work in a very similar way.

A directive helper is registered by calling `ist.helper()` and passing it a
directive name (case-sensitive) and a helper function.

```js
/* Helper for '@foo' */
ist.helper("foo", function(context, value, template, fragment) {
    /* Do stuff */
});
```

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

```css
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
```

To create nodes from a directive helper, you should not use `document` or any of
its methods, as you don't know which DOM document your directive will be used
to create nodes in.  You can use helper properties and methods of the context
argument instead.

```js
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
```

### Handling updates

When rendering a template, the `fragment` argument to directive helpers is
empty.  However, when updating, it contains previously rendered nodes.  When the
helper returns, whatever the fragment contains will be added to the rendered
node tree.  It is up to directive helpers to decide what to do based on the
fragment contents.

A naive approach to handling node updates is to just empty the fragment and
render nodes in all cases.  This approach works, but it is not very efficient.
Here is how the `@echo` directive above could handle updates using this
approach.

```js
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
```

A better approach is to reuse already rendered nodes and update them.

```js
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
```

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

```js
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
```

When a helper renders multiple templates at once, you can pass an additional key
argument to both `appendRenderedFragment` and `extractRenderedFragment` to
distinguish them.  Keys can be any Javascript value.

Here is an example of a `doubleWith` directive that renders its inner template
twice and is able to update correctly.

```js
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
```

You may throw exceptions inside helpers.  Those exceptions will be reported with
some added context data (including which template and which line it occured on).
Here is a more robust version of `@with`.

```js
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
```

The following members can be used to create new contexts and access their value:

* `Context.value` contains the value wrapped by the `Context` object.
* `Context#createContext(newValue)` returns a new `Context` object with the same
  target document but a new value.

```js
ist.helper(
    'test',
    function(context, value, template, fragment) {
        var testValue = { foo: "bar" },
            ctx = context.createContext(testValue);

        assert(testValue === ctx.value);
    }
);
```

And finally, the following members can be used to change the way expressions are
evaluated:

* `Context#pushScope(scope)` pushes properties of the `scope` object on the
  scope used when evaluating expressions, possibly hiding previously existing
  variables with the same name (from previously pushed scopes of from the
  rendering context).
* `Context#popScope()` undoes what pushScope did, popping the last pushed scope
  object.
* `Context#pushValue(value)` (documentation pending)

```js
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
```
