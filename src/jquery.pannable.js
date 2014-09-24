/*
* pannable
* https://github.com/artfulchanger/pannable
*
* Copyright (c) 2014 Andrea Gentili
* Licensed under the MIT license.
*/

(function($) {

	var isDragging;

	// Image dictionary
	var _images = {};

	function callback (element, imageSize, position) {

		// Determine declared background position
		var bp = element.css('background-position');
		position = toNumbers(bp);
		// Determine the size of pannable component
		var elementSize = { width: element.width(), height: element.height()};
		// Determine image scale
		var scale = 1;
		switch (element.css('background-size')) {
			case "auto":
			case "contain":
				break;
			case "cover":
				var elementRatio = elementSize.width / elementSize.height;
				var imageRatio = imageSize.width / imageSize.height;
				if (elementRatio < imageRatio) {
					scale = elementSize.height / imageSize.height;
				} else {
					scale = elementSize.width / imageSize.width;
				}
				break;
			default:
				break;
		}

		percent = position[0];
		unit = position[1];

		imageSize.width = imageSize.width * scale;
		imageSize.height = imageSize.height * scale;

		var backgroundImage = {};
		if (unit.x == '%') {
			backgroundImage.x = Math.round((elementSize.width - imageSize.width) * percent.x / 100);
		}
		if (unit.y == '%') {
			backgroundImage.y = Math.round((elementSize.height - imageSize.height) * percent.y / 100);
		}
		
		// Set background position in pixels
		element.css('background-position', backgroundImage.x + "px " + backgroundImage.y + "px");

		element.data("backgroundImage", {width: imageSize.width, height: imageSize.height });
	}


	function _loadBackgroundImage(element) {
		var imageUrl = element.css('background-image').replace(/url\(|\)$/ig, '');
		if (imageUrl) {
			backgroundImage = new Image();
			backgroundImage.onload = function() {
				var imageSize = { width: this.width, height: this.height, };
				callback(element, imageSize);
			};

			backgroundImage.src = imageUrl;
		}
	}

	var _time;

	var _slidingVelocity;

	function _setupDragging(element, settings) {
		//
		var oldPosition;

		// We're initializing, no dragging is possible yet
		isDragging = false;

		// On mouse down
		element.on('mousedown touchstart', function(event) {
			event.preventDefault();

			oldPosition = { x: event.pageX, y: event.pageY };

			// Fire event
		    settings.onPanningStarted.call(this);

			// Listen to mouse motion      
			$(window).mousemove(function(event) {
				isDragging = true;

				position = { x: event.pageX, y: event.pageY };

				shift = { x: position.x - oldPosition.x, y: position.y - oldPosition.y };
				
				if (settings.axis == "x")
					shift.y = 0;
				if (settings.axis == "y")
					shift.x = 0;

				if (settings.background && element.data("backgroundImage")) {
					bg = { x: parseInt(element.css("background-position-x")), y: parseInt(element.css("background-position-y")) };


					var x0 = parseInt(element.css("background-position-x"));
					var y0 = parseInt(element.css("background-position-y"));
					var x = x0 + shift.x;
					var y = y0 + shift.y;
					// Determine the size of pannable component
					var elementSize = { width: element.width(), height: element.height()};

					switch (settings.limit) {
						case "inside":
							if (x < 0)
								shift.x = -x0;
							if (y < 0)
								shift.y = -y0;
							if (x + element.data("backgroundImage").width > elementSize.width)
								shift.x = -x0 + elementSize.width - element.data("backgroundImage").width;
							if (y + element.data("backgroundImage").height > elementSize.height)
								shift.y = -y0 + elementSize.height - element.data("backgroundImage").height;
							break;
						case "covering":
							// Image must always cover the background
							if (x > 0)
								shift.x = -x0;
							if (y > 0)
								shift.y = -y0;
							if (x + element.data("backgroundImage").width < elementSize.width)
								shift.x = -x0 + elementSize.width - element.data("backgroundImage").width;
							if (y + element.data("backgroundImage").height < elementSize.height)
								shift.y = -y0 + elementSize.height - element.data("backgroundImage").height;
							break;
						default:
							// Do nothing
							break;
					}

					element.css("background-position-x", "+=" + shift.x + "px");
					element.css("background-position-y", "+=" + shift.y + "px");

				}

				var items = element.find(settings.selector);
				items.css("left", "+=" + shift.x + "px");
				items.css("top", "+=" + shift.y + "px");

				// Update time
				_time = performance.now() ;

				// Update position
				oldPosition = position;
			});

		});		

		// On mouse up
		$(window).on('mouseup touchend', function(e) {
			var wasDragging = isDragging;
			isDragging = false;
			$(window).unbind("mousemove");

			position = { x: event.pageX, y: event.pageY };

			// Fire event
		    settings.onPanningFinished.call(this);

		    // Apply inertia
		    if (settings.friction != Infinity && settings.friction > 0) {
		    	var elapsedTime = performance.now() - _time;

		    	var distance = {x: (position.x - oldPosition.x), y: position.y - oldPosition.y}

		    	// Compute and clip sliding velocity
		    	_slidingVelocity = {x: distance.x / elapsedTime, y: distance.y / elapsedTime};

		    	var max = 1;
		    	var n = norm(_slidingVelocity);
		    	if (n > max)
		    		_slidingVelocity = scale(_slidingVelocity, 1 / n);

				// Update time
				_time = performance.now();

				// Start the animation.
				requestAnimationFrame(_slide);		    	
		    }
		});	

		function norm(vector) {
			return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
		}

		function scale(vector, scale) {
			return {x: vector.x * scale, y: vector.y * scale };
		}

		function dampAxis(value, elapsedTime) {
			if (value > 0) {
				value -= settings.friction * elapsedTime;
				if (value < 0) value = 0;
			} else if (value < 0) {
				value += settings.friction * elapsedTime;
				if (value > 0) value = 0;
			}
			return value;
		}

		function damp(vector, elapsedTime) {
			return { x: dampAxis(vector.x, elapsedTime), y: dampAxis(vector.y, elapsedTime)};
		}

		// Animate
		function _slide(highResTimestamp) {
			var id = requestAnimationFrame(_slide);

			var elapsedTime = highResTimestamp - _time;
		
			_slidingVelocity = damp(_slidingVelocity, elapsedTime);

			var shift = {x: (_slidingVelocity.x * elapsedTime), y: (_slidingVelocity.y * elapsedTime)};

			if (settings.background && element.data("backgroundImage")) {
				element.css("background-position-x", "+=" + shift.x + "px");
				element.css("background-position-y", "+=" + shift.y + "px");
			}

			var items = element.find(settings.selector);
			items.css("left", "+=" + shift.x + "px");
			items.css("top", "+=" + shift.y + "px");

			// Update timestamp
			_time = highResTimestamp;

			if (norm(_slidingVelocity) < 0.1)
				cancelAnimationFrame(id);
		}
	}






	// Collection method.
	$.fn.pannable = function(action, options) {

        // This is the easiest way to have default options.
        var settings = $.extend(true, {}, $.fn.pannable.defaults, options);

		return this.each(function(i) { // Repeat for each selected element.

			if (!action)
				action = "init";

			switch(action) {
				case "init":
					var element = $(this);

					if (settings.background)
						_loadBackgroundImage(element);

					_setupDragging(element, settings);

					break;
			default:
				break;
			}

		});
	};


}(jQuery));

// Plugin defaults – added as a property on our plugin function.
$.fn.pannable.defaults = {
    background: true,
    selector:  "*",
    axis:       "",
    friction:    Infinity,
    limit:      "",
    onPanningStarted : function() {},
    onPanningFinished : function() {},

    // ... rest of settings ...
};

$.fn.pannable.friction = {
	infinite: 600,
	high: 200,
	low: 200,
	_default: "infinite"
};


/*


jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;


*/



// Helper functions
function toNumbers(strg) {
	// Convert keywords
	strg = strg.replace(/left|top/g, '0px');
	strg = strg.replace(/right|bottom/g, '100%');
	strg = strg.replace(/center/g, '50%');

	// If no unit is present, assume pixels
	strg = strg.replace(/([0-9\.]+)(\s|\)|$)/g, "$1px$2");

	// Parse field
	var res = strg.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/);

	var position = { x : parseFloat(res[1], 10), y: parseFloat(res[3], 10) };
	var unit =  { x : res[2], y: res[4] };
	return [position, unit];
}
