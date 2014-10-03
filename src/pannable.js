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

	//
	_totalShift : {x: 0, y: 0},

	_constrainShift: function(shift) {
		var options = this.options;

		// Apply bounds, if any
		if (options.axis == "x")
			shift.y = 0;
		if (options.axis == "y")
			shift.x = 0;

		if (options.background && this.$elem.data("backgroundImage")) {
			bg = { x: parseInt(this.$elem.css("background-position-x")), y: parseInt(this.$elem.css("background-position-y")) };

			
			var x0 = parseInt(this.$elem.css("background-position-x"));
			var y0 = parseInt(this.$elem.css("background-position-y"));
			var x = x0 + shift.x;
			var y = y0 + shift.y;
			// Determine the size of pannable component
			var elementSize = { width: this.$elem.width(), height: this.$elem.height()};

			switch (options.limit) {
				case "inside":
					if (x < 0)
						shift.x = -x0;
					if (y < 0)
						shift.y = -y0;
					if (x + this.$elem.data("backgroundImage").width > elementSize.width)
						shift.x = -x0 + elementSize.width - this.$elem.data("backgroundImage").width;
					if (y + this.$elem.data("backgroundImage").height > elementSize.height)
						shift.y = -y0 + elementSize.height - this.$elem.data("backgroundImage").height;
					break;
				case "covering":
					// Image must always cover the background
					if (x > 0)
						shift.x = -x0;
					if (y > 0)
						shift.y = -y0;
					if (x + this.$elem.data("backgroundImage").width < elementSize.width)
						shift.x = -x0 + elementSize.width - this.$elem.data("backgroundImage").width;
					if (y + this.$elem.data("backgroundImage").height < elementSize.height)
						shift.y = -y0 + elementSize.height - this.$elem.data("backgroundImage").height;
					break;
				default:
					// Do nothing
					break;
			}
		}
	},

	_moveTo: function(shift) {

		this.$elem.stop(true, false);		
		this.$elem.css("background-position-x", "+=" + shift.x + "px");
		this.$elem.css("background-position-y", "+=" + shift.y + "px");

		var that = this;
		var items = this.$elem.find(this.options.selector);
		items.stop(true, false);
		items.each(function() {
			var layer = $(this).attr("data-layer");
			var scale = 1;
			if (layer)
				scale = that.options.layers[layer] || 1;
			$(this).css("left", "+=" + shift.x * scale + "px");
			$(this).css("top", "+=" + shift.y * scale + "px");		
		});
	},

	_animateTo: function(shift, easing, duration) {
		easing = easing || "easeOutCubic";
		duration = duration || 1000;

		var items = this.$elem.find(this.options.selector);
		var that = this;
		items.stop(true, false);
		items.each(function() {
			var layer = $(this).attr("data-layer");
			var scale = 1;
			if (layer)
				scale = that.options.layers[layer] || 1;
			$(this)
				.animate({"left" : "+=" +  shift.x * scale + "px"}, { queue : false, easing : "easeOutCubic", duration : duration })
				.animate({"top" : "+=" + shift.y * scale + "px"}, { queue : false, easing : "easeOutCubic", duration : duration });
		});
		this.$elem.stop(true, false);
		this.$elem
			.animate({"background-position-x" : "+=" + shift.x + "px"}, { queue : false, easing : "easeOutCubic", duration : duration })
			.animate({"background-position-y" : "+=" + shift.y + "px"}, { queue : false, easing : "easeOutCubic", duration : duration,
				progress: function(a, p, c) {
				}
			})
	},

	_centerOn: function(position) {
		var shift = {
			x : -position.x + this.$elem.offset().left + this.$elem.width() / 2,
			y : -position.y + this.$elem.offset().top + this.$elem.height() / 2
		};
		this._animateTo(shift, "linear", 1000);
	},

	_setupDragging: function() {
		var options = this.options;

		var that = this;

		// We're initializing, no dragging is possible yet
		this._isDragging = false;

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
				
				that._constrainShift(shift);

				that._moveTo(shift);

		    	// Compute sliding velocity
		    	var elapsedTime = performance.now() - that._time;
		    	var distance = {x: (position.x - that._oldPosition.x), y: position.y - that._oldPosition.y}
		    	that._slidingVelocity = {x: distance.x / elapsedTime, y: distance.y / elapsedTime};

				// Update position
				that._oldPosition = position;

				// Update time
				that._time = performance.now();

				// Update total shift
				that._totalShift = {x: that._totalShift.x + shift.x, y: that._totalShift.y + shift.y };
			});

		});		

		// On mouse down
		this.$elem.on('dblclick', function(event) {
			event.preventDefault();

			var position = { x: event.pageX, y: event.pageY };

			// Update total shift
			that._centerOn(position);

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

				var shift = {x: that._slidingVelocity.x * options.timeToRest / 2, y : that._slidingVelocity.y * options.timeToRest  / 2};

				that._constrainShift(shift);

				that._animateTo(shift, "easeOutCubic", that.options.timeToRest);
		    } else if (that.options.elastic) {

		    	var shift = {x: -that._totalShift.x, y: -that._totalShift.y };

				that._constrainShift(shift);

				that._animateTo(shift, "easeOutElastic", 500);

				that._totalShift = {x: 0, y: 0};
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

	console.log("ciao");
	
	element.data("backgroundImage", {width: imageSize.width, height: imageSize.height });
}


function _loadBackgroundImage(element) {
	var imageUrl = element.css('background-image').replace(/url\(|\)$/ig, '');
alert(imageUrl);
	console.log(imageUrl);
	if (imageUrl) {
		var backgroundImage = new Image();
		backgroundImage.onload = function() {
			var imageSize = { width: this.width, height: this.height, };
			callback(element, imageSize);
		};
		// handle failure
		backgroundImage.onerror = function(event){
			console.log(event);
		};		

		backgroundImage.src = imageUrl;
		console.log(backgroundImage.width);
	}
}




