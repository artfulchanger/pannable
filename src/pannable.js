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

		// Build the DOM's initial structure
		this._build();

		if (this.options.background)
			_loadBackgroundImage(this.$elem);

		this._setupDragging(this.$elem, this.options);

		// return this so that we can chain and use the bridge with less code.
		return this;
	},

	options: {
		name: "No name"
	},

	_build: function(){
		//this.$elem.html('<h1>'+this.options.name+'</h1>');
	},

	myMethod: function( msg ){
		// You have direct access to the associated and cached
		// jQuery element
		// this.$elem.append('<p>'+msg+'</p>');
	},

	_isDragging : false,
	_time : 0,
	_slidingVelocity : {x: 0, y: 0},
	_oldPosition : {x: 0, y: 0},

	options : {
	    background: true,
	    selector:  "*",
	    axis:       "",
	    friction:    Infinity,
	    limit:      "",
	    onPanningStarted : function() {},
	    onPanningFinished : function() {}
	},

	_setupDragging: function(element, options) {
		// We're initializing, no dragging is possible yet
		_isDragging = false;

		// On mouse down
		element.on('mousedown touchstart', function(event) {
			event.preventDefault();

			_oldPosition = { x: event.pageX, y: event.pageY };

			// Fire event
		    options.onPanningStarted.call(this);

			// Listen to mouse motion      
			$(window).mousemove(function(event) {
				_isDragging = true;

				position = { x: event.pageX, y: event.pageY };

				shift = { x: position.x - _oldPosition.x, y: position.y - _oldPosition.y };
				
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
				this._time = performance.now() ;

				// Update position
				_oldPosition = position;
			});

		});		

		// On mouse up
		element.on('mouseup touchend', function(e) {
			_isDragging = false;
			$(window).unbind("mousemove");

			position = { x: event.pageX, y: event.pageY };

			// Fire event
		    options.onPanningFinished.call(this);

		    // Apply inertia
		    if (options.friction == Infinity) {
		    } else if ($.isNumeric(options.friction) && options.friction > 0) {
		    	var elapsedTime = performance.now() - this._time;

		    	var distance = {x: (position.x - _oldPosition.x), y: position.y - _oldPosition.y}

		    	// Compute and clip sliding velocity
		    	this._slidingVelocity = {x: distance.x / elapsedTime, y: distance.y / elapsedTime};

		    	var max = 1;
		    	var n = norm(this._slidingVelocity);
		    	if (n > max)
		    		this._slidingVelocity = scale(this._slidingVelocity, 1 / n);

				// Update time
				this._time = performance.now();

				// Start the animation.
				requestAnimationFrame(_slide);		    	
		    } else {

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
				value -= options.friction * elapsedTime;
				if (value < 0) value = 0;
			} else if (value < 0) {
				value += options.friction * elapsedTime;
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

			var elapsedTime = highResTimestamp - this._time;
		
			this._slidingVelocity = damp(this._slidingVelocity, elapsedTime);

//			this._slidingVelocity = scale(this._slidingVelocity, (1 - 1/0.1 * elapsedTime / 1000));

			//console.log("elapsedTime: " + elapsedTime + ", this._slidingVelocity.y: " + this._slidingVelocity.y);

			var shift = {x: (this._slidingVelocity.x * elapsedTime), y: (this._slidingVelocity.y * elapsedTime)};

			if (options.background && element.data("backgroundImage")) {
				element.css("background-position-x", "+=" + shift.x + "px");
				element.css("background-position-y", "+=" + shift.y + "px");
			}

			var items = element.find(options.selector);
			items.css("left", "+=" + shift.x + "px");
			items.css("top", "+=" + shift.y + "px");

			// Update timestamp
			this._time = highResTimestamp;

			if (norm(this._slidingVelocity) < 0.1)
				cancelAnimationFrame(id);
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




