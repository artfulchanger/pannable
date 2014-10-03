$(document).ready(function() {

//	$("div.pannable").pannable();

	$("div.pannable.events").pannable({
		onPanningStarted: function() { console.log("start"); }, 
		onPanningFinished: function() { console.log("finish"); },
		elastic: true
	});	

	$("div.pannable.nobackground").pannable({
		background: false
	});	

	$("div.pannable.selector").pannable({
		selector: "div:contains('El2')"
	});	

	$("div.pannable.axis").pannable({
		axis: "x"
	});	
	
	$("div.pannable.inside").pannable({
		limit: "inside",
		timeToRest:  400,
		layers: {first : 1, second: 1.2, third: 1.4 }
	});	

	$("div.pannable.covering").pannable({
		limit: "covering"
	});	
	
	$("div.pannable").html("<div class='additional-elements' data-layer='first'>El1</div> <div class='additional-elements' data-layer='second'>El2</div> <div class='additional-elements' data-layer='third'>El3</div>");

});
