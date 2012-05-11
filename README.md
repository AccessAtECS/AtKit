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


Documentation
------------
Documentation on public functions provided by AtKit can be found [here](http://api.atbar.org/Documentation).


Bug tracker
-----------

Have a bug? Please create an issue here on GitHub!

https://github.com/AccessAtECS/AtKit/issues

Note that this tracker is for bugs with AtKit, and not ATBar. If you have a problem with the ATBar project, please file a bug [there instead](https://github.com/AccessAtECS/ATBar/issues).



Copyright and license
---------------------

Copyright 2012 University of Southampton.

Licensed under the BSD Licence.
http://www.opensource.org/licenses/bsd-license.php