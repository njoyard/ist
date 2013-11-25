define([
	'ist',
	'text!timings/doubleeach.ist',
	'ist!timings/basic',
	'ist!timings/doubleeach'
], function(ist, doubleeachText, basicTemplate, doubleeachTemplate) {
	var data = {
			basic: {
				header1: 'header 1',
				header2: 'header 2',
				header3: 'header 3',
				header4: 'header 4',
				header5: 'header 5',
				header6: 'header 6',
				items: []
			},
			doubleeach: {
				list: [
					{ doLoop: 1, sublist: [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ] },
					{ doLoop: 0, sublist: [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ] },
					{ doLoop: 1, sublist: [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ] },
					{ doLoop: 1, sublist: [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ] },
					{ doLoop: 0, sublist: [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ] },
					{ doLoop: 1, sublist: [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ] }
				]
			}
		},
		updateable;

	return {
		'parsing test': function() {
			ist(doubleeachText);
		},
		
		'basic rendering test': (function() {
			function test() {
				basicTemplate.render(data.basic);
			}

			test.before = function() {
				data.basic.items = [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ];
			};

			return test;
		}()),
		
		'conditional nested each': function() {
			doubleeachTemplate.render(data.doubleeach);
		},

		'no data change update': (function() {
			var updateable;

			function test() {
				updateable.update();
			}

			test.before = function() {
				data.basic.items = [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ];
				updateable = basicTemplate.render(data.basic);
			}

			return test;
		}()),

		'array item update': (function() {
			var updateable;

			function test() {
				var value = Math.random(),
					target = Math.floor(value * 6);

				data.basic.items[target] = value;
				updateable.update();
			}

			test.before = function() {
				data.basic.items = [ 'item1', 'item2', 'item3', 'item4', 'item5', 'item6' ];
				updateable = basicTemplate.render(data.basic);
			}

			return test;
		}()),

		'array augmentation update': (function() {
			var updateable;

			function test() {
				data.basic.items.push("item" + data.basic.items.length);
				updateable.update();
			}

			test.before = function() {
				data.basic.items = [];
				updateable = basicTemplate.render(data.basic);
			}

			return test;
		}())
	}
});
