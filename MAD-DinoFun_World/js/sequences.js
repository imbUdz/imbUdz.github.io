// Dimensions of sunburst.
var sb_width = document.getElementById('sunburst_container').offsetWidth - 200;
var sb_height = 600;
var sb_radius = Math.min(sb_width, sb_height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 75,
  h: 30,
  s: 3,
  t: 10
};

// Mapping of step names to colors.
var sb_colors = {
  "Thrill": "#de783b", // orange
  "Shows": "#6ab975", // green
  "Everyone": "#5687d1", // blue
  "Kiddie": "#7b615c", // brown
};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

var vis = d3.select("#sb_chart").append("svg:svg")
  .attr("width", sb_width)
  .attr("height", sb_height)
  .append("svg:g")
  .attr("id", "container")
  .attr("transform", "translate(" + sb_width / 2 + "," + sb_height / 2 + ")");

var partition = d3.layout.partition()
  .size([2 * Math.PI, sb_radius * sb_radius])
  .value(function(d) {
    return d.size;
  });

var arc = d3.svg.arc()
  .startAngle(function(d) {
    return d.x;
  })
  .endAngle(function(d) {
    return d.x + d.dx;
  })
  .innerRadius(function(d) {
    return Math.sqrt(d.y);
  })
  .outerRadius(function(d) {
    return Math.sqrt(d.y + d.dy);
  });

var all_seq = [];

// Combine the sequence data
function get_seq_data(records) {
  var filter = crossfilter(records),
    FRI_ride_seq = filter.dimension(function(d) {
      return d.FRI_ride_seq;
    }),
    SAT_ride_seq = filter.dimension(function(d) {
      return d.SAT_ride_seq;
    }),
    SUN_ride_seq = filter.dimension(function(d) {
      return d.SUN_ride_seq;
    });

  //return unique_datas.top(Infinity);
  var three_days_seq = [];
  var length = 0;

  FRI_seq = FRI_ride_seq.filterFunction(function(d) {
    return (d != "");
  }).top(Infinity);
  for (i = 0; i < FRI_seq.length; i++) {
    three_days_seq[i] = [FRI_seq[i].ID, FRI_seq[i].FRI_ride_seq, FRI_seq[i].FRI_loc_seq, "FRI"];
  }
  FRI_ride_seq.filterAll();

  length = FRI_seq.length;
  SAT_seq = SAT_ride_seq.filterFunction(function(d) {
    return (d != "");
  }).top(Infinity);
  for (i = 0; i < SAT_seq.length; i++) {
    three_days_seq[i + length] = [SAT_seq[i].ID, SAT_seq[i].SAT_ride_seq, SAT_seq[i].SAT_loc_seq, "SAT"];
  }
  SAT_ride_seq.filterAll();

  length = length + SAT_seq.length;
  SUN_seq = SUN_ride_seq.filterFunction(function(d) {
    return (d != "");
  }).top(Infinity);
  for (i = 0; i < SUN_seq.length; i++) {
    three_days_seq[i + length] = [SUN_seq[i].ID, SUN_seq[i].SUN_ride_seq, SUN_seq[i].SUN_loc_seq, "SUN"];
  }
  SUN_ride_seq.filterAll();

  all_seq = three_days_seq;

  var filter2 = crossfilter(three_days_seq),
    ride_seq = filter2.dimension(function(d) {
      return d[1];
    }),
    ride_seqs = ride_seq.group();

  return ride_seqs.top(Infinity);
}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();
  d3.select("#togglelegend").on("click", toggleLegend);

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
    .attr("r", sb_radius)
    .style("opacity", 0);

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition.nodes(json)
    .filter(function(d) {
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
    });

  var path = vis.data([json]).selectAll("#sunburst_chart path")
    .data(nodes)
    .enter().append("svg:path")
    .attr("display", function(d) {
      return d.depth ? null : "none";
    })
    .attr("d", arc)
    .attr("fill-rule", "evenodd")
    .style("fill", function(d) {
      return sb_colors[d.name];
    })
    .style("opacity", 1)
    .on("mouseover", mouseover)
    .on("click", mouseclick);

  // Add the mouseleave handler to the bounding circle.
  d3.select("#sunburst_chart").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  //totalSize = path.node().__data__.value;
};

function get_loc_data(filter_str) {

  var all_seq_filter = crossfilter(all_seq),
    all_seq_filters = all_seq_filter.dimension(function(d) {
      return d[1];
    });

  selected_seq = all_seq_filters.filterFunction(function(d) {
    return (d.indexOf(filter_str) === 0)
  });

  sorted_seq = selected_seq.top(Infinity).sort(function(a, b) {
    return a[0] - b[0];
  });

  return sorted_seq;
}

