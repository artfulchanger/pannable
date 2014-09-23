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

				oldPosition = position;
			});

		});		

		// On mouse up
		$(window).on('mouseup touchend', function(e) {
			var wasDragging = isDragging;
			isDragging = false;
			$(window).unbind("mousemove");

			// Fire event
		    settings.onPanningFinished.call(this);

		    // Apply inertia
		    if (settings.inertia == "on") {
		    	asdasdasdsd
		    }
		});		
	}
INERT
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
    inertia:    "",
    limit:      "",
    onPanningStarted : function() {},
    onPanningFinished : function() {},

    // ... rest of settings ...
};


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
