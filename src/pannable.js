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
	    limit:      "",
	    onPanningStarted : function() {},
	    onPanningFinished : function() {},
	    layers : {},
	    timeToRest : 0
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
		var options = this.options;

		var that = this;

		// We're initializing, no dragging is possible yet
		that._isDragging = false;

		// On mouse down
		this.$elem.on('mousedown touchstart', function(event) {
			event.preventDefault();

		    // Initialize position and time
			that._oldPosition = { x: event.pageX, y: event.pageY };
			that._time = performance.now();

			// Fire event
		    options.onPanningStarted.call(this);

			// Listen to mouse motion      
			$(window).mousemove(function(event) {

				// Save which element we're dragging
				that._isDragging = that.$elem;

				// Update position
				position = { x: event.pageX, y: event.pageY };

				// Compute mouse shift
				shift = { x: position.x - that._oldPosition.x, y: position.y - that._oldPosition.y };
				
				// Apply bounds, if any
				if (options.axis == "x")
					shift.y = 0;
				if (options.axis == "y")
					shift.x = 0;

				if (options.background && that.$elem.data("backgroundImage")) {
					bg = { x: parseInt(that.$elem.css("background-position-x")), y: parseInt(that.$elem.css("background-position-y")) };


					var x0 = parseInt(that.$elem.css("background-position-x"));
					var y0 = parseInt(that.$elem.css("background-position-y"));
					var x = x0 + shift.x;
					var y = y0 + shift.y;
					// Determine the size of pannable component
					var elementSize = { width: that.$elem.width(), height: that.$elem.height()};

					switch (options.limit) {
						case "inside":
							if (x < 0)
								shift.x = -x0;
							if (y < 0)
								shift.y = -y0;
							if (x + that.$elem.data("backgroundImage").width > elementSize.width)
								shift.x = -x0 + elementSize.width - that.$elem.data("backgroundImage").width;
							if (y + that.$elem.data("backgroundImage").height > elementSize.height)
								shift.y = -y0 + elementSize.height - that.$elem.data("backgroundImage").height;
							break;
						case "covering":
							// Image must always cover the background
							if (x > 0)
								shift.x = -x0;
							if (y > 0)
								shift.y = -y0;
							if (x + that.$elem.data("backgroundImage").width < elementSize.width)
								shift.x = -x0 + elementSize.width - that.$elem.data("backgroundImage").width;
							if (y + that.$elem.data("backgroundImage").height < elementSize.height)
								shift.y = -y0 + elementSize.height - that.$elem.data("backgroundImage").height;
							break;
						default:
							// Do nothing
							break;
					}

					that.$elem.css("background-position-x", "+=" + shift.x + "px");
					that.$elem.css("background-position-y", "+=" + shift.y + "px");

				}

				var items = that.$elem.find(options.selector);
				items.css("left", "+=" + shift.x + "px");
				items.css("top", "+=" + shift.y + "px");

		    	// Compute sliding velocity
		    	var elapsedTime = performance.now() - that._time;
		    	var distance = {x: (position.x - that._oldPosition.x), y: position.y - that._oldPosition.y}
		    	that._slidingVelocity = {x: distance.x / elapsedTime, y: distance.y / elapsedTime};

				// Update position
				that._oldPosition = position;

				// Update time
				that._time = performance.now();
			});

		});		



		// On mouse up
		$(window).on('mouseup touchend', function(e) {
			var options = that.options;

			$(window).unbind("mousemove");

			if (!that._isDragging)
				return;

			// Fire event
		    options.onPanningFinished.call(that);

		    // Apply inertia
		    if (options.timeToRest > 0) {

				var items = that.$elem.find(options.selector);
				var shift = {x: that._slidingVelocity.x * options.timeToRest / 2, y : that._slidingVelocity.y * options.timeToRest  / 2};
				
				items.stop(true, false);
				items
					.animate({"left" : "+=" + shift.x + "px"}, { queue : false, easing : "easeOutCubic", duration : options.timeToRest })
					.animate({"top" : "+=" + shift.y + "px"}, { queue : false, easing : "easeOutCubic", duration : options.timeToRest })
				that.$elem.stop(true, false);
				that.$elem
					.animate({"background-position-x" : "+=" + shift.x + "px"}, { queue : false, easing : "easeOutCubic", duration : options.timeToRest })
					.animate({"background-position-y" : "+=" + shift.y + "px"}, { queue : false, easing : "easeOutCubic", duration : options.timeToRest })
		    }

			that._isDragging = false;		    
		});	

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




