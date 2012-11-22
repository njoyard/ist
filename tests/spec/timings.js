define([
	'ist!timings/basic',
	'ist!timings/doubleeach'
], function(basicTemplate, doubleeachTemplate) {
	var data = {
			basic: {
				header1: "header 1",
				header2: "header 2",
				header3: "header 3",
				header4: "header 4",
				header5: "header 5",
				header6: "header 6",
				items: [ "item1", "item2", "item3", "item4", "item5", "item6" ]
			},
			doubleeach: {
				list: [
					{ doLoop: 1, sublist: [ "item1", "item2", "item3", "item4", "item5", "item6" ] },
					{ doLoop: 0, sublist: [ "item1", "item2", "item3", "item4", "item5", "item6" ] },
					{ doLoop: 1, sublist: [ "item1", "item2", "item3", "item4", "item5", "item6" ] },
					{ doLoop: 1, sublist: [ "item1", "item2", "item3", "item4", "item5", "item6" ] },
					{ doLoop: 0, sublist: [ "item1", "item2", "item3", "item4", "item5", "item6" ] },
					{ doLoop: 1, sublist: [ "item1", "item2", "item3", "item4", "item5", "item6" ] }
				]
			}
		};

	return {
		// 60 ops/sec on njoyards 1215n with 0.5.4
		"basic rendering test": function() {
			basicTemplate.render(data.basic);
		},
		
		// 15-16 ops/sec on njoyards 1215n with 0.5.4
		"conditional nested each": function() {
			doubleeachTemplate.render(data.doubleeach);
		}
	}
});
