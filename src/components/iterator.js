define(['util/misc'], function(misc) {
	'use strict';

	/* Iterator helper for directives rendering sub-template(s).

	   Must be called with an array of keys that uniquely identify each
	   rendered sub-template.  Will automagically remove any previously
	   rendered sub-template with a key which is not in keys, and reorder
	   existing keys.  Callback will be called once for each item in keys,
	   with the key as first argument.

	   If a sub-template had been previously rendered, the callback will
	   also receive a document fragment with an update([context]) method.
	   Else, it won't receive any additional argument and must return a
	   document fragment with rendered nodes.
	 */
	function iterator(markerComment, keys, callback) {
		var keyIndex = markerComment.keys;
		var fragIndex = markerComment.fragments;

		if (typeof keys === 'function') {
			callback = keys;
			keys = ["nokey"];
		}

		// Handle removed keys
		for (var i = 0; i < keyIndex.length; i++) {
			if (keys.indexOf(keyIndex[i]) === -1) {
				// Remove nodes
				var frag = fragIndex[i];
				misc.removeNodelist(frag.firstChild, frag.lastChild);

				// Remove key from index
				keyIndex.splice(i, 1);
				fragIndex.splice(i, 1);

				// Backtrack since we removed an element
				i--;
			}
		}

		var prev = markerComment;

		// Iterate over new keys
		keys.forEach(function(key, i) {
			var idx = keyIndex.indexOf(key);
			var ret;
			var frag;
			var next;
			var rendered;
			var isNew = false;

			if (idx !== -1) {
				// Key was previously rendered
				frag = fragIndex[idx];
				var node = frag.firstChild;

				if (node.previousSibling !== prev) {
					// Nodes are not in the expected position, move them
					next = prev.nextSibling;
					misc.iterateNodelist(node, frag.lastChild, function(node) {
						prev.parentNode.insertBefore(node, next);
					});
				}
			}

			if (frag) {
				rendered = frag.rendered;

				rendered.clear = function() {
					misc.removeNodelist(frag.firstChild, frag.lastChild);
				};

				rendered.reclaim = function(parent) {
					misc.iterateNodelist(frag.firstChild, frag.lastChild, function(node) {
						parent.appendChild(node);
					});
				};
			}

			ret = callback(key, rendered);

			if (idx !== i) {
				// Update index
				if (idx !== -1) {
					keyIndex.splice(idx, 1);
					fragIndex.splice(idx, 1);
				}
				
				keyIndex.splice(i, 0, key);
				fragIndex.splice(i, 0, frag = {});
			} else {
				// Just reinitialize fragment index item
				fragIndex[i] = frag = {};
			}

			if (ret) {
				if ('nodeType' in ret) {
					if (rendered && ret !== rendered) {
						// Callback returned a new node, clear current nodes
						rendered.clear();
					}
					
					isNew = true;
					rendered = ret;
				} else {
					throw new Error('Helper iterator callback returned unknown result');
				}
			}

			if (rendered) {
				if (rendered.nodeType === rendered.DOCUMENT_FRAGMENT_NODE) {
					frag.firstChild = typeof rendered._first === 'function' ? rendered._first() : rendered.firstChild;
					frag.lastChild  = typeof rendered._last  === 'function' ? rendered._last()  : rendered.lastChild;
				} else {
					frag.firstChild = frag.lastChild = rendered;
				}

				frag.rendered = rendered;

				if (isNew) {
					next = prev.nextSibling;
					misc.iterateNodelist(frag.firstChild, frag.lastChild, function(node) {
						prev.parentNode.insertBefore(node, next);
					});
				}
			} else {
				frag.firstChild = frag.lastChild = null;
			}

			prev = frag.firstChild || prev;
		});
	}

	iterator.last = function(markerComment) {
		var fragIndex = markerComment.fragments;

		if (fragIndex && fragIndex.length) {
			for (var i = fragIndex.length - 1; i >= 0; i--) {
				if (fragIndex[i].lastChild) {
					return fragIndex[i].lastChild;
				}
			}
		}
	};

	return iterator;
});