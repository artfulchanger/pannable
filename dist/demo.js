$(document).ready(function() {

	//$("div.pannable").pannable();

	$("div.pannable.evednts").pannable("init", {
		onPanningStarted: function() {console.log("start"); }, 
		onPanningFinished: function() {console.log("finish"); }
	});

});
