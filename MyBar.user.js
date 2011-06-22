if(typeof AtKit == "undefined"){
	// Load AtKit
	d=document;jf=d.createElement('script');jf.src='http://localhost/bar/AtKit.js';jf.type='text/javascript';jf.id='AtKitLib';d.getElementsByTagName('head')[0].appendChild(jf);

	window.AtKitLoaded = function(){
		var eventAction = null;
		
		this.subscribe = function(fn) {
			eventAction = fn;
		};
		
		this.fire = function(sender, eventArgs) {
			if (eventAction != null) {
				eventAction(sender, eventArgs);
			}
		};
	}

	window.AtKitLoaded = new AtKitLoaded();
	window.AtKitLoaded.subscribe(function(){ __start(); });
} else {
	__start();
}

function __start(){
		
	// Actual code to configure the toolbar.
	var MyBar = (function (AtKit) { 
		// Set our logo
		AtKit.setLogo("http://access.ecs.soton.ac.uk/ToolBar/channels/echo/presentation/images/atbar.png");
		
		var settings = {
			'baseURL': 'http://localhost/bar/',
			storage: {
				elementStorage: [],
				searchElementStorage: [],
				searchType: ''
			}
		};
		
		testDialogs = {
			"main": "Test Dialog"
		};
		
		globalFunctions = {
			'bindKeypress': function(){
				AtKit.lib()(document).keydown(function (e) {
					if(e.which == 8) AtKit.lib()('#asTypeInput').val( AtKit.lib()('#asTypeInput').val().substring(0, AtKit.lib()('#asTypeInput').val().length - 1) );
					
					if(e.which == 13){
						var input = AtKit.lib()('#asTypeInput').val();
						
						settings.storage.searchElementStorage = [];
						
						
						AtKit.lib().each(settings.storage.elementStorage, function(i, v){
							if(v.html().substring(0, input.length).toLowerCase() == input.toLowerCase()) settings.storage.searchElementStorage.push(v.get(0));
						});
						
						settings.storage.elementStorage = settings.storage.searchElementStorage;
						console.log(settings.storage.elementStorage);
						
						var elements = AtKit.call('locateElements', settings.storage.elementStorage);
						console.log(elements);
						AtKit.message(elements, function(){ AtKit.lib()('#facebox a:first').focus(); });
						
					} else {
						var character = String.fromCharCode(e.which);
						AtKit.lib()('#asTypeInput').val( AtKit.lib()('#asTypeInput').val() + character );
						
					}
				});
				
			}
			
		};
		
		AtKit.addButton(
			'findParagraphs', 
			settings.baseURL + 'icon.png',
			function(dialogs, functions){
				settings.searchType = 'h1, h2, h3, h4, h5';
				var elements = AtKit.call('locateElements', AtKit.lib()(settings.searchType));
				
				AtKit.message(elements, function(){
					AtKit.lib()('#facebox a:first').focus();
				});
				
				
			},
			testDialogs,
			globalFunctions
		);
		
		AtKit.addButton(
			'findLinks',
			settings.baseURL + 'icon.png',
			function(dialogs, functions){
				settings.searchType = "a";
				var elements = AtKit.call('locateElements', AtKit.lib()(settings.searchType));
				
				AtKit.message(elements, function(){
					AtKit.lib()('#facebox a:first').focus();
				});				
			},
			testDialogs,
			globalFunctions
		);
		
		// Add function to AtKit.
		AtKit.addFn('locateElements', function(elements){
			var output = AtKit.lib()("<div>");
			
			var inputText = AtKit.lib()('<input />', { 'type': 'text',  'id': 'asTypeInput' });
			
			if(elements.length == 0) return AtKit.lib()("<p>", { html: "No elements found" });
			
			output.append( inputText );
			
			console.log(elements);
			
			AtKit.lib().each(elements, function(i, v){
				var newEl = AtKit.lib()('<a>', { href: '#' });
				var mainEl = AtKit.lib()(this);
				var content = AtKit.lib()(mainEl);

				// Check if el is ok
				if(content.text() == "") return;
				
				newEl.html( (i+1) + ". " + content.text() );
				
				newEl.find('img').remove();
				
				newEl.bind('click', function(){
					console.log(settings.storage.elementStorage);
					
					if(AtKit.lib()(mainEl).get(0).tagName == "A") {
						var link = AtKit.lib()(mainEl).attr('href');
					}
				});
				
				settings.storage.elementStorage.push( mainEl );
				
				output.append( AtKit.lib()('<p>').html(newEl.wrap("<p>").get(0)) );
			});
			
			return output;
		});
		
		globalFunctions.bindKeypress();
		
		AtKit.render();
	}(AtKit));

}
