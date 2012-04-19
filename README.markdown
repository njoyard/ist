# [IST][1] - Indented Selector Templating

## Introduction

IST is a DOM templating engine using a CSS selector-like syntax.  Templates are
text files, which are first parsed and compiled into a template object, and then
rendered into a DOM document using a context object.  This file documents usage
of version 0.4.

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
	                
	@include "common/footer"

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

You can render a template using the `render` method of compiled templates and
passing it a context object as its first argument.  By defaut, it will render
using the global object `document` property (eg. `window.document`).

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
	 div.child

	div.parent
	             div.child

	div.parent
		div.child

However, indent is compared strictly: it has to be identical for all sibling
nodes (ie nodes at the same level with the same parent).  Therefore it's best to
avoid mixing tabs and spaces.

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
		"{{ access.to.context.sub.properties }}"
		"Spaces inside braces are {{ignored     }}"
		"The special keyword {{ this }} references the current context itself"

Using string interpolation is not possible with ID or class qualifiers, but you
can use `[.className={{ variable }}]` and `[.id={{ variable }}]`

### Block directives

Block directives are used to control node generation with the help of context
properties.  They allow to define custom iterators and handlers to operate on a
narrowed down rendering context.  If you're used to [handlebars blocks][2],
you'll find out that IST block directives work in the same way.

#### Defining block helpers

The syntax of block directives is as follows:

	@directiveName path.to.context.property param1="value" param2="value"
		div.subtree
			...

Block helpers are used to render @directiveName blocks. Defining a helper is
done using the following call:

	ist.registerHelper('directiveName', function(subctx, subTemplate) {
		// Helper code
	});
	
Helpers are called with the current rendering context as `this`, and with the
narrowed down context as the first argument (`path.to.context.property` in the
example above). The second argument is an object with the following properties:

- `document`: a reference to the rendering DOM document object
- `options`: an object containing block parameters ("param1" and "param2" in the
  example above). A parameter specified without name will be mapped to 'text'
  (in this case, only the last nameless value will be kept).
- `render`: renders the subtemplate, taking a rendering context as first
  argument, and returning the resulting node (or document fragment).
  
Block directives can also be used without a subcontext specification; in this
case the first argument to the helper will be `undefined`.

Block helpers must return their result as either a DOM node or a (possibly
empty) DOM document fragment.

Note that helpers must only be defined at the time a template is rendered.
Template files can be parsed before the necessary block helpers are defined; 
this enables loading templates with the requirejs plugin syntax and defining
helpers later.

#### Basic examples

You can define a simple '@noop' block that simply renders the inner template
without any context switching as follows:

	ist.registerHelper('noop', function(subctx, subTemplate) {
		return subTemplate.render(this);
	});
	
Having defined this helper, the following template:

	@noop
		div.example
			"using a {{ context.property }}"
			
will render the same as:

	div.example
		"using a {{ context.property }}"

An other simple example would be a '@disabled' block that prevents rendering
part of a template tree:

	div.rendered
		@disabled
			div.notRendered
	@disabled
		div.alsoNotRendered

The associated helper simply always returns an empty fragment:

	ist.registerHelper('noop', function(subctx, subTemplate) {
		return subTemplate.document.createDocumentFragment();
	});

#### Built-in block helpers

IST built-in block helpers are documented below, along with their helper
definition to help better understand how helpers work and what they can achieve.

##### Conditionals

Conditional directives enable conditional rendering of a subtree:

	@if some.property.is.truthy
		div.willBeRendered
		
	@unless some.property.is.truthy
		div.willNotBeRendered

They are defined as follows:

	ist.registerHelper('if', function(subcontext, subtemplate) {
		if (subcontext) {
			return subtemplate.render(this);
		} else {
			// Return empty fragment
			return subtemplate.document.createDocumentFragment();
		}
	});
	
	ist.registerHelper('unless', function(subcontext, subtemplate) {
		if (!subcontext) {
			return subtemplate.render(this);
		} else {
			// Return empty fragment
			return subtemplate.document.createDocumentFragment();
		}
	});
	

##### The 'with' block directive

The `@with` directive enables context narrowing:

	span
		"{{ deeply.nested.object.property1 }}"
		"{{ deeply.nested.object.property2 }}"
		
	div.clearer
		@with deeply.nested.object
			"{{ property1 }}"
			"{{ property2 }}"

It is defined as follows:

	ist.registerHelper('with', function(subcontext, subtemplate) {
		return subtemplate.render(subcontext);
	});
	
##### Basic iterator

The `@each` loop directive iterates over an array.  Context for the subtree is
switched to each of the array elements in turn:

	@each articles
		h1
			"{{ title }}"
		div
			"{{ content }}"

The 'each' helper is defined as follows:

	ist.registerHelper('each', function(subcontext, subtemplate) {
		var fragment = subtemplate.document.createDocumentFragment();
		
		subcontext.forEach(function(item) {	
			fragment.appendChild(subtemplate.render(item));
		});
		
		return fragment;
	});

##### External template inclusion

A template file can be included in an other one using the `@include` directive:

	@include "path/to/template"
	@include "path/to/template.ist"
	
The `@include`d template will be rendered in the current context.  When loading
templates with the `ist!` plugin, included template paths must be relative (ie.
path/to/a must refer to path/to/b as `@include "b"` or `@include "b.ist"`), and
are loaded automatically.

However, when a template string is compiled directly, dependencies must have
been loaded prior to rendering.  In the first example above, the helper will
look for AMD modules named either `path/to/template`, `path/to/template.ist`,
`ist!path/to/template` or `text!path/to/template.ist`.  One of these modules
must resolve to either a template string or a compiled IST template.

The code for the corresponding helper is shown below.  Please note that this
helper alone is not sufficient: the requirejs plugin code also parses templates
to add `@include`d templates to dependencies.

	ist.registerHelper('include', function(ctx, tmpl) {
		var what = tmpl.options.text.replace(/\.ist$/, ''),
			found, tryReq;
			
		// Try to find a previously require()-d template or string
		tryReq = [
			what,
			what + '.ist',
			'ist!' + what,
			'text!' + what + '.ist'
		];
		
		while (!found && tryReq.length) {
			try {
				found = require(tryReq.shift());
			} catch(e) {
				if (tryReq.length === 0) {
					throw new Error("Cannot find included template '" + what + "'");
				}
			}
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

## Planned features

The following features will be included in future versions:

- comments
- better text node handling (esp. for escaped chars such as \n & \t)

## License

IST is distributed under the MIT license. See the file [`LICENSE`][3] for more
information.

Copyright (c) 2012 Nicolas Joyard


[1]: http://github.com/k-o-x/ist
[2]: http://handlebarsjs.com/block_helpers.html
[3]: https://github.com/k-o-x/ist/blob/master/LICENSE

