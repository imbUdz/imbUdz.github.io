// Global variable for dropdownlist.js
var cluster = "All";
var all_data;

$(document).ready(function() {
	d3.csv("data/Consolidated-Fri-Sat-Sun-Hierarchical-New v7-DataViz-Sunburst.csv", function(error, csv){
		all_data = csv;
	  	crossfilterize_sunburst(csv);
	});
});