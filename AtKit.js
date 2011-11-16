/*!
 * AtKit Core
 * Open Source Cross-Browser ToolBar framework
 *
 * Copyright (c) 2011. University of Southampton
 * Developed by Sebastian Skuse
 * http://www.atbar.org/
 *
 * Licensed under the BSD Licence.
 * http://www.opensource.org/licenses/bsd-license.php
 *
 */
(function(window, undefined) {

	var AtKit = (function() { 
	
		// Internal properties
		AtKit.internal = AtKit.prototype = {
			__version: 1.0, // Version.
			__build: 185, // Build.
			__baseURL: "http://c.atbar.org/", // Load AtKit assets from here.
			__APIURL: "http://a.atbar.org/", // API endpoint
			__libURL: "http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js", // URL to jQuery. CDN preferred unless this is a local install.
			__channel: "echo", // Release channel we're running in for this version of AtKit.
			__invoked: false, // Is the framework already loaded?
			__debug: true, // Debug mode on or off.
			__loadAttempts: 0, // Container for number of load attempts
			__maxLoadAttempts: 30, // Maximum number of times we'll try and load the library (one try every 500ms)
			__errorMessageTimeout: 2000, // Time before error message will disapear.
			__localStorageNamespace: "AtKit_", // Name to use for HTML5 localstorage namespace
			plugins:{}, // Plugins
			localisations: {},
			debugCallback: null,
			language:'GB',
			defaultLanguage: 'GB'
		}
	
		AtKit.internal.__resourceURL = AtKit.internal.__baseURL;
		AtKit.internal.__resourceURL += AtKit.internal.__channel;
		AtKit.internal.__assetURL = AtKit.internal.__resourceURL + "/presentation/";
		AtKit.internal.versionString = "v" + AtKit.internal.__version.toFixed(1) + "." + AtKit.internal.__build + " (" + AtKit.internal.__channel + " release channel)";
		
		AtKit.internal.__aboutDialog = {
			CSS: {
				"#ATKFBAbout" : "font-family:Helvetica, Verdana, Arial, sans-serif;font-size:12px;color:#364365;",
				"#ATKFBAbout h1" : "border-bottom:1px solid #DDD;font-size:16px;margin-bottom:5px;margin-top:10px;padding-bottom:5px",
				"#ATKFBAbout p#ATKFBAboutFooter" : "border-top:1px solid #DDD;padding-top:10px;margin-top:25px;"
			}
		}
		
		// Public object that affects how AtKit behaves. Host toolbar has access to this.
		AtKit.external = AtKit.prototype = {
			transport: 'JSONP', // AJAX transport method.
			window: window, // Reference for the window object we're using.
			global: {
				buttons: {},
				dialogs: {}, // Global dialogs (can be called through API.show)
				storage: {}, // Global settings (API.set() API.get())
				fn: {}, // Global functions (can be called through API.call)
				unloadFn: {}, // Functions to run when we unload
				resetFn: {}
			},
			buttons: {}, // Object for every button. Object with the layout: { identifier: { function: function(), tip: 'tip', state: 'enabled' } }
			languageMap: {}, // Translations
			siteFixes: [] // Contains object for each site {regex: /regex/, function: function()} //
		}
		
		// API object. Everything in here becomes public after AtKit has finished executing
		var API = {
			__env: AtKit.external, // Load public object into API accessible object
			__templates: {
				"barGhost": "<center><img src=\"" + AtKit.internal.__assetURL + "images/loading.gif\" style=\"margin-top:10px;\" /></center>",
				"barFailed": "<center>library loading failed</center>",
				"button": '<div id="at-btn-(ID)" title="(TITLE)" class="at-btn"><a title="(TITLE)" id="at-lnk-(ID)" href="#ATBarLink"><img src="(SRC)" alt="(TITLE)" height="16" width="16" border="0" /></a></div>',
				"spacer": '<div class="at-spacer"></div>',
				"separator": '<div class="at-separator"></div>'
			},
			__CSS: {
				"#sbar": "height:40px;left:0;line-height:40px;margin-left:auto;margin-right:auto;margin-top:0;position:fixed;top:0;width:100%;z-index:9999998;padding:0 5px;background:url(" + AtKit.internal.__assetURL + "images/background.png) repeat-x #EBEAED;",
				"#sbarGhost": "height:40px;width:100%;",
				".at-spacer": "display:block;height:40px;width:40px;float:left",
				".at-separator": "display:block;height:25px;float:left;border-left:2px solid #a9a9a9;margin:7px 7px 4px 7px",
				".at-btn": "height:28px;width:28px;float:left;line-height:14px;text-align:center;color:#FFF;clear:none;margin:5px 0 0 5px;background:url(" + AtKit.internal.__assetURL + "images/button_background.png) no-repeat",
				".at-btn a": "display:block;height:28px;width:28px;background:transparent;position:inherit;",
				".at-btn a:active": "border:yellow solid 2px;",
				".at-btn img": "margin:0;padding:6px;border:none;background:none;",
				"#at-btn-atkit-reset, #at-btn-atkit-unload": "height:28px;width:28px;line-height:14px;text-align:center;color:#FFF;clear:none;float:right;margin:5px 10px 0 0;background:url(" + AtKit.internal.__assetURL + "images/button_background.png) no-repeat;",
				"#facebox button": "height:26px;margin:10px;padding:5px;color:white;background-color:#0064CD;border-color:rgba(0,0,0,0.1) rgba(0,0,0,0.1) rgba(0,0,0,0.25);text-shadow:0 -1px 0 rgba(0,0,0,0.25);background-image: -webkit-linear-gradient(top, #049cdb, #0064cd);border-radius:4px"
			},
			settings: {
				'noiframe': true, // Don't load if we're in an iframe.
				'allowclose': true, // Enable the close button
				'allowreset': true, // Allow the page reset button
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
			if(AtKit.internal.__debug) debug('bootstrapping AtKit ' + AtKit.internal.versionString + '...');
			// If we're invoked already don't load again.
			if( isLoaded() || AtKit.internal.__invoked ) return;
	
			// Don't load if we're not the top window (running in an iframe)
			if(API.settings.noiframe && window != window.top) return;
	
			// Set window, if we're running in GreaseMonkey, we'll need access to unsafeWindow rather than window.
			if(typeof unsafeWindow == "undefined"){
				AtKit.external.window = window;
			} else {
				AtKit.external.window = unsafeWindow;
				AtKit.external.transport = "GM-XHR";
			}
			
			// Load Library.
			loadLibrary();
		}
		
		function loadLibrary(){
			if(AtKit.internal.__debug) debug('loadLibrary called');
			// Do we have a jQuery library loaded already?
			
			if(typeof window.jQuery != "undefined"){
				try {
					// We need jQuery 1.5 or above. Get the version string.
					jQversion = parseFloat(window.$().jquery.match(/\d\.\d/));
					if(AtKit.internal.__debug) debug('jQuery already loaded, v' + jQversion);
				
					if(jQversion > 1.5) {
						$ = window.$;
						API.$ = $;
						
						// Load facebox.
						loadFacebox();
						
						broadcastLoaded();
						return;
					}
				} catch(e){}
			}
			
			if(AtKit.internal.__debug) {
				newVersion = parseFloat(AtKit.internal.__libURL.match(/\d\.\d/));
				debug('jQuery not loaded, loading ' + newVersion);
			}
			// jQuery not loaded. Attach.
			attachJS( 'atkit-jquery', AtKit.internal.__libURL );
			
			// Wait for library to load.
			waitForLib();
		}
		
		function waitForLib(){
			if(AtKit.internal.__debug) debug('waitForLib invoked');
			// If we are at the max attempt count, stop.
			if( AtKit.internal.__loadAttempts == AtKit.internal.__maxLoadAttempts ) {
				if(AtKit.internal.__debug) debug('Max load count reached: stopping execution.');
				loadFailed();
				return;
			}
			
			// Check to see if jQuery has loaded. If not set a timer and increment the loadAttempts (so we don't flood the user if site is inacessible)
			if ( typeof jQuery == 'undefined' ) {
				if(AtKit.internal.__debug) debug('waitForLib: jQuery undefined.');
				setTimeout(function(){ waitForLib() }, 100);
				AtKit.internal.__loadAttempts++;
			} else {
				// Bind jQuery to internal namespace.
				// From now on, to access jQuery, we use API.lib() (binds to $).
				$ = jQuery.noConflict();
				API.$ = $;
				
				// Load facebox.
				loadFacebox();
				
				// Once the document is ready broadcast ready event.
				$(document).ready(function(){ broadcastLoaded(); });
			}
		}
		
		function loadFacebox(){
			if(typeof $.facebox == "undefined") API.addScript(AtKit.internal.__baseURL + "atkit/facebox.js");
		}

		function broadcastLoaded(){
			if(AtKit.internal.__debug) debug('broadcastLoaded fired.');
			
			//return API to the global namespace.
			window['AtKit'] = API;
			
			// Send event to the plugin, if a listener has been defined.
			if (typeof window.AtKitLoaded != "undefined") window.AtKitLoaded.fire(null, { version: AtKit.internal.__version });
		}
		
		// AtKit may break some websites. Authors of toolbars are able, through attachSiteFix, fix any issues with sites.
		function siteFixes(){
			if(AtKit.internal.__debug) debug('siteFixes fired. Running fixes.');
			if(API.__env.siteFixes.length == 0) return;
			for(fix in API.__env.siteFixes){
				var sf = API.__env.siteFixes[fix];
				if( sf.regex.test() ){
					sf.f();
				}
			}
		}
		
		function renderButton(ident){
			if(AtKit.internal.__debug) debug('renderButton fired for ident ' + ident + '.');
			// Pull down the template.
			var b = API.__templates.button;
			
			// Replace in the template.
			b = b.replace(/\(ID\)/ig, ident);
			b = b.replace(/\(TITLE\)/ig, API.__env.buttons[ident].tooltip);
			b = b.replace(/\(SRC\)/ig, API.__env.buttons[ident].icon);
	
			// jQuery'ify
			b = $(b);
	
			// Bind the click event and pass in reference to the button object
			b.children('a').bind('click', { button: API.__env.buttons[ident] }, function(button){
				try {
					API.__env.buttons[ident].action(button.data.button.dialogs, button.data.button.functions);
				} catch (err){
					if(AtKit.internal.__debug) debug(err);
				}
				
				button.preventDefault();
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
			if( AtKit.internal.__invoked ) return;
			
			if($("#sbarGhost").length == 0) showLoader();
			
			// Insert the bar holder 
			$( $('<div>', { id: 'sbar' }) ).insertAfter("#sbarGhost");
			
			// Insert the logo.
			$(
				$("<a>", { id: 'sbarlogo', click: function(){ showAbout() } }).append(
					$("<img>", { "src": API.settings.logoURL, "align": "left", "border": "0", "title": API.settings.name + "Logo", "style": "float:left;margin-top:10px;" }) 
				)
			).appendTo('#sbar');
			
			$("<img>", { "src": AtKit.internal.__APIURL + "stat.php?channel=" + AtKit.internal.__channel + "&version=" + AtKit.internal.__version + "." + AtKit.internal.__build }).appendTo("#sbar");		
					
					
	
			// add the close button (if we have been told to use this)
			if( API.settings.allowclose ){
				API.addButton('atkit-unload', 'Exit', AtKit.internal.__assetURL + 'images/close.png', function(){ API.close(); }, null, null, {'cssClass':'fright'});
			}
					
			// add the reset button (if we have been told to use this)
			if( API.settings.allowreset ){
				API.addButton('atkit-reset', 'Reset webpage', AtKit.internal.__assetURL + 'images/reset.png', function(){ API.reset(); }, null, null, {'cssClass':'fright'});
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
			if ( $.browser == "msie" && $.browser.version == 6 ) {
				$('#sbarGhost').remove();
			} else {
				$('#sbarGhost').html("&nbsp;");
			}
			
			// Set state to invoked.
			AtKit.internal.__invoked = true;

			// Set unload function
			API.__env.global.unloadFn['default'] = function(){
				$('#sbarGhost, #sbar').remove();
			}
			
			API.__env.global.resetFn['default'] = function(){
				location.reload(true);
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
			AtKit.internal.__invoked = false;
		}
		
		function showAbout(){
			// Create the dialog
			AtKit.internal.__aboutDialog.HTML = "<h1>About " + API.settings.name + "</h1>";
			
			// Append user text
			AtKit.internal.__aboutDialog.HTML += "<p id='ATKFBUserSpecifiedAbout'>" + API.settings.about + "</p>";
			
			// Append AtKit text
			AtKit.internal.__aboutDialog.HTML += "<p id='ATKFBAboutFooter'>Powered by <a href='http://kit.atbar.org/'>AtKit</a> " + AtKit.internal.versionString;
			
			var plugins = API.listPlugins();
			
			if(plugins.length > 0){
				AtKit.internal.__aboutDialog.HTML += "<br /> Registered plugins: " + plugins.join(", ");
			}
			
			AtKit.internal.__aboutDialog.HTML += "</p>";
			
			// Convert to jQuery object & wrap
			AtKit.internal.__aboutDialog.HTML = $("<div>", { id: "ATKFBAbout" }).append(AtKit.internal.__aboutDialog.HTML);

			API.message(AtKit.internal.__aboutDialog.HTML);
			applyCSS(AtKit.internal.__aboutDialog.CSS);
		}
		
		function debug(msg){
			if(AtKit.internal.debugCallback != null) {
				AtKit.internal.debugCallback(msg);
			} else {
				if(typeof console != "undefined") console.log(msg);
			}
		}

		// Functions below here (but above the API functions) run with NO jQuery loaded.
		
		// checks to see if the sbar element is loaded into the DOM.
		function isLoaded(){
			if(document.getElementById('sbar') != null) return true;
			return false;
		}
	
		// show the loading div, defined in templates variable in the API.
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
		
		// Called when loading of the library failed and we've given up waiting.
		function loadFailed(){
			bar = document.getElementById('sbarGhost');
			
			bar.innerHTML = API.__templates.barFailed;
			
			setTimeout(function(){
				body = document.getElementsByTagName('body');
				bar = document.getElementById('sbarGhost');
				body[0].removeChild(bar);
			}, AtKit.internal.__errorMessageTimeout );
		}
			
		
		/////////////////////////
		// API functions below //
		/////////////////////////
		
		API.getVersion = function(){
			return AtKit.internal.__version.toFixed(1) + "." + AtKit.internal.__build;
		}
		
		API.isRendered = function(){
			return AtKit.internal.__invoked;
		}

		API.getResourceURL = function(){
			return AtKit.internal.__resourceURL;
		}
		
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
		
		// Set the language that this toolbar uses
		API.setLanguage = function(language) {
			AtKit.internal.language = language;
		}
		
		API.getLanguage = function(){
			return AtKit.internal.language;
		}
		
		// Add a localisation string (value) referenced by key for the language specified in cc.
		API.addLocalisation = function(cc, key, value){
			AtKit.internal.localisations[cc][key] = value;
		}
		
		API.addLocalisationMap = function(cc, map){
			AtKit.internal.localisations[cc] = $.extend(true, AtKit.internal.localisations[cc], map);
		}
		
		// Get a localisation string.
		API.localisation = function(key){
			if(typeof AtKit.internal.localisations[AtKit.internal.language] == "undefined") return AtKit.internal.localisations[AtKit.internal.defaultLanguage][key];
			if(typeof AtKit.internal.localisations[AtKit.internal.language][key] == "undefined") return "{no value set for key " + key + " in language " + AtKit.internal.language + "}";
			return AtKit.internal.localisations[AtKit.internal.language][key];
		}
		
		// Add a site fix.
		API.addFix = function(regex, f){
			API.__env.siteFixes.push({ 'regex': regex, 'f': f });
		}
		
		// Attach a JS file to the current document using jQuery, or if not loaded, the native function we have.
		API.addScript = function(url, callback){
			if(typeof $ != "undefined"){
				if($('script[src="' + url + '"]').length > 0) return;
				
				$.getScript(url, callback);
			} else {
				attachJS("", url);
			}
		}

		API.addStylesheet = function(url, id){
			$('head').append(
				$('<link>', { "rel": "stylesheet", "href": url, "type": "text/css", "id": id })
			);
		}
		
		// Add a global function
		API.addFn = function(identifier, fn){
			API.__env.global.fn[identifier] = fn;
		}
		
		// Add a function to be run on exit.
		API.addCloseFn = function(identifier, fn){
			API.__env.global.closeFn[identifier] = fn;
		}
		
		API.addResetFn = function(identifier, fn){
			API.__env.global.resetFn[identifier] = fn;
		}
		
		// Add a global dialog
		API.addDialog = function(identifier, title, body){
			API.__env.global.dialogs[identifier] = { 'title': title, 'body': body }
		}	
		
		// Attach a button to the toolbar
		// Assets should be an object containing any dialogs that will be shown with facebox, as well a
		API.addButton = function(identifier, tooltip, icon, action, dialogs, functions, options){
			if(typeof API.__env.buttons[identifier] != "undefined") return;
			API.__env.buttons[identifier] = { 'icon': icon, 'tooltip': tooltip, 'action': action, 'dialogs': dialogs, 'functions': functions };
			
			if(options != null) API.__env.buttons[identifier] = $.extend(true, API.__env.buttons[identifier], options);
	
			if(AtKit.internal.__invoked){
				$( renderButton(identifier) ).appendTo('#sbar');
				applyCSS();
			}
		}
		
		// Remove a button from the toolbar
		API.removeButton = function(identifier){
			delete API.__env.buttons[identifier];
			
			if(AtKit.internal.__invoked){
				if(AtKit.internal.__debug) debug('remove button ' + identifier);
				// If we've already been rendered we need to remove it from the DOM, too.
				$("#at-btn-" + identifier).remove();
			}
		}	
		
		API.addSpacer = function(width){
			if(typeof width == "undefined"){
				$(API.__templates.spacer).appendTo('#sbar');
			}
			
			if(!isNaN(width)){
				for(i = 0; i < width; i++){
					$(API.__templates.spacer).appendTo('#sbar');
				}
			}
			applyCSS();
		}

		API.addSeparator = function(){
			$(API.__templates.separator).appendTo('#sbar');
			applyCSS();
		}

		// Load code for plugins
		API.importPlugins = function(plugins, callback){
			var pluginString = (plugins instanceof Array) ? plugins.join(",") : plugins;
			
			API.addScript("http://plugins.atbar.org/" + pluginString + ".js", callback);
		}		
		
		// Add plugin to rendering queue.
		API.addPlugin = function(identifier){
			AtKit.internal.plugins[identifier]["payload"]();
		}
		
		// Register a plugin (called by plugin)
		API.registerPlugin = function(identifier, plugin, metadata){
			AtKit.internal.plugins[identifier] = { "payload": plugin, "metadata": metadata };
		}
		
		// Return an array of plugin names.
		API.listPlugins = function(){
			var pluginList = new Array();
			for(p in AtKit.internal.plugins) pluginList.push(p);
			
			return pluginList;
		}

		API.getPluginMetadata = function(plugin){
			return AtKit.internal.plugins[plugin]["metadata"];
		}
		
		// Pass in a dialog and we'll format it and show to the users.
		API.show = function(dialog, callback){
			dialog = $("<div>", { "class": "userDialog" }).append(
				$('<h2>', { 'html': dialog.title }),
				$("<p>", { 'html': dialog.body })
			);

			$('body').find('.facebox_hide').remove();

			$.facebox(dialog);
			
			applyCSS();
			
			if(typeof callback != "null" && typeof callback != "undefined") callback();
		}
		
		// Show message not stored in a dialog object.
		API.message = function(data, callback){
			$('body').find('.facebox_hide').remove();

			$.facebox(data);
			
			applyCSS();
			
			if(typeof callback != "null" && typeof callback != "undefined") callback();
		}
		
		API.hideDialog = function(){
			$(document).trigger(close.facebox);
		}
		
		// Call a global function
		API.call = function(identifier, args){
			return API.__env.global.fn[identifier](args);
		}
	
		// Set session storage variable k to v.
		API.set = function(k, v){
			API.__env.global.storage[k] = v;
		}
		
		// Get session storage variable set to k.
		API.get = function(k){
			return API.__env.global.storage[k];
		}
		
		// Is HTML5 localstorage available?
		API.storageAvailable = function(){
			return (typeof window.localStorage) ? true : false;
		}
		
		// HTML5 LocalStorage
		// AtKit.storage(k[, v]);
		API.storage = function(key, value){
			if( !API.storageAvailable() ) return false;
			
			var namespaceKey = AtKit.internal.__localStorageNamespace + API.settings.name + "_" + key;

			if(typeof value == "undefined"){
				return window.localStorage.getItem(namespaceKey);
			} else {
				window.localStorage.setItem(namespaceKey, value);
				return true;
			}
		}

		API.clearStorage = function(){
			if( !API.storageAvailable() ) return;

			var namespaceKey = AtKit.internal.__localStorageNamespace + API.settings.name;
			var exp = new RegExp('^' + namespaceKey + '.*');
			
			for(s in window.localStorage){
				if( s.match(exp) ){
					window.localStorage.removeItem(s);
				}
			}
		}
		
		API.setDebugger = function(fn){
			AtKit.internal.debugCallback = fn;
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

		API.reset = function(){
			for(f in API.__env.global.resetFn){
				API.__env.global.resetFn[f]();
			}
			AtKit.internal.__invoked = false;
		}
		
		// Bootstrap the application
		bootstrap();
		
		return API;
	});

window['AtKit'] = new AtKit();

})(window);