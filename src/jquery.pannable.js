/*
* pannable
* https://github.com/artfulchanger/pannable
*
* Copyright (c) 2014 Andrea Gentili
* Licensed under the MIT license.
*/

(function($) {

	var isDragging;

	var backgroundImage = { loaded: false };

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

		var backgroundImage = {};
		if (unit.x == '%') {
			backgroundImage.x = Math.round((elementSize.width - imageSize.width * scale) * percent.x / 100);
		}
		if (unit.y == '%') {
			backgroundImage.y = Math.round((elementSize.height - imageSize.height * scale) * percent.y / 100);
		}
		
		// Set background position in pixels
		element.css('background-position', backgroundImage.x + "px " + backgroundImage.y + "px");

		element.data.loaded = true;
	}

	// Collection method.
	$.fn.pannable = function() {
	return this.each(function(i) { // Repeat for each selected element.

		var element = $(this);

		// Load background image, if any
		var imageUrl = $(this).css('background-image').replace(/url\(|\)$/ig, '');
		if (imageUrl) {
			backgroundImage = new Image();
			backgroundImage.onload = function() {
				var imageSize = { width: this.width, height: this.height, };
				callback(element, imageSize);
			};

			backgroundImage.src = imageUrl;
		}

		element = $(this);

		//
		var oldPosition;

		// We're initializing, no dragging is possible yet
		isDragging = false;

		// On mouse down
		$(this).on('mousedown touchstart', function(event) {
			event.preventDefault();

			oldPosition = { x: event.pageX, y: event.pageY };

			// Listen to mouse motion      
			$(window).mousemove(function(event) {
				isDragging = true;

				position = { x: event.pageX, y: event.pageY };

				shift = { x: position.x - oldPosition.x, y: position.y - oldPosition.y };

				if (element.data.loaded) {
					bg = { x: parseInt(element.css("background-position-x")), y: parseInt(element.css("background-position-y")) };

					element.css("background-position-x", "+=" + shift.x + "px");
					element.css("background-position-y", "+=" + shift.y + "px");
				}

					element.children().css("left", "+=" + shift.x + "px");
					element.children().css("top", "+=" + shift.y + "px");


				oldPosition = position;
			});

		});

		// On mouse up
		$(window).on('mouseup touchend', function(e) {

			var wasDragging = isDragging;
			isDragging = false;
			$(window).unbind("mousemove");

		});

	});
};


}(jQuery));

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
