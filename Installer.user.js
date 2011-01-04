// --------------------------------------------------------------------
//
// This is a Greasemonkey user script.
//
// To install, you need Greasemonkey: http://greasemonkey.mozdev.org/
// Then restart Firefox and revisit this script.
// Under Tools, there will be a new menu item to "Install User Script".
// Accept the default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts,
// select "AtBar", and click Uninstall.
//
// --------------------------------------------------------------------
//
// ==UserScript==
// @name          AtBar
// @namespace     http://access.ecs.soton.ac.uk/ToolBar/
// @description   AtBar cross-platform, cross-browser toolbar
// @include       *
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js
// @require       http://access.ecs.soton.ac.uk/ToolBar/channels/toolbar-stable/jquery.spell.js
// @require       http://access.ecs.soton.ac.uk/ToolBar/channels/toolbar-stable/jquery.tipsy.js
// @require       http://access.ecs.soton.ac.uk/ToolBar/channels/toolbar-stable/jquery.facebox.js
// @require       http://access.ecs.soton.ac.uk/ToolBar/channels/toolbar-stable/button.class.js
// ==/UserScript==

d=document;jf=d.createElement('script');jf.src='http://access.ecs.soton.ac.uk/ToolBar/channels/ATBar/ATBar.js';jf.type='text/javascript';jf.id='AtKitLib';d.getElementsByTagName('head')[0].appendChild(jf);