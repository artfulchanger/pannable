$(document).ready(function() {

//	$("div.pannable").pannable();

	$("div.pannable.events").pannable({
		onPanningStarted: function() { console.log("start"); }, 
		onPanningFinished: function() { console.log("finish"); }
	});	

	$("div.pannable.nobackground").pannable({
		background: false
	});	

	$("div.pannable.selector").pannable({
		selector: "div:contains('El2')",
		timeToRest:  400
	});	

	$("div.pannable.axis").pannable({
		axis: "x"
	});	
	
	$("div.pannable.inside").pannable({
		limit: "inside"
	});	

	$("div.pannable.covering").pannable({
		limit: "covering"
	});	
	
	$("div.pannable").html("<div class='additional-elements'>El1</div> <div class='additional-elements'>El2</div> <div class='additional-elements'>El3</div>");

});
