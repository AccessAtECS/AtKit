/*!
 * AtKit Core
 * Open Source Cross-Browser ToolBar framework
 *
 * Copyright (c) 2010. University of Southampton
 * Developed by Sebastian Skuse
 * http://access.ecs.soton.ac.uk/ToolBar/
 *
 * Licensed under the BSD Licence.
 * http://www.opensource.org/licenses/bsd-license.php
 *
 */

var AtKit = (function (window) { 

	// Internal properties
	var private = {
		__version: 2.0, // Version.
		__build: 57, // Build.
		__baseURL: "http://access.ecs.soton.ac.uk/ToolBar/", // Load AtKit assets from here.
		__libURL: "http://ajax.googleapis.com/ajax/libs/jquery/1.6/jquery.min.js", // URL to jQuery. CDN preferred unless this is a local install.
		__cycle: "alpha", // Release cycle for this version of AtKit.
		__channel: "echo", // Release channel we're running in.
		__invoked: false, // Is the framework already loaded?
		__debug: true, // Debug mode on or off.
		__loadAttempts: 0, // Container for number of load attempts
		__maxLoadAttempts: 30, // Maximum number of times we'll try and load the library (one try every 500ms)
		__errorMessageTimeout: 2000 // Time before error message will disapear.
	}
	
	private.__assetURL = private.__baseURL + "channels/" + private.__channel + "/presentation/";
	private.__aboutDialog = {
		HTML: "",
		CSS: {
			"#ATKFBAbout" : "font-family: Helvetica, Verdana, Arial, sans-serif;font-size:12px;color: #364365;",
			"#ATKFBAbout h1" : "border-bottom: 1px solid #DDD; font-size: 16px; margin-bottom: 5px; margin-top: 10px; padding-bottom: 5px;"
		}
	}
	
	// Public object that affects how AtKit behaves. Host toolbar has access to this.
	var public = {
		transport: 'JSONP', // AJAX transport method.
		window: window, // Reference for the window object we're using.
		global: {
			buttons: {},
			dialogs: {}, // Global dialogs (can be called through API.show)
			fn: {}, // Global functions (can be called through API.call)
			unloadFn: {} // Functions to run when we unload
		},
		buttons: {}, // Object for every button. Object with the layout: { identifier: { function: function(), tip: 'tip', state: 'enabled' } }
		languageMap: {}, // Translations
		siteFixes: [] // Contains object for each site {regex: /regex/, function: function()} //
	}
	
	// API object. Everything in here becomes public after AtKit has finished executing
	var API = {
		__env: public, // Load public object into API accessible object
		__templates: {
			"barGhost": "<center><img src=\"" + private.__assetURL + "images/loading.gif\" style=\"margin-top:10px;\" /></center>",
			"barFailed": "<center>library loading failed</center>",
			"button": '<div id="at-btn-(ID)" class="at-btn"><a title="(TITLE)" id="at-lnk-(ID)" href="#s-b-c"><img src="(SRC)" alt="(TITLE)" border="0" /></a></div>'
		},
		__CSS: {
			"#sbar": "background-color:#EBEAED; background-image:url('" + private.__assetURL + "images/background.png'); background-repeat:repeat-x; height:40px; left:0; line-height:40px; margin-left:auto; margin-right:auto; margin-top:0; padding:0px 5px 0px 5px; position:fixed; top:0; width:100%; z-index:9999998;",
			"#sbarGhost": "height:40px; width:100%;",
			".at-btn": "background-repeat: no-repeat; background-position: left; background: url(" + private.__assetURL + "images/button_background.png) no-repeat; background-color: transparent;height:28px;width:28px;float:left;line-height: 14px;text-align:center;color: white;margin: 5px 0px 0px 5px;clear:none;",
			".at-btn a": "display:block;height:28px;width:28px;background: transparent;position: inherit;",
			".at-btn a:active": "border: yellow solid 2px;",
			".at-btn img": "margin: 0;padding:6px;border: none;background: none;"
		},
		settings: {
			'noiframe': true, // Don't load if we're in an iframe.
			'allowclose': false, // Enable the close button
			'allowreset': false, // Allow the page reset button
			"logoURL": '', 
			"name": '',
			"about": ''
		},
		$: '' // Library used for the Toolbar
	}
	
	var $ = '';
	
	//////////////////////////////
	// Private internal methods //
	//////////////////////////////
	
	// Bootstrap function
	function bootstrap(){
		if(private.__debug) console.log('bootstrapping AtKit...');
		// If we're invoked already don't load again.
		if( isLoaded() || private.__invoked ) return;

		// Don't load if we're not the top window (running in an iframe)
		if(API.settings.noiframe && window != window.top) return;

		// Set window, if we're running in GreaseMonkey, we'll need access to unsafeWindow rather than window.
		if(typeof unsafeWindow == "undefined"){
			public.window = window;
		} else {
			public.window = unsafeWindow;
			public.transport = "GM-XHR";
		}
		
		// Show the loading bar to the user.
		showLoader();
		
		// Load Library.
		loadLibrary();
	}
	
	function loadLibrary(){
		if(private.__debug) console.log('loadLibrary called');
		// Do we have a jQuery library loaded already?
		if(typeof jQuery != "undefined"){
			try {
				// We need jQuery 1.4 or above. Get the version string.
				jQversion = parseFloat($().jquery.match(/\d\.\d/));
				if(private.__debug) console.log('jQuery already loaded, v' + jQversion);
			
				if(jQversion > 1.4) {
					$ = window.$;
					API.$ = $;
					
					broadcastLoaded();
				return;
				}
			} catch(e){}
		}
		
		if(private.__debug) console.log('jQuery not loaded, loading jQ 1.6');
		// jQuery not loaded. Attach.
		attachJS( 'atkit-jquery', private.__libURL );
		
		// Wait for library to load.
		waitForLib();
	}
	
	function waitForLib(){
		if(private.__debug) console.log('waitForLib invoked');
		// If we are at the max attempt count, stop.
		if( private.__loadAttempts == private.__maxLoadAttempts ) {
			if(private.__debug) console.log('Max load count reached: stopping execution.');
			loadFailed();
			return;
		}
		
		// Check to see if jQuery has loaded. If not set a timer and increment the loadAttempts (so we don't flood the user if site is inacessible)
		if ( typeof jQuery == 'undefined' ) {
			if(private.__debug) console.log('waitForLib: jQuery undefined.');
			setTimeout(function(){ waitForLib() }, 100);
			private.__loadAttempts++;
		} else {
			// Bind jQuery to internal namespace.
			// From now on, to access jQuery, we use API.lib() (binds to $).
			$ = jQuery.noConflict();
			API.$ = $;
			
			// Load facebox.
			API.addScript(private.__baseURL + "channels/" + private.__channel + "/facebox.js", function(){});
			
			// Once the document is ready broadcast ready event.
			$(document).ready(function(){ broadcastLoaded(); });
		}
	}
	
	function broadcastLoaded(){
		if(private.__debug) console.log('broadcastLoaded fired.');
		
		//return API to the global namespace.
		public.window.AtKit = API;
		
		// Send event to the plugin, if a listener has been defined.
		if (typeof window.AtKitLoaded != "undefined") window.AtKitLoaded.fire(null, { version: private.__version });
	}
	
	// AtKit may break some websites. Authors of toolbars are able, through attachSiteFix, fix any issues with sites.
	function siteFixes(){
		if(private.__debug) console.log('siteFixes fired. Running fixes.');
		if(API.__env.siteFixes.length == 0) return;
		for(fix in API.__env.siteFixes){
			var sf = API.__env.siteFixes[fix];
			if( sf.regex.test() ){
				sf.f();
			}
		}
	}
	
	function renderButton(ident){
		if(private.__debug) console.log('renderButton fired for ident ' + ident + '.');
		// Pull down the template.
		var b = API.__templates.button;
		
		// Replace in the template.
		b = b.replace(/\(ID\)/ig, ident);
		b = b.replace(/\(TITLE\)/ig, "");
		b = b.replace(/\(SRC\)/ig, API.__env.buttons[ident].icon);
		
		// jQuery'ify
		b = $(b);
		
		// Bind the click event
		b.children('a').bind('click', { button: API.__env.buttons[ident] }, function(button){
			API.__env.buttons[ident].action(button.data.button.dialogs, button.data.button.functions);
		});
		
		// Emulate CSS active, hover, etc.
		b.children('a').bind('focus', function(){
			$(this).attr('style', $(this).attr('style') + API.__CSS[".at-btn a:active"]);
		});
		
		b.children('a').bind('focusout', function(){
			$(this).attr('style', API.__CSS[".at-btn a"]);
		});
		
		// Commit the HTML
		API.__env.buttons[ident].HTML = b;
		
		// Return the HTML
		return API.__env.buttons[ident].HTML;
	}
	

	// Private function used to actually start the toolbar.
	function start(){
		// If we're already invoked ignore.
		if( private.__invoked ) return;
		
		// Insert the bar holder 
		$( $('<div>', { id: 'sbar' }) ).insertAfter("#sbarGhost");
		
		// Insert the logo.
		$(
			$("<a>", { id: 'sbarlogo', click: function(){ showAbout() } }).append(
				$("<img>", { "src": API.settings.logoURL, "align": "left", "border": "0", "title": API.settings.name + "Logo", "title": "About", "style": "float:left;margin-top:10px;" }) 
			)
		).appendTo('#sbar');
		
		$("<img>", { "src": private.__baseURL + "stat.php?channel=" + private.__channel + "&version=" + private.__version + "." + private.__build }).appendTo("#sbar");		
				
				
				
		// add the reset button (if we have been told to use this)
		if( API.settings.allowreset ){
			API.addButton('atkit-reset', private.__baseURL + '/presentation/images/reset.png', function(){ location.reload(true) }, {}, {});
		}
			
		// add the close button (if we have been told to use this)
		if( API.settings.allowclose ){
			API.addButton('atkit-unload', private.__baseURL + '/presentation/images/close.png', function(){ API.close(); }, {}, {});
		}
			
		// Add buttons.
		for(b in API.__env.buttons){
			$( renderButton(b) ).appendTo('#sbar');
		}
		
		// Apply CSS
		applyCSS();
		
		// Apply site fixes
		siteFixes();
		
		// IE 6 fix
		if ( $.browser == "msie" && API.lib().browser.version == 6 ) {
			$('#sbarGhost').remove();
		} else {
			$('#sbarGhost').html("&nbsp;");
		}
		
		// Set state to invoked.
		private.__invoked = true;
		
		// Set unload function
		API.__env.global.unloadFn['default'] = function(){
			$('#sbarGhost').remove();
			$('#sbar').remove();
		}
	}
	
	// Apple the CSS rules that have been defined
	function applyCSS(obj){
		var cssObj = (typeof obj == "undefined") ? API.__CSS : obj;
		for(c in cssObj){
			if($( c ).length > 0) $( c ).attr('style', cssObj[c]);
		}
	}
	
	// Shut down the toolbar
	function stop(){
		// Run unload functions
		for(f in API.__env.global.unloadFn){
			API.__env.global.unloadFn[f]();
		}
	}
	
	function showAbout(){
		if(private.__aboutDialog.HTML == ""){
			// Create the dialog
			private.__aboutDialog.HTML = "<h1>About " + API.settings.name + "</h1>";
			
			// Append user text
			private.__aboutDialog.HTML += "<p id='ATKFBUserSpecifiedAbout'>" + API.settings.about + "</p>";
			
			// Append AtKit text
			private.__aboutDialog.HTML += "<p>Powered by <a href='http://kit.atbar.org/'>AtKit</a> " + private.__cycle + " v" + private.__version.toFixed(1) + "." + private.__build + " (" + private.__channel + " release channel)</p>";
			// Convert to jQuery object & wrap
			private.__aboutDialog.HTML = $("<div>", { id: "ATKFBAbout" }).append(private.__aboutDialog.HTML);
		}
		API.message(private.__aboutDialog.HTML);
		applyCSS(private.__aboutDialog.CSS);
	}
	
	// Functions below here (but above the API functions) run with NO jQuery loaded.
	
	// checks to see if the sbar element is loaded into the DOM.
	function isLoaded(){
		if(document.getElementById('sbar') != null) return true;
		return false;
	}

	// show the loading div, ddfined in templates variable in the API.
	function showLoader(){
		// Create the div for the AtKit ghost.
		barGhost = document.createElement('div');
		// Set the ID of the toolbar.
		barGhost.id = "sbarGhost";
		barGhost.innerHTML = API.__templates.barGhost;
		
		// Insert it as the first node in the body node.
		document.body.insertBefore(barGhost, document.body.firstChild);
	}

	// Attach a javascript file to the DOM
	function attachJS(identifier, url){
		var j = document.createElement("script");
		j.src = url;
		j.type = "text/javascript";
		j.id = identifier;
		document.getElementsByTagName('head')[0].appendChild(j);	
	}
	
	// Called when loading of the library failed and er've given up waiting.
	function loadFailed(){
		bar = document.getElementById('sbarGhost');
		
		bar.innerHTML = API.__templates.barFailed;
		
		setTimeout(function(){
			body = document.getElementsByTagName('body');
			bar = document.getElementById('sbarGhost');
			body[0].removeChild(bar);
		}, private.__errorMessageTimeout );
	}
		
	
	/////////////////////////
	// API functions below //
	/////////////////////////
	
	// Set toolbar name
	API.setName = function(name){
		API.settings.name = name;
	}
	
	API.setAbout = function(aboutText) {
		API.settings.about = aboutText;
	}
	
	// Set toolbar logo
	API.setLogo = function(logo){
		API.settings.logoURL = logo;
	}
	
	// Add a CSS rule. Identifier is a jQuery selector expression, eg #bar. inlineStyle appears in the style attr in the DOM.
	API.setCSS = function(identifier, inlineStyle){
		API.__CSS[identifier] = inlineStyle;
	}
	
	// Add a site fix.
	API.addFix = function(regex, f){
		API.__env.siteFixes.push({ 'regex': regex, 'f': f });
	}
	
	// Attach a JS file to the current document using jQuery, or if not loaded, the native function we have.
	API.addScript = function(url, callback){
		if(typeof jQuery != "undefined"){
			$.getScript(url, function() { callback() });
		} else {
			attachJS("", url);
		}
	}
	
	// Add a global function
	API.addFn = function(identifier, fn){
		API.__env.global.fn[identifier] = fn;
	}
	
	API.addCloseFn = function(identifier, fn){
		API.__env.global.closeFn[identifier] = fn;
	}
	
	// Add a global dialog
	API.addDialog = function(identifier, title, body){
		API.__env.global.dialogs[identifier] = { 'title': title, 'body': body }
	}	
	
	// Attach a button to the toolbar
	// Assets should be an object containing any dialogs that will be shown with facebox, as well a
	API.addButton = function(identifier, icon, action, dialogs, functions){
		API.__env.buttons[identifier] = { 'icon': icon, 'action': action, 'dialogs': dialogs, 'functions': functions };
		
		if(private.__invoked){
			$( renderButton(identifier) ).appendTo('#sbar');
		}
	}
	
	// Remove a button from the toolbar
	API.removeButton = function(identifier){
		delete API.__env.buttons[identifier];
		
		if(private.__invoked){
			if(private.__debug) console.log('remove button ' + identifier);
			// If we've already been rendered we need to remove it from the DOM, too.
			$("#at-btn-" + identifier).remove();
		}
	}	
	
	// Pass in a dialog and we'll format it and show to the users.
	API.show = function(dialog, callback){
		dialog = $("<div>", { "class": "userDialog" }).append(
			$('<h2>', { 'text': dialog.title }),
			$("<p>", { 'text': dialog.body })
		);
		
		$.facebox(dialog);
		if(typeof callback != "null" && typeof callback != "undefined") callback();
	}
	
	// Show message not stored in a dialog object.
	API.message = function(data, callback){
		$.facebox(data);
		
		if(typeof callback != "null" && typeof callback != "undefined") callback();
	}
	
	// Call a global function
	API.call = function(identifier){
		return API.__env.global.fn[identifier]();
	}
	
	// Return library.
	API.lib = function(){
		if(typeof $ == 'function') return $;
		if(typeof $ == 'string' && typeof window.$ == 'function') return window.$;
		return false;
	}
	
	// Toolbar calls this to render the bar.
	API.render = function(){
		start();
	}
	
	// Called to close the toolbar
	API.close = function(){
		stop();
	}
	
	// Bootstrap the application
	bootstrap();

	
}(window));
