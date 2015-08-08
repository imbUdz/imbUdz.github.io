function crossfilterize_sunburst(records) {
  // Create the crossfilter for the relevant dimensions and grou.showsps.
  var themepark = crossfilter(records),
    show = themepark.dimension(function(d) {
      return Math.min(1999, d.Shows);
    }),
    shows = show.group(),
    thrill = themepark.dimension(function(d) {
      return Math.min(1999, d.Thrill);
    }),
    thrills = thrill.group(),
    kiddie = themepark.dimension(function(d) {
      return Math.min(1999, d.Kiddie);
    }),
    kiddies = kiddie.group(),
    everyone = themepark.dimension(function(d) {
      return Math.min(1999, d.Everyone);
    }),
    everyones = everyone.group(),
    checkin = themepark.dimension(function(d) {
      return Math.min(1999, d.Checkin);
    }),
    checkins = checkin.group(),
    duration = themepark.dimension(function(d) {
      return Math.min(1999, d.Duration);
    }),
    durations = duration.group(),
    json = buildHierarchy(get_seq_data(records));

  // Sunburst
  document.getElementById("container").innerHTML = "";
  createVisualization(json);

  var charts = [
    barChart()
    .dimension(show)
    .group(shows)
    .x(d3.scale.linear()
      .domain([0, 14])
      .rangeRound([0, 130])),

    barChart()
    .dimension(kiddie)
    .group(kiddies)
    .x(d3.scale.linear()
      .domain([0, 24])
      .rangeRound([0, 220])),

    barChart()
    .dimension(everyone)
    .group(everyones)
    .x(d3.scale.linear()
      .domain([0, 33])
      .rangeRound([0, 300])),

    barChart()
    .dimension(thrill)
    .group(thrills)
    .x(d3.scale.linear()
      .domain([0, 81])
      .rangeRound([0, 750])),

    barChart()
    .dimension(checkin)
    .group(checkins)
    .x(d3.scale.linear()
      .domain([0, 112])
      .rangeRound([0, 900])),

    barChart()
    .dimension(duration)
    .group(durations)
    .x(d3.scale.linear()
      .domain([0, 41])
      .rangeRound([0, 550]))
  ];

  var chart = d3.selectAll(".hist_chart")
    .data(charts)
    .each(function(chart) {
      chart.on("brush", renderAll).on("brushend", renderAll);
    });


  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) {
      charts[i].filter(d);
    });
    renderAll();
  };

  window.reset = function(i) {
    for(var j = 0; j < 6; j++) {
      charts[j].filter(null);
    }
    renderAll();
    document.getElementById("container").innerHTML = "";
    createVisualization(json);
  };

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {
        top: 10,
        right: 10,
        bottom: 20,
        left: 10
      },
      x,
      y = d3.scale.linear().range([100, 0]),
      id = barChart.id++,
      axis = d3.svg.axis().orient("bottom"),
      brush = d3.svg.brush(),
      brushDirty,
      dimension,
      group,
      round;

    function chart(div) {
      var width = x.range()[1],
        height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
          g = div.select("#hist_container g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".hist_title").append("a")
            .attr("href", "javascript:reset(" + id + ")")
            .attr("class", "reset")
            .text("reset")
            .style("display", "none");

          g = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
            .attr("id", "clip-" + id)
            .append("rect")
            .attr("width", width)
            .attr("height", height);

          g.selectAll(".bar")
            .data(["background", "foreground"])
            .enter().append("path")
            .attr("class", function(d) {
              return d + " bar";
            })
            .datum(group.all());

          g.selectAll("#hist_container .foreground.bar")
            .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
            .attr("class", "hist_axis")
            .attr("transform", "translate(0," + height + ")")
            .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "hist_brush").call(brush);
          gBrush.selectAll("#hist_container rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".hist_brush").call(brush);
          div.select(".hist_title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
              .attr("x", 0)
              .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
              .attr("x", x(extent[0]))
              .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
          i = -1,
          n = groups.length,
          d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }

        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
          x = e ? 1 : -1,
          y = height / 3;
        return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      console.log("brushstart.chart");
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".hist_title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
        extent = brush.extent();
      if (round) g.select(".hist_brush")
        .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
        .style("display", null);
      g.select("#clip-" + id + " rect")
        .attr("x", x(extent[0]))
        .attr("width", x(extent[1]) - x(extent[0]));

      brushed_data = dimension.filterRange(extent);

      document.getElementById("container").innerHTML = "";
      var filter_json = buildHierarchy(get_seq_data(brushed_data.top(Infinity)));
      createVisualization(filter_json);
    });

    brush.on("brushend.chart", function() {
      console.log("brushend.chart");
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".hist_title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        brushed_data_2 = dimension.filterAll();
        //console.log(brushed_data_2);
        //console.log(brushed_data_2.top(Infinity));
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }

}