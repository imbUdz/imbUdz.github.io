function select_cluster() {
	var mylist = document.getElementById("myList");
	cluster = mylist.options[mylist.selectedIndex].text;

    document.getElementById("container").innerHTML = "";
    document.getElementById("shows-chart").innerHTML = "";
    reset_bar_title("shows-chart", "Shows");
    document.getElementById("kiddie-chart").innerHTML = "";
    reset_bar_title("kiddie-chart", "Kiddie");
    document.getElementById("everyone-chart").innerHTML = "";
    reset_bar_title("everyone-chart", "Everyone");
    document.getElementById("thrill-chart").innerHTML = "";
    reset_bar_title("thrill-chart", "Thrill");
    document.getElementById("checkin-chart").innerHTML = "";
    reset_bar_title("checkin-chart", "Check-in");
    document.getElementById("duration-chart").innerHTML = "";
    reset_bar_title("duration-chart", "Durations");

    if (cluster == "All") {
    	crossfilterize_sunburst(all_data);
    } else {
		record = crossfilter(all_data);
		vis_group = record.dimension(function(d) { return d.group; });
		vis_group.filter(cluster);
		crossfilterize_sunburst(vis_group.filter(cluster).top(Infinity));  	
    }
}

// Work around for missing his title when choosing different title
function reset_bar_title(bar_name, title) {
    idiv = document.createElement('div');
    idiv.className = "hist_title";
    idiv.innerText = title;
    document.getElementById(bar_name).appendChild(idiv);    
}