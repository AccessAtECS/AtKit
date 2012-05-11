[AtKit](http://api.atbar.org/)
=================

AtKit is a JavaScript + jQuery toolkit for building cross-platform browser toolbars. AtKit toolbars require no client installation, and can run from the user's browser (a bookmarklet), or built into a webpage. To see an example of a toolbar created with AtKit see [ATBar](http://www.atbar.org/).



Quick start
-----------

Clone the repo, `git clone git@github.com:AccessAtECS/AtKit.git`, or [download the latest release](https://github.com/AccessAtECS/AtKit/zipball/master).


Usage
-----------
AtKit is best used directly from our servers. There are three versions available, a minified version (for production), a development version without logging, and a development version with logging. To include these in your website:

+ **Minified version** `http://c.atbar.org/atkit/AtKit.min.js`
+ **Development version** `http://c.atbar.org/atkit/AtKit.js`
+ **Development version (with logging)** `http://c.atbar.org/atkit/AtKit-dev.js`


Usage with SSL
-----------
Alternatively, if your application requires SSL support you may use the SSL versions (which are the same as above, just served over SSL):

+ **Minified version** `https://ssl.atbar.org/c/atkit/AtKit.min.js`
+ **Development version** `https://ssl.atbar.org/c/atkit/AtKit.js`
+ **Development version (with logging)** `https://ssl.atbar.org/c/atkit/AtKit-dev.js`


Including in JavaScript
------------
Your script can automatically select the appropriate SSL/non SSL with the following line:

```
d=document;jf=d.createElement('script');jf.src=('https:' == document.location.protocol ? 'https://ssl.atbar.org/c' : 'http://c.atbar.org') + '/atkit/AtKit.min.js';jf.type='text/javascript';jf.id='AtKitLib';d.getElementsByTagName('head')[0].appendChild(jf);
```
Note this will include the minified (production) version.


Plugins
------------
You can bundle chunks of AtKit function calls as an AtKit Plugin (for documentation on how to properly format a plugin, see [this article](http://api.atbar.org/Plugins)). We have a repository of current plugins [here](https://github.com/AccessAtECS/AtKitPlugins) (for which you can fork, improve or add plugins to) which are listed on our [MarketPlace](http://marketplace.atbar.org/).

**Watch out for:**

+ Don't call `AtKit.render();` from a plugin. This should be done from the toolbar container.


Documentation
------------
Documentation on public functions provided by AtKit can be found [here](http://api.atbar.org/Documentation).


Bug tracker
-----------

Have a bug? Please create an issue here on GitHub!

https://github.com/AccessAtECS/AtKit/issues

Note that this tracker is for bugs with AtKit, and not ATBar. If you have a problem with the ATBar project, please file a bug [there instead](https://github.com/AccessAtECS/ATBar/issues).


Example & anatomy of a toolbar
-----------

The entrypoint for an AtKit toolbar is your toolbar.user.js file. An example of this file is below:

```
if(typeof window['AtKit'] == "undefined"){
	// Load AtKit
	
	d=document;jf=d.createElement('script');jf.src=('https:' == document.location.protocol ? 'https://ssl.atbar.org/c' : 'http://c.atbar.org') + '/atkit/AtKit.min.js';jf.type='text/javascript';jf.id='AtKitLib';d.getElementsByTagName('head')[0].appendChild(jf);

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

	window['AtKitLoaded'] = new AtKitLoaded();
	window['AtKitLoaded'].subscribe(function(){ __start(); });
} else {
	__start();
}

function __start(){
		
	// Start toolbar code
	(function (window, AtKit) { 

		$lib = AtKit.lib();
		
		settings.baseURL = ('https:' == document.location.protocol ? 'https://ssl.atbar.org/c/ATBar2/' : 'http://c.atbar.org/ATBar2/');
		
		var plugins = ["resize", "spellng", "dictionary", "readability", "wordprediction", "css", "shortcutkeys", "tooltip"];
		
		var onLoad = function(){
		
			// Set our logo
			AtKit.setLogo(AtKit.getResourceURL() + "images/atbar.png");
			AtKit.setName("Test Toolbar");
			
			AtKit.setLanguage("GB");
			
			AtKit.setAbout("Just a test toolbar");
			
			// Add all the plugins to the toolbar
			
			$lib.each(plugins, function(i, v){
				AtKit.addPlugin(v);
			});
		
			// Run
			AtKit.render();
		};
		
		
		AtKit.importPlugins(plugins, onLoad);
		
		
	}(window, AtKit));

}
```

This file does two things:

+ Checks for existance of AtKit running on the page and loads it if it is not already.
+ Tells AtKit to load a set of plugins, and then render to the page.

**How to use**
To run the toolbar, create a link with the following href:

`javascript:(function()%7Bd=document;jf=d.createElement('script');jf.src='http://www.example.com/path/to/toolbar.user.js';jf.type='text/javascript';jf.id='ToolBar';d.getElementsByTagName('head')%5B0%5D.appendChild(jf);%7D)();`

Changing `example.com/path/to/toolbar.user.js` to the URL of where your toolbar is saved. This can also be saved as a bookmark and will activate the toolbar for whatever page the user is currently on.


Copyright and license
---------------------

Copyright 2012 University of Southampton.

Licensed under the BSD Licence.
http://www.opensource.org/licenses/bsd-license.php