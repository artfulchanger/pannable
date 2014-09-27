/*
* pannable
* https://github.com/artfulchanger/pannable
*
* Copyright (c) 2014 Andrea Gentili
* Licensed under the MIT license.
*/

// Object.create support test, and fallback for browsers without it
if ( typeof Object.create !== 'function' ) {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}

// Create a plugin based on a defined object
$.plugin = function( name, object ) {
	$.fn[name] = function(options) {
		return this.each(function() {
			if (!$.data(this, name)) {
				$.data(this, name, Object.create(object).init(options, this));
			}
		});
	};
};

// With the Speaker object, we could essentially do this:
$.plugin('pannable', Pannable);

