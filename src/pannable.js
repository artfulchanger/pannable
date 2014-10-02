// myObject - an object representing a concept that you want 
// to model (e.g. a car)
var Pannable = {
	init: function( options, elem ) {
		// Mix in the passed-in options with the default options
		this.options = $.extend( {}, this.options, options );

		// Save the element reference, both as a jQuery
		// reference and a normal reference
		this.elem  = elem;
		this.$elem = $(elem);

		// Start aynchronous tasks
		if (this.options.background)
			_loadBackgroundImage(this.$elem);

		// Initialize plugin
		this._setupDragging();

		// Return this so that we can chain
		return this;
	},

	options : {
	    background: true,
	    selector:  "*",
	    axis:       "",
	    friction:    Infinity,
	    limit:      "",
	    onPanningStarted : function() {},
	    onPanningFinished : function() {}
	},

	// True while dragging, false otherwise
	_isDragging : false,
	// 
	_time : 0,
	//
	_slidingVelocity : {x: 0, y: 0},
	//
	_oldPosition : {x: 0, y: 0},

	_setupDragging: function() {
		var element = this.$elem;
		var options = this.options;

		var that = this;

		// We're initializing, no dragging is possible yet
		that._isDragging = false;

		// On mouse down
		element.on('mousedown touchstart', function(event) {
			event.preventDefault();

		    // Save which element we're dragging
		    that._isDragging = element;

			that._oldPosition = { x: event.pageX, y: event.pageY };

			// Fire event
		    options.onPanningStarted.call(this);

			// Listen to mouse motion      
			$(window).mousemove(function(event) {
				// Update position
				position = { x: event.pageX, y: event.pageY };

				// Compute mouse shift
				shift = { x: position.x - that._oldPosition.x, y: position.y - that._oldPosition.y };
				
				// Apply bounds, if any
				if (options.axis == "x")
					shift.y = 0;
				if (options.axis == "y")
					shift.x = 0;

				if (options.background && element.data("backgroundImage")) {
					bg = { x: parseInt(element.css("background-position-x")), y: parseInt(element.css("background-position-y")) };


					var x0 = parseInt(element.css("background-position-x"));
					var y0 = parseInt(element.css("background-position-y"));
					var x = x0 + shift.x;
					var y = y0 + shift.y;
					// Determine the size of pannable component
					var elementSize = { width: element.width(), height: element.height()};

					switch (options.limit) {
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

				var items = element.find(options.selector);
				items.css("left", "+=" + shift.x + "px");
				items.css("top", "+=" + shift.y + "px");

				// Update time
				this._time = performance.now();

		    	// Compute and clip sliding velocity
		    	var elapsedTime = performance.now() - that._time;

		    	var distance = {x: (position.x - that._oldPosition.x), y: position.y - that._oldPosition.y}

		    	that._slidingVelocity = {x: distance.x / elapsedTime, y: distance.y / elapsedTime};

				// Update position
				that._oldPosition = position;
			});

		});		

		// On mouse up
		$(window).on('mouseup touchend', function(e) {
			var element = that.element;
			var options = that.options;

			if (!that._isDragging)
				return;

			$(window).unbind("mousemove");

			position = { x: event.pageX, y: event.pageY };

			// Fire event
		    options.onPanningFinished.call(that);

		    // Apply inertia
		    if (options.friction == Infinity) {
		    } else if ($.isNumeric(options.friction) && options.friction > 0) {
		    	var max = 0.5;
		    	var n = norm(that._slidingVelocity);
		    	console.log(norm(that._slidingVelocity));
		    	if (n > max)
	    			that._slidingVelocity = scale(that._slidingVelocity, max / n);

				// Update time
				that._time = performance.now();

				// Start the animation.
				requestAnimationFrame(_slide);
		    } else {

		    }

			that._isDragging = false;		    
		});	

		function norm(vector) {
			return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
		}

		function scale(vector, scale) {
			return {x: vector.x * scale, y: vector.y * scale };
		}

		function dampAxis(value, elapsedTime, friction) {
			if (value > 0) {
				value -= friction * (elapsedTime / 1000);
				if (value < 0) value = 0;
			} else if (value < 0) {
				value += friction * (elapsedTime / 1000);
				if (value > 0) value = 0;
			}
			return value;
		}

		function damp(vector, elapsedTime, friction) {
			return { x: dampAxis(vector.x, elapsedTime, friction), y: dampAxis(vector.y, elapsedTime, friction)};
		}

		// Animate
		function _slide(highResTimestamp) {
			var id = requestAnimationFrame(_slide);

			var elapsedTime = highResTimestamp - that._time;
		
//			that._slidingVelocity = damp(that._slidingVelocity, elapsedTime, that.options.friction);

			that._slidingVelocity = scale(that._slidingVelocity, (1 - that.options.friction * (elapsedTime / 1000)));

			//console.log("elapsedTime: " + elapsedTime + ", that._slidingVelocity.y: " + that._slidingVelocity.y);

			var shift = {x: (that._slidingVelocity.x * elapsedTime), y: (that._slidingVelocity.y * elapsedTime)};

			if (options.background && element.data("backgroundImage")) {
				element.css("background-position-x", "+=" + shift.x + "px");
				element.css("background-position-y", "+=" + shift.y + "px");
			}

			var items = element.find(options.selector);
			items.css("left", "+=" + shift.x + "px");
			items.css("top", "+=" + shift.y + "px");

			// Update timestamp
			that._time = highResTimestamp;

			if (norm(that._slidingVelocity) < 0.000001) {
				console.log("end");
				cancelAnimationFrame(id);
			}
		}
	}

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




