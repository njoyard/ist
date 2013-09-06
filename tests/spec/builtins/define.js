define(['ist!builtins/define/define', 'ist!builtins/define/notdefined'], function(tDefine, tNotDefined) {
	return function() {
		it("should enable @define-ing and @use-ing subtemplates", function() {
			var fragment = tDefine.render();

			expect( fragment.querySelector(".inFoo") ).toNotBe( null );
			expect( fragment.querySelector(".inFoo").firstChild.textContent ).toBe( "bar" );
		});

		it("should fail to render unknown @use-d subtemplates", function() {
			expect( function() { tNotDefined.render(); } ).toThrow(
				"Template 'not defined' has not been @defined in 'builtins/define/notdefined' on line 1"
			);
		});
	};
});
