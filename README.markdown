# [IST](http://github.com/k-o-x/ist) - Indented Selector Templating

## Introduction

IST is a DOM templating engine using a CSS selector-like syntax.  Templates are
text files, which are first parsed and compiled into a template object, and then
rendered into a DOM document using a context object.  This file documents usage
of version 0.1.

Here is a brief overview of an IST template file:

	div#content
	    @each articles
	        div.article
	            h1
	                "{{ title }}"
	            "{{ text }}"
	        @unless comments.length
	            "No comments for now !"
	        @each comments
	            div.comment
	                "{{ this }}"
	        form.newcomment
	            label[for=name]
	                "Name :"
	            input.commentInput#name[type=text]
	            label[for=comment]
	            textarea[cols=55]#commentArea
	                "Enter your comment here"

## Usage

### Template compilation.

IST can be used either as an AMD module or as a RequireJS plugin.  To compile a
template string, use the module syntax as follows:

	require(['ist'], function(ist) {
		var myTemplate = ist('div#myId.myClass[myProp=myVal]');
		...
	});
	
To compile a template file, you can use the RequireJS plugin syntax:

	require(['ist!path/to/template'], function(myTemplate) {
		...
	});

Note that the plugin automatically adds an `.ist` extension to file names.

### Rendering

You can render a template using the `render` method of compiled templates.  By
defaut, it will render using the global object `document` property (eg.
`window.document`).

	document.body.appendChild(myTemplate.render({ articles: [...] }));
	
When rendering to an other document, you can pass it as a second argument:

	popup.document.body.appendChild(myTemplate.render({ ... }, popup.document));

## Template syntax

### Basics

All nodes are specified on a separate line.  Empty lines (other than whitespace)
are ignored by IST.  The tree structure is specified using indentation.  You can
indent using (any number of) either spaces or tabs, but you have to be
consistent.  An increase in indent means a parent-child relationship:

	div.parent
	    div.child
		
Likewise, node with the same indent are siblings:

	div.parent
	    div.child
	    div.child
		
When decreasing indent, be careful to match a previous line with the same indent
level:

	div.parent
	    div.child
	  div.invalid

	div.parent
	    div.child
	div.valid
	  
There is no restriction in the size of indent. The following are all equivalent:

	div.parent
	 div.parent

	div.parent
	             div.child

	div.parent
		div.child

However, indent is compared strictly: it has to be strictly identical for all
nodes at the same level.  Therefore it's best to avoid mixing tabs and spaces.

### Element nodes - Selectors

CSS-like selectors are used to specify element nodes.  The element tag name is
always specified first, and qualifiers follow, in any order, but without
spacing. You can use ID qualifiers :

	div#an_id

class qualifiers:

	span.a_class
	
and attribute qualifiers:

	input[type=text]
	
All those can be mixed in any order:

	div#id.class1[style=display: none;].class2#final_id
	
Note that when specifying multiple IDs, only the last one is kept.  Finally, for
some corner-cases, properties can be specified as follows:

	div[.className=one two three]

### Text nodes

Text nodes are specified with double quotes:

	"top-level text node"
	div.text
		"child text node"
		"any character is valid here including "double quotes""
		"the final double quote is optional

Of course text nodes cannot have any child nodes.

### String interpolation

You can insert values from the rendering context using double curly braces in
text nodes or in property/attribute values:

	"value is {{ value }}, bar is {{ bar }}"
	div[.className={{ cssClass1 }} {{ cssClass2 }}]
		"{{ access.to.sub.properties }}"
		"Spaces inside braces are {{ignored     }}"
		"The special keyword {{ this }} references the current context itself"

Using string interpolation is not possible with ID or class qualifiers, but you
can use `[.className={{ variable }}]` and `[.id={{ variable }}]`

### Directives

Directives are used to control node generation with the help of context
properties.  The syntax of both directives is the same:

	@directive path.to.context.property
	
Conditional directives enable conditional rendering of a subtree:

	@if some.property.is.truthy
		div.willBeRendered
		
	@unless some.property.is.truthy
		div.willNotBeRendered

The `@each` loop directive iterates over an array.  Context for the subtree is
switched to each of the array elements in turn:

	@each articles
		h1
			"{{ title }}"
		div
			"{{ content }}"

Finally, the `@with` directive enables context narrowing:

	span
		"{{ deeply.nested.object.property1 }}"
		"{{ deeply.nested.object.property2 }}"
		
	div.clearer
		@with deeply.nested.object
			"{{ property1 }}"
			"{{ property2 }}"

## Planned (thus missing) features

The following features will be included in future versions:

- comments
- external template inclusion
- better text node handling (esp. for escaped chars such as \n & \t)

## License

IST is distributed under the MIT license. See the file
[`LICENSE`](http://github.com/k-o-x/ist) for more information.

Copyright (c) 2012 Nicolas Joyard
