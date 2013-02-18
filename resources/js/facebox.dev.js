/*
 * Facebox (for jQ)
 * version: 1.2 (05/05/2008)
 * @requires jQ v1.2 or later
 *
 * Examples at http://famspam.com/facebox/
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2007, 2008 Chris Wanstrath [ chris@ozmm.org ]
 * 
 * Modified by Magnus White
 */
(function(AtKit) {
	var jQ = AtKit.lib();
	
	var baseURL = AtKit.getResourceURL() + "resources/img/";
	
	jQ.facebox = function(data, klass) {
		jQ.facebox.loading()
		
		if (data.div) fillFaceboxFromHref(data.div)
		else if (jQ.isFunction(data)) data.call(jQ)
		else jQ.facebox.reveal(data, klass)
	}

	/*
	* Public, jQ.facebox methods
	*/

	jQ.extend(jQ.facebox, {
		settings: {
			opacity			: 0,
			overlay			: true,
			loadingImage	: baseURL + 'loading.gif',
			closeImage		: baseURL + 'facebox-close.png',
			imageTypes		: [ 'png', 'jpg', 'jpeg', 'gif' ],
			direction		: (AtKit.getLanguage() == 'ar') ? 'rtl' : 'ltr',
			closeDirection	: (AtKit.getLanguage() == 'ar') ? 'ltr' : 'rlt',
			textAlign		: (AtKit.getLanguage() == 'ar') ? 'right' : 'left',
			closeTextAlign	: (AtKit.getLanguage() == 'ar') ? 'left' : 'right',
			faceboxHtml  	: '\
			<div id="at-facebox" style="font-family: Helvetica Neue,Helvetica,Arial,sans-serif; display:none; position: absolute; top:0; left:0; z-index:2147483647; direction:left; text-align:left; width:410px"> \
				<div class="at-popup" style="position:relative;"> \
					<table style="border-collapse:collapse; border:none"> \
						<tbody> \
							<tr> \
								<td class="at-fb-tl" style="background:url(' + baseURL + ((AtKit.getLanguage() == 'ar') ? 'tr' : 'tl') + '.png); border:0 none; border-bottom:0; padding:0; height:10px; width:10px; overflow:hidden; padding:0;" /><td class="at-fb-b" style="background:url(' + baseURL + 'b.png); border:0 none; border-bottom:0; padding:0;" /><td class="at-fb-tr" style="background:url(' + baseURL + ((AtKit.getLanguage() == 'ar') ? 'tl' : 'tr') + '.png); border:0 none; height10px; width:10px; overflow:hidden ;padding:0;" /> \
							</tr> \
							<tr> \
								<td class="at-fb-b" style="background:url(' + baseURL + 'b.png); border:0 none; border-bottom:0 ;padding:0;" /> \
								<td class="at-fb-tb-body" style="border-bottom:0; padding:10px; background:#fff; width:370px;"> \
									<div class="at-fb-content"> \
									</div> \
									<div class="at-fb-footer" style="border-top:1px solid #DDDDDD; padding-top:5px; margin-top:10px; direction:rtl; text-align:right"> \
										<a href="#" class="close"> \
											<img src="' + baseURL + 'closelabel.gif" title="close" class="close_image" /> \
										</a> \
									</div> \
								</td> \
								<td class="at-fb-b" style="background:url(' + baseURL + 'b.png); border:0 none; border-bottom:0; padding:0;" /> \
							</tr> \
							<tr> \
								<td class="at-fb-bl" style="background:url(' + baseURL + ((AtKit.getLanguage() == 'ar') ? 'br' : 'bl') + '.png); border:0 none; border-bottom:0; padding:0; height:10px; width:10px; overflow:hidden; padding:0;" /><td class="at-fb-b" style="background:url(' + baseURL + 'b.png); border:0 none; border-bottom:0; padding:0;" /><td class="at-fb-br" style="background:url(' + baseURL + ((AtKit.getLanguage() == 'ar') ? 'bl' : 'br') + '.png); border:0 none; border-bottom:0; padding:0; height:10px; width:10px; overflow:hidden; padding:0;" /> \
							</tr> \
						</tbody> \
					</table> \
				</div> \
			</div>'
		},
		
		loading: function() {
			init()
			if (jQ('#at-facebox .at-fb-loading').length == 1) return true
			showOverlay()
	
			jQ('#at-facebox .at-fb-content').empty()
			jQ('#at-facebox .at-fb-tb-body').children().hide().end().
			append('<div class="at-fb-loading"><img src="'+jQ.facebox.settings.loadingImage+'"/></div>')
			
			jQ('#at-facebox').css({
				'top'		:	getPageScroll()[1] + (getPageHeight() / 10),
				'left'		:	385.5,
				'direction'	:	jQ.facebox.settings.direction,
				'text-align':	jQ.facebox.settings.textAlign
			}).show()
			
			jQ('.at-fb-footer').css({
				'direction'	:	jQ.facebox.settings.closeDirection,
				'text-align':	jQ.facebox.settings.closeTextAlign
			}).show()
	
			jQ(document).bind('keydown.facebox', function(e) {
				if (e.keyCode == 27) jQ.facebox.close()
				return true
			})
			jQ(document).trigger('at-fb-loading.facebox')
		},

		reveal: function(data, klass) {
			jQ(document).trigger('beforeReveal.facebox')
			if (klass) jQ('#facebox .at-fb-content').addClass(klass)
			jQ('#at-facebox .at-fb-content').append(data)
			jQ('#at-facebox .at-fb-loading').remove()
			jQ('#at-facebox .at-fb-tb-body').children().fadeIn('normal')
			jQ('#at-facebox').css('left', jQ(window).width() / 2 - (jQ('#facebox table').width() / 2))
			jQ(document).trigger('reveal.facebox').trigger('afterReveal.facebox')
		},

		changeFaceboxContent: function(data) {
			jQ('#at-facebox .at-fb-content').html(data);
		},

		close: function() {
			jQ(document).trigger('close.facebox')
			return false
		}
	})

	/*
	* Public, jQ.fn methods
	*/

	jQ.fn.facebox = function(settings) {
		init(settings)
		
		function clickHandler() {
			jQ.facebox.loading(true)
			
			// support for rel="facebox.inline_popup" syntax, to add a class
			// also supports deprecated "facebox[.inline_popup]" syntax
			var klass = this.rel.match(/facebox\[?\.(\w+)\]?/)
			if (klass) klass = klass[1]
			
			fillFaceboxFromHref(this.href, klass)
			return false
		}
		
		return this.click(clickHandler)
	}

	/*
	* Private methods
	*/
	
	// called one time to setup facebox on this page
	function init(settings) {
		if (jQ.facebox.settings.inited) return true
		else jQ.facebox.settings.inited = true
		
		jQ(document).trigger('init.facebox')
		makeCompatible()
		
		var imageTypes = jQ.facebox.settings.imageTypes.join('|')
		jQ.facebox.settings.imageTypesRegexp = new RegExp('\.' + imageTypes + '$', 'i')
		
		if (settings) jQ.extend(jQ.facebox.settings, settings)
		jQ('#sbar').after(jQ.facebox.settings.faceboxHtml)
		
		var preload = [ new Image(), new Image() ]
		preload[0].src = jQ.facebox.settings.closeImage
		preload[1].src = jQ.facebox.settings.loadingImage
		
		jQ('#at-facebox').find('.at-fb-b:first, .at-fb-bl, .at-fb-br, .at-fb-tl, .at-fb-tr').each(function() {
			preload.push(new Image())
			preload.slice(-1).src = jQ(this).css('background-image').replace(/url\((.+)\)/, '$1')
		})
		
		jQ('#at-facebox .close').click(jQ.facebox.close)
		jQ('#at-facebox .close_image').attr('src', jQ.facebox.settings.closeImage)
	}
	
	// getPageScroll() by quirksmode.com
	function getPageScroll() {
		var xScroll, yScroll;
		if (self.pageYOffset) {
			yScroll = self.pageYOffset;
			xScroll = self.pageXOffset;
		} else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		} else if (document.body) {// all other Explorers
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;	
		}
		return new Array(xScroll,yScroll) 
	}
	
	// Adapted from getPageSize() by quirksmode.com
	function getPageHeight() {
		var windowHeight
		if (self.innerHeight) {	// all except Explorer
			windowHeight = self.innerHeight;
		} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
			windowHeight = document.documentElement.clientHeight;
		} else if (document.body) { // other Explorers
			windowHeight = document.body.clientHeight;
		}	
		return windowHeight
	}
	
	// Backwards compatibility
	function makeCompatible() {
		var jQs = jQ.facebox.settings
		
		jQs.loadingImage = jQs.loading_image || jQs.loadingImage
		jQs.closeImage = jQs.close_image || jQs.closeImage
		jQs.imageTypes = jQs.image_types || jQs.imageTypes
		jQs.faceboxHtml = jQs.facebox_html || jQs.faceboxHtml
	}
	
	// Figures out what you want to display and displays it
	// formats are:
	//	 div: #id
	//   image: blah.extension
	//	ajax: anything else
	function fillFaceboxFromHref(href, klass) {
		// div
		if (href.match(/#/)) {
			var url	 = window.location.href.split('#')[0]
			var target = href.replace(url,'')
			jQ.facebox.reveal(jQ(target).clone().show(), klass)
		// image
		} else if (href.match(jQ.facebox.settings.imageTypesRegexp)) {
			fillFaceboxFromImage(href, klass)
		// ajax
		} else {
			fillFaceboxFromAjax(href, klass)
		}
	}
	
	
	function skipOverlay() {
		return jQ.facebox.settings.overlay == false || jQ.facebox.settings.opacity === null 
	}
	
	function showOverlay() {
		if (skipOverlay()) return
		
		if (jQ('facebox_overlay').length == 0) 
			jQ("body").append('<div id="facebox_overlay" class="facebox_hide" style="position: fixed;top: 0px;left: 0px;height:100%;width:100%;"></div>')
		
		jQ('#facebox_overlay').hide().addClass("facebox_overlayBG")
			.css('opacity', jQ.facebox.settings.opacity)
			.click(function() { jQ(document).trigger('close.facebox') })
			.fadeIn(200)
		return false
	}
	
	function hideOverlay() {
		if (skipOverlay()) return
	
		jQ('#facebox_overlay').fadeOut(200, function(){
			jQ("#facebox_overlay").removeClass("facebox_overlayBG")
			jQ("#facebox_overlay").css("z-index", "-100"); 
			jQ("#facebox_overlay").remove()
		})
	
		return false
	}
	
	/*
	* Bindings
	*/
	
	jQ(document).bind('close.facebox', function() {
		jQ(document).unbind('keydown.facebox')
		jQ('#at-facebox').fadeOut(function() {
			jQ('#at-facebox .at-fb-content').removeClass().addClass('at-fb-content')
			hideOverlay()
			jQ('#at-facebox .at-fb-loading').remove()
		})
	})

})(AtKit);