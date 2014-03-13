
## Single node creation

ist.js provides a shortcut "single node" creation interface that support the
same syntax as full template files.  Just call `ist.create()` and pass it an
element selector.

```js
var myDiv = ist.create(
        "div.class#id[attribute=Value]"
    );
```

It also supports rendering with context.

```js
var myDiv = ist.create(
        "div[class={{ cls }}]",
        { cls: 'myclass' }
    );
```

`ist.create()` is also able to create several nodes at once using a CSS-like
angle-bracket syntax.

```js
var myParentDiv = ist.create(
        'div.parent > div.child > "{{ text }}"',
        { text: "Text node content" }
    );
```

And you can even use directives.

Please note however that `create` has a quite naive angle-bracket parser, and as
such does not support angle brackets anywhere else than between nodes.
Therefore you should only use it for trivial node tree creation.

```js
var myParentDiv = ist.create(
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
var popupDiv = ist.create(
        'div.inPopup',
        {},
        popup.document
    );
```
