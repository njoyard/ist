/*jshint browser:true */
/*global define, describe, it, expect, nthNonCommentChild, nonCommentChildren */

define([
	'ist',
	'text!test/directivehelper/directivehelper.ist',
	'text!test/directivehelper/string.ist',
	'text!test/directivehelper/none.ist',
	'ist!test/directivehelper/errors',
	'ist!test/directivehelper/update'
], function(ist, textDirectivehelper, textString, textNone, tErrors, tUpdate) {
	'use strict';

	describe('directive helpers', function() {
		it('should allow parsing templates with unknown @directives', function() {
			var thrown = false;

			ist.helper('testDirective', undefined);

			try {
				ist(textDirectivehelper);
			} catch(e) {
				thrown = true;
			}

			expect( thrown ).toBe( false );
		});

		it('should fail to render templates with unknown @directives', function() {
			var context = { context: { value: 'context' } };

			ist.helper('testDirective', undefined);

			expect( function() { ist(textDirectivehelper).render(context); } ).toThrow('No directive helper for @testDirective has been registered in \'<unknown>\' on line 2');
		});

		it('should call helpers when the corresponding @directive is rendered', function() {
			var called = false,
				context = { context: { value: 'context' } };


			ist.helper('testDirective', function() {
				called = true;
			});
			ist(textDirectivehelper).render(context);

			expect( called ).toBe( true );
		});

		it('should pass the current context to helpers as 1st argument', function() {
			var param,
				context = { context: { value: 'context' } };


			ist.helper('testDirective', function(ctx) {
				param = ctx;
			});
			ist(textDirectivehelper).render(context);

			expect( param.value ).toBe( context );
		});

		it('should pass the narrowed down context value to helpers as 2nd argument', function() {
			var param,
				context = { context: { value: 'context' } };


			ist.helper('testDirective', function(ctx, value) {
				param = value;
			});
			ist(textDirectivehelper).render(context);

			expect( param ).toBe( context.context );
		});

		it('should allow helpers to create document fragments in the rendering document with ctx.createDocumentFragment', function() {
			var frag, context = { context: { value: 'context' } };

			ist.helper('testDirective', function(ctx, value, subtemplate) {
				frag = ctx.createDocumentFragment();
			});
			ist(textDirectivehelper).render(context);

			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( frag.ownerDocument ).toBe( document );
		});

		it('should allow helpers to create elements in the rendering document with ctx.createElement', function() {
			var elem, context = { context: { value: 'context' } };

			ist.helper('testDirective', function(ctx, value, subtemplate) {
				elem = ctx.createElement('div');
			});
			ist(textDirectivehelper).render(context);

			expect( elem.nodeType ).toBe( document.ELEMENT_NODE );
			expect( elem.ownerDocument ).toBe( document );
			expect( elem.nodeName.toLowerCase() ).toBe( 'div' );
		});

		it('should allow helpers to create text nodes in the rendering document with ctx.createTextNode', function() {
			var text, context = { context: { value: 'context' } };

			ist.helper('testDirective', function(ctx, value, subtemplate) {
				text = ctx.createTextNode('text value');
			});
			ist(textDirectivehelper).render(context);

			expect( text.nodeType ).toBe( document.TEXT_NODE );
			expect( text.ownerDocument ).toBe( document );
			expect( text.textContent ).toBe( 'text value' );
		});

		it('should enable helpers rendering the subtemplate with a custom context', function() {
			var result,
				context = { context: { value: 'context' } };

			ist.helper('testDirective', function(ctx, value, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
			});
			ist(textDirectivehelper).render(context);

			expect( result.querySelector('.child') ).toNotBe( null );
			expect( result.querySelector('.child').firstChild ).toNotBe( null );
			expect( result.querySelector('.child').firstChild.textContent ).toBe( 'interpolated my value' );
		});

		it('should allow passing a quoted string instead of a context path', function() {
			var val;

			ist.helper('otherDirective', function(ctx, value, subtemplate) {
				val = value;
			});

			ist(textString).render({});
			expect( val ).toBe( 'direct string value' );
		});

		it('should pass undefined when no narrowed down context is present', function() {
			var arg = 'defined', arg2 = 'defined', options,
				context = { context: { value: 'context' } };

			ist.helper('noParamDirective', function(ctx, value) {
				arg = value;
			});
			ist(textNone).render(context);

			expect( typeof arg ).toBe( 'undefined' );
		});

		it('should pass a directive iterator to helpers as 4th argument', function() {
			var iter,
				context = { context: { value: 'context' } };

			ist.helper('testDirective', function(ctx, value, tmpl, iterate) {
				iter = iterate;
			});
			ist(textDirectivehelper).render(context);

			expect( typeof iter ).toBe( 'function' );
		});

		it('should call iterator callback once for each passed key', function() {
			var keys = [],
				context = { context: { value: 'context' } };

			ist.helper('testDirective', function(ctx, value, tmpl, iterate) {
				iterate(['foo', 'bar', 'baz'], function(key) {
					keys.push(key);
				});
			});
			ist(textDirectivehelper).render(context);

			expect( keys.join(',') ).toBe( 'foo,bar,baz' );
		});

		it('should insert what iterator callback returns into the parent template node', function() {
			var node, frag;

			ist.helper('testDirective', function(ctx, value, subtemplate, iterate) {
				iterate(['test'], function() {
					node = ctx.createElement('div');
					node.className = 'generated';
					return node;
				});
			});
			frag = ist(textDirectivehelper).render({ context: undefined });

			expect( frag.querySelector('div.parent div.generated') ).toNotBe( null );
			expect( frag.querySelector('div.parent div.generated') ).toBe( node );
		});

		it('should allow pushing variables to a rendering context', function() {
			ist.helper('pushDirective', function(ctx, value, subtemplate, iterate) {
				iterate(['test'], function() {
					ctx.pushScope({ variable: 'value' });
					var rendered = subtemplate.render(ctx);
					ctx.popScope();

					return rendered;
				});
			});

			expect(
				nthNonCommentChild(ist('@pushDirective\n \'{{ variable }}\'').render({}), 0)
			).toHaveTextContent( 'value' );
		});

		it('should allow overwriting existing rendering context properties when pushing variables', function() {
			ist.helper('pushDirective', function(ctx, value, subtemplate, iterate) {
				iterate(['test'], function() {
					ctx.pushScope({ variable: 'new value' });
					var rendered = subtemplate.render(ctx);
					ctx.popScope();

					return rendered;
				});
			});

			expect(
				nthNonCommentChild(ist('@pushDirective\n \'{{ variable }}\'').render({ variable: 'value' }), 0)
			).toHaveTextContent( 'new value' );
		});

		it('should allow stacking pushed variables in rendering contexts', function() {
			var frag;

			ist.helper('pushDirective1', function(ctx, value, subtemplate, iterate) {
				iterate(['test'], function() {
					ctx.pushScope({ variable: 'value 1' });
					var rendered = subtemplate.render(ctx);
					ctx.popScope();

					return rendered;
				});
			});

			ist.helper('pushDirective2', function(ctx, value, subtemplate, iterate) {
				iterate(['test'], function() {
					ctx.pushScope({ variable: 'value 2' });
					var rendered = subtemplate.render(ctx);
					ctx.popScope();

					return rendered;
				});
			});

			frag = ist('@pushDirective1\n \'0 {{ variable }}\'\n @pushDirective2\n  \'1 {{ variable }}\'\n \'2 {{ variable }}\'').render({});

			expect( nthNonCommentChild(frag, 0) ).toHaveTextContent( '0 value 1' );
			expect( nthNonCommentChild(frag, 1) ).toHaveTextContent( '1 value 2' );
			expect( nthNonCommentChild(frag, 2) ).toHaveTextContent( '2 value 1' );
		});

		it('should allow popping pushed variables from rendering contexts', function() {
			ist.helper('pushDirective', function(ctx, value, subtemplate, iterate) {
				iterate(['test'], function() {
					ctx.pushScope({ variable: 'new value' });
					ctx.popScope();
					return subtemplate.render(ctx);
				});
			});

			expect(
				nthNonCommentChild(ist('@pushDirective\n \'{{ variable }}\'').render({ variable: 'value' }), 0)
			).toHaveTextContent( 'value' );
		});

		it('should report errors thrown by expressions when rendering', function() {
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrowUndefined('a', 'test/directivehelper/errors', 2);

			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow('custom error in \'test/directivehelper/errors\' on line 6');
		});

		it('should report errors thrown by helpers when rendering', function() {
			ist.helper('throwingHelper', function() {
				throw new Error('Helper error');
			});

			expect( function() { tErrors.render({ test: 'throwingHelper' }); } )
				.toThrow('Helper error in \'test/directivehelper/errors\' on line 10');
		});

		it('should pass previously rendered result to iterator callback when updating', function() {
			var phase;
			var initial;
			var secondArg;

			ist.helper('renderedHelper', function(context, value, tmpl, iterate) {
				iterate(function(key, rendered) {
					if (phase === 'update') {
						secondArg = rendered;
					} else {
						initial = context.createTextNode('test');
						return initial;
					}
				});
			});

			phase = 'render';

			var container = document.createElement('div');
			var rendered = ist('@renderedHelper').render();
			container.appendChild(rendered);

			phase = 'update';
			rendered.update();

			expect( secondArg ).toBe( initial );
		});

		it('should pass key only to iterator callback when key is new', function() {
			var phase;
			var secondArg = 'callback not called with "added" key';

			ist.helper('renderedHelper', function(context, value, tmpl, iterate) {
				var keys = phase === 'update' ? ['original', 'added'] : ['original'];

				iterate(keys, function(key, rendered) {
					if (phase === 'update' && key === 'added') {
						secondArg = rendered;
					} else {
						return context.createTextNode('test');
					}
				});
			});

			phase = 'render';

			var container = document.createElement('div');
			var rendered = ist('@renderedHelper').render();
			container.appendChild(rendered);

			phase = 'update';
			rendered.update();

			expect( typeof secondArg ).toBe( 'undefined' );
		});

		it('should replace nodes returned from iterator callback when updating', function() {
			ist.helper('replaceHelper', function(context, value, tmpl, iterate) {
				iterate(function() {
					return context.createTextNode('replace');
				});
			});

			var container = document.createElement('div');
			var rendered = ist('@replaceHelper').render();
			container.appendChild(rendered);

			var original =  nthNonCommentChild(container, 0);

			expect( nonCommentChildren(container).length ).toBe(1);
			expect( original.textContent ).toBe( 'replace' );

			rendered.update();
			var replaced =  nthNonCommentChild(container, 0);

			expect( nonCommentChildren(container).length ).toBe(1);
			expect( replaced.textContent ).toBe( 'replace' );
			expect( replaced ).toNotBe( original );
		});

		it('should add new nodes returned from iterator callback when updating', function() {
			var phase;

			ist.helper('addHelper', function(context, value, tmpl, iterate) {
				var keys = phase === 'update' ? ['original', 'added'] : ['original'];

				iterate(keys, function(key) {
					return context.createTextNode(key);
				});
			});

			phase = 'render';
			var container = document.createElement('div');
			var rendered = ist('@addHelper\n  "{{ this }}"').render();
			container.appendChild(rendered);

			expect( nonCommentChildren(container).length ).toBe(1);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'original' );

			phase = 'update';
			rendered.update();

			expect( nonCommentChildren(container).length ).toBe(2);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'original' );
			expect( nthNonCommentChild(container, 1).textContent ).toBe( 'added' );
		});

		it('should remove nodes corresponding to removed keys when updating', function() {
			var phase;

			ist.helper('addHelper', function(context, value, tmpl, iterate) {
				var keys = phase === 'update' ? ['original'] : ['original', 'toberemoved'];

				iterate(keys, function(key) {
					return context.createTextNode(key);
				});
			});

			phase = 'render';
			var container = document.createElement('div');
			var rendered = ist('@addHelper\n  "{{ this }}"').render();
			container.appendChild(rendered);

			expect( nonCommentChildren(container).length ).toBe(2);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'original' );
			expect( nthNonCommentChild(container, 1).textContent ).toBe( 'toberemoved' );

			phase = 'update';
			rendered.update();

			expect( nonCommentChildren(container).length ).toBe(1);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'original' );
		});

		it('should move nodes corresponding to moved keys when updating', function() {
			var phase;

			ist.helper('moveHelper', function(context, value, tmpl, iterate) {
				var keys = phase === 'update' ? ['second', 'first'] : ['first', 'second'];

				iterate(keys, function(key) {
					return context.createTextNode(key);
				});
			});

			phase = 'render';
			var container = document.createElement('div');
			var rendered = ist('@moveHelper\n  "{{ this }}"').render();
			container.appendChild(rendered);

			expect( nonCommentChildren(container).length ).toBe(2);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'first' );
			expect( nthNonCommentChild(container, 1).textContent ).toBe( 'second' );

			phase = 'update';
			rendered.update();

			expect( nonCommentChildren(container).length ).toBe(2);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'second' );
			expect( nthNonCommentChild(container, 1).textContent ).toBe( 'first' );
		});

		it('should enable removing previously rendered nodes when updating', function() {
			var phase;

			ist.helper('clearHelper', function(context, value, tmpl, iterate) {
				iterate(function(key, rendered) {
					if (rendered) {
						rendered.clear();
					} else {
						return context.createTextNode('test');
					}
				});
			});

			phase = 'render';
			var container = document.createElement('div');
			var rendered = ist('@clearHelper\n  "{{ this }}"').render();
			container.appendChild(rendered);

			expect( nonCommentChildren(container).length ).toBe(1);
			expect( nthNonCommentChild(container, 0).textContent ).toBe( 'test' );

			phase = 'update';
			rendered.update();

			expect( nonCommentChildren(container).length ).toBe(0);
		});

		it('should enable reclaiming previously rendered nodes when updating', function() {
			var phase;
			var reclaimContainer = document.createElement('div');

			ist.helper('reclaimHelper', function(context, value, tmpl, iterate) {
				iterate(function(key, rendered) {
					if (rendered) {
						rendered.reclaim(reclaimContainer);
					} else {
						return context.createTextNode('test');
					}
				});
			});

			phase = 'render';
			var container = document.createElement('div');
			var rendered = ist('@reclaimHelper\n  "{{ this }}"').render();
			container.appendChild(rendered);

			expect( nonCommentChildren(container).length ).toBe(1);
			var original = nthNonCommentChild(container, 0);
			expect( original.textContent ).toBe( 'test' );

			phase = 'update';
			rendered.update();

			expect( nonCommentChildren(container).length ).toBe(0);
			expect( nonCommentChildren(reclaimContainer).length ).toBe(1);
			var reclaimed = nthNonCommentChild(reclaimContainer, 0);
			expect( reclaimed.textContent ).toBe( 'test' );
			expect( reclaimed ).toBe( original );
		});

		it('should render nested directives in the right order', function() {
			var container = document.createElement('div');
			var rendered = ist([
					'@each keys',
					'  @each [this + ".1", this + ".2"]',
					'    "{{ this }}"'
				].join('\n')).render({ keys: ['a', 'b']});

			container.appendChild(rendered);

			expect(nonCommentChildren(container).length).toBe(4);
			expect(nthNonCommentChild(container, 0).textContent).toBe('a.1');
			expect(nthNonCommentChild(container, 1).textContent).toBe('a.2');
			expect(nthNonCommentChild(container, 2).textContent).toBe('b.1');
			expect(nthNonCommentChild(container, 3).textContent).toBe('b.2');
		});

		it('should update nested directives in the right order', function() {
			var container = document.createElement('div');
			var rendered = ist([
					'@each keys',
					'  @each [this + ".1", this + ".2"]',
					'    "{{ this }}"'
				].join('\n')).render({ keys: ['a', 'b']});

			container.appendChild(rendered);

			rendered.update({ keys: ['A', 'B'] });

			expect(nonCommentChildren(container).length).toBe(4);
			expect(nthNonCommentChild(container, 0).textContent).toBe('A.1');
			expect(nthNonCommentChild(container, 1).textContent).toBe('A.2');
			expect(nthNonCommentChild(container, 2).textContent).toBe('B.1');
			expect(nthNonCommentChild(container, 3).textContent).toBe('B.2');
		});
	});
});