function mouseclick(d) {
  //document.getElementById("#loctable").innerHTML = "";
  // Clear the sequence information
  $("#loc_seq").text(""); 
  var sequenceArray = getAncestors(d);
  str = get_selected_ride_seq(sequenceArray);

  drawLocTable(get_loc_data(str));
}

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

  //var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = d.value;

  d3.select("#percentage")
    .text(percentageString);

  d3.select("#explanation")
    .style("visibility", "");

  var sequenceArray = getAncestors(d);
  updateBreadcrumbs(sequenceArray, percentageString);
  // Fade all the segments.
  d3.selectAll("#sunburst_chart path")
    .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("#sunburst_chart path")
    .filter(function(node) {
      return (sequenceArray.indexOf(node) >= 0);
    })
    .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
    .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("#sunburst_chart path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("#sunburst_chart path")
    .transition()
    .duration(1000)
    .style("opacity", 1)
    .each("end", function() {
      d3.select(this).on("mouseover", mouseover);
    });

  d3.select("#explanation")
    .style("visibility", "hidden");
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
    .attr("width", sb_width)
    .attr("height", 100)
    .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

function get_selected_ride_seq(nodeArray) {
  var tmp_ride_seq = "";
  for (i = 0; i < nodeArray.length; i++) {
    tmp_ride_seq = tmp_ride_seq + nodeArray[i].name;
    if (i < nodeArray.length - 1) {
      tmp_ride_seq = tmp_ride_seq + "-";
    }
  }
  return tmp_ride_seq;
}
// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
    .selectAll("g")
    .data(nodeArray, function(d) {
      return d.name + d.depth;
    });

  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
    .attr("points", breadcrumbPoints)
    .style("fill", function(d) {
      return sb_colors[d.name];
    });

  entering.append("svg:text")
    .attr("x", (b.w + b.t) / 2)
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d.name;
    });

  // Set position for entering and updating nodes.

  // ZOE: modify here to add additional rows to accomodate whole sequence
  tail_x = nodeArray.length;
  tail_y = b.h / 2;
  g.attr("transform", function(d, i) {
    if (i <= 8) {
      tail_x = nodeArray.length;
      tail_y = b.h / 2;
      return "translate(" + i * (b.w + b.s) + ", 0)";
    } else if (i <= 17) {
      tail_x = nodeArray.length - 9;
      tail_y = b.h / 2 + 35;
      return "translate(" + (i - 9) * (b.w + b.s) + ", 35)";
    } else if (i <= 26) {
      tail_x = nodeArray.length - 18;
      tail_y = b.h / 2 + 70;
      return "translate(" + (i - 18) * (b.w + b.s) + ", 70)";
    } else if (i <= 35) {
      tail_x = nodeArray.length - 27;
      tail_y = b.h / 2 + 105;
      return "translate(" + (i - 27) * (b.w + b.s) + ", 105)";
    }
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
    .attr("x", (tail_x + 0.5) * (b.w + b.s))
    .attr("y", tail_y) //b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
    .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 75,
    h: 30,
    s: 3,
    r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
    .attr("width", li.w)
    .attr("height", d3.keys(sb_colors).length * (li.h + li.s));

  var g = legend.selectAll("#sunburst_table_container g")
    .data(d3.entries(sb_colors))
    .enter().append("svg:g")
    .attr("transform", function(d, i) {
      return "translate(0," + i * (li.h + li.s) + ")";
    });

  g.append("svg:rect")
    .attr("rx", li.r)
    .attr("ry", li.r)
    .attr("width", li.w)
    .attr("height", li.h)
    .style("fill", function(d) {
      return d.value;
    });

  g.append("svg:text")
    .attr("x", li.w / 2)
    .attr("y", li.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d.key;
    });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv) {
  var root = {
    "name": "root",
    "children": []
  };
  for (var i = 1; i < csv.length; i++) {
    var sequence = csv[i].key;
    var size = +csv[i].value; // size: the number of the same sequence
    var parts = sequence.split("-");
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      if (!currentNode["children"]) {
        continue;
      }
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree.
        var foundChild = false;
        for (var k = 0; k < children.length; k++) {
          if (children[k]["name"] == nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If we don't already have a child node for this branch, create it.
        if (!foundChild) {
          childNode = {
            "name": nodeName,
            "children": []
          };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = {
          "name": nodeName,
          "size": size
        };
        children.push(childNode);
      }
    }
  }
  return root;
};