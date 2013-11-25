/*global define */
define(['util/misc'], function(misc) {
	'use strict';


	function appendRenderedFragment(fragment, key) {
		/*jshint validthis:true */
		this._istKeyIndex.push(key);
		this._istFragIndex.push({
			firstChild: fragment.firstChild,
			lastChild: fragment.lastChild,
			update: fragment.update
		});

		this.appendChild(fragment);
	}


	function extractRenderedFragments() {
		/*jshint validthis:true */
		var ctx = this._istContext,
			keyIndex = this._istKeyIndex,
			fragIndex = this._istFragIndex,
			extracted = {
				keys: keyIndex.slice(),
				fragments: fragIndex.map(function(item) {
					var frag = ctx.createDocumentFragment();

					misc.appendNodeSegment(item.firstChild, item.lastChild, frag);
					frag.update = item.update;

					return frag;
				})
			};

		keyIndex.splice(0, keyIndex.length);
		fragIndex.splice(0, fragIndex.length);

		return extracted;
	}


	function extractRenderedFragment(key) {
		/*jshint validthis:true */
		var ctx = this._istContext,
			keyIndex = this._istKeyIndex,
			fragIndex = this._istFragIndex,
			position = keyIndex.indexOf(key),
			item, fragment;

		if (position !== -1) {
			item = fragIndex[position];
			fragment = ctx.createDocumentFragment();

			misc.appendNodeSegment(item.firstChild, item.lastChild, fragment);
			fragment.update = item.update;

			keyIndex.splice(position, 1);
			fragIndex.splice(position, 1);

			return fragment;
		}
	}



	function RenderedDirective() {
		this.firstChild = null;
		this.lastChild = null;
		this.keyIndex = [];
		this.fragIndex = [];
	}


	RenderedDirective.prototype.createFragment = function(ctx) {
		var fragment = ctx.createDocumentFragment();

		fragment._istContext = ctx;
		fragment._istKeyIndex = this.keyIndex;
		fragment._istFragIndex = this.fragIndex;

		fragment.appendRenderedFragment = appendRenderedFragment;
		fragment.extractRenderedFragment = extractRenderedFragment;
		fragment.extractRenderedFragments = extractRenderedFragments;

		misc.appendNodeSegment(this.firstChild, this.lastChild, fragment);

		return fragment;
	};


	RenderedDirective.prototype.updateFromFragment = function(fragment) {
		this.firstChild = fragment.firstChild;
		this.lastChild = fragment.lastChild;
	};


	return RenderedDirective;
});