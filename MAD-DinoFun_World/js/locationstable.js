var loc_seq_id;
var ESAMap = [];
var maxCount = 0, minCount = 99999;
var currentx = 40, currenty = 10, count = 0, previousx = 0, previousy = 0, maxx = 0;
var svg = d3.select("#left").append("svg").attr("id", "svg");

var tooltipOptionESA = {
  'container': 'body',
  'placement': 'right',
  'html': 'true',
  'delay': { show: 0, hide: 0 }
};

var color_thrill = d3.scale.linear()
                  .domain([1, 9])
                  .range(["#ebae89", "#c76c35"]);

var color_everyone = d3.scale.linear()
                  .domain([10, 21])
                  .range(["#99b7e3", "#4d79bc"]);

var color_kiddie = d3.scale.linear()
                  .domain([22, 32])
                  .range(["#afa09d", "#6e5752"]);

var color_show = d3.scale.linear()
                  .domain([33, 35])
                  .range(["#a5d5ac", "#5fa669"]);

var color = function (d) {
  switch (d) {
    case "Wendisaurus Chase":
      return 1;
    case "Firefall":
      return 2;
    case "Galactosaurus Rage":
      return 3;
    case "Auvilotops Express":
      return 4;
    case "Atmosfear":
      return 5;
    case "Wrightiraptor Mountain":
      return 6;
    case "Flight of the Swingodon":
      return 7;
    case "TerrorSaur":
      return 8;
    case "Keimosaurus Big Spin":
      return 9;
    case "Thrill":
      return "#de783b";  //#f1c9b0

    case "Rhynasaurus Rampage":
      return 10;
    case "Jurassic Road":
      return 11;
    case "Eberlesaurus Roundup":
      return 12;
    case "Kristanodon Kaper":
      return 13;
    case "Paleocarrie Carousel":
      return 14;
    case "Kauf's Lost Canyon Escape":
      return 15;
    case "Raptor Race":
      return 16;
    case "Squidosaur":
      return 17;
    case "Scholtz Express":
      return 18;
    case "Ichthyoroberts Rapids":
      return 19;
    case "Dykesadactyl Thrill":
      return 20;
    case "Maiasaur Madness":
      return 21;
    case "Everyone":
      return "#5687d1"; //#ccdbf1

    case "Sauroma Bumpers":
      return 22;
    case "Flying TyrAndrienkos":
      return 23;
    case "Beelzebufo":
      return 24;
    case "Cyndisaurus Asteroid":
      return 25;
    case "Enchanted Toadstools":
      return 26;
    case "Jeredactyl Jump":
      return 27;
    case "Stegocycles":
      return 28;
    case "Blue Iguanodon":
      return 29;
    case "Wild Jungle Cruise":
      return 30;
    case "Stone Cups":
      return 31;
    case "North Line":
      return 32;
    case "Kiddie":
      return "#7b615c";  //#d7cfce

    case "Creighton Pavilion":
      return 33;
    case "Grinosaurus Stage":
      return 34;
    case "Sabretooth Theatre":
      return 35;
    case "Shows":
      return "#6ab975";  //#d2ead5
  }
}

function prepareData(data) {
  ESAMap = [];
  for (var i = 0; i < data.length; i++) {
    ESAMap[i] = [data[i][0], data[i][2], data[i][3]];
  }
}

function drawESA(ESAMap) {
  var old = d3.select("#svg").selectAll("g");
  old.remove();
  d3.select("#legend").selectAll("#svg").remove();
  d3.select("#exAxis").select("svg").remove();
  d3.select("#left").select("svg").selectAll("g").remove();

  currentx = 0, currenty = 10, count = 0, previousx = 0, previousy = 0;
  var space = 0, previousID = 0;

  for (var i = 0; i < ESAMap.length; i++) {
    if (ESAMap[i][0] !== previousID) {
      currenty += 4;
    } 
    drawNewESADisregardWidth(ESAMap[i][1], ESAMap[i][0], ESAMap[i][2]);
    previousID = ESAMap[i][0];
  }

  d3.selectAll('rect').each(function(d) {
    var rect = d3.select(this);
    var ride = rect.attr("ride");
    rect.attr("fill", function () { 
      if(parseInt(color(ride)) <= 9) {
        return color_thrill(color(ride));
      } else if(parseInt(color(ride)) <= 21){
        return color_everyone(color(ride));
      } else if(parseInt(color(ride)) <= 32){
        return color_kiddie(color(ride));
      } else if(parseInt(color(ride)) <= 35){
        return color_show(color(ride));
      }
    })  
  })
}

var drawNewESADisregardWidth = function (key, visitorID, day) {
  var rides = key.split("-");
  var top = d3.select("#svg");
  var vis = top.append("g");

  for (flowEvent = rides.length-1; flowEvent>=0; flowEvent--) {
    var maxWidth = 0;
    var currentWidth = (flowEvent + 1) * 15;
    if (flowEvent == rides.length-1) {
      maxWidth = currentWidth;
    }

    vis.append("rect")
      .attr("class", "bar")
      .attr("y", currenty)
      .attr("x", function (d, i) {
          return currentx;
      })
      .attr("width", currentWidth)
      .attr("maxWidth", maxWidth)
      .attr("height", 10) 
      .attr("count", rides[flowEvent])
      .attr("ride", rides[flowEvent])
      .attr("quantile", rides[flowEvent])
      .attr("stroke", "black")
      .attr("title", function() { 
        return "ID\t: " + visitorID + "\n" + "Day\t: " + day + "\n" + "Ride\t: " + rides[flowEvent]; 
      })
      .on("click", function(d) {
        $('#loc_seq').text(key);
      })

    //$(".bar").tooltip(tooltipOptionESA);

    previousy = 10 
    maxx = (currentWidth > maxx) ? currentWidth : maxx;
  }
  
  currenty += previousy;
  top.attr("height", currenty + 10) //resize of scroll bar
  top.attr("width", maxx + 50)
}

function drawAxis() {
  var xSvg = d3.select("#exAxis").append("svg")
    .attr("width", 340)
    .attr("height", 20);

  xSvg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 6 + 1) /*must be smarter way to calculate shift*/
    .attr("refY", 2)
    .attr("markerWidth", 6)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
        .attr("d", "M 0,0 V 4 L6,2 Z")
        .style("stroke", "#BFC7C8")
        .style("fill", "#BFC7C8");

  var xSvgGrp = xSvg.append("g")
    .attr("transform", "translate(20,10)");

  var ySvg = d3.select("#eyAxis").append("svg")
    .attr("height", 300);

  var ySvgGrp = ySvg.append("g")
    .attr("transform", "translate(20,0)");

  ySvgGrp.append("text")
    .attr("transform","rotate(-90)")
    .attr("x", -160)
    .attr("y", 0)
    .text("Decreasing Number of Patients")

  ySvgGrp.append("line")
    .attr("x1", 3)
    .attr("x2", 3)
    .attr("y1", 0)
    .attr("y2", 280)
    .attr("marker-end", "url(#arrowhead)")
    .style("stroke", "#BFC7C8")
    .style("stroke-width", 1.5);
}

function drawLocTable(records) {
  prepareData(records);
  drawESA(ESAMap);
  drawAxis();  
}