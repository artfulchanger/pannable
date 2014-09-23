$(document).ready(function() {

//	$("div.pannable").pannable();

	$("div.pannable.events").pannable("init", {
		onPanningStarted: function() { console.log("start"); }, 
		onPanningFinished: function() { console.log("finish"); }
	});	

	$("div.pannable.nobackground").pannable("init", {
		background: false
	});	

	$("div.pannable.selector").pannable("init", {
		selector: "div:contains('El2')"
	});	

	$("div.pannable.axis").pannable("init", {
		axis: "x"
	});	
	
	$("div.pannable.inside").pannable("init", {
		limit: "inside"
	});	

	$("div.pannable.covering").pannable("init", {
		limit: "covering"
	});	
	
	$("div.pannable").html("<div class='additional-elements'>El1</div> <div class='additional-elements'>El2</div> <div class='additional-elements'>El3</div>");

});
