// SETUP
(function () {

  var parent = document.getElementById("map-container")

  var dataTime = d3.range(0, 3).map(function (d) {
    return {
      letter: new Date(1995, 10, 3+d),
      frequency: 10

    };
  });

  var svg = d3.select("#graph-cases")
    .append("svg")
    .attr('width', 500)
    .attr('height', 100)
  margin = { top: 30, right: 0, bottom: 30, left: 40 }
  x = d3.scaleTime(),
    y = d3.scaleLinear(),
    theData = undefined;

  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  g.append("g")
    .attr("class", "axis axis--x");

  g.append("g")
    .attr("class", "axis axis--y");


  function tickWidth(selection) {
    const ticks = selection.selectAll(".tick text")
      .nodes()
      .map(function (d) {
        return +d.textContent;
      });
    return x(ticks[1]) - x(ticks[0]);
  }

  // DRAWING

  function draw() {

    var bounds = svg.node().getBoundingClientRect(),
      width = parent.offsetWidth - margin.left - margin.right,
      height = bounds.height - margin.top - margin.bottom;

    x.range([0, width]);
    y.range([height, 0]);

    var axisGroup = g.select(".axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));
    console.log(tickWidth(axisGroup))
    g.select(".axis--y")
      .call(d3.axisLeft(y).ticks(1));

    var bars = g.selectAll(".bar")
      .data(theData);

    // ENTER
    bars
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x(d.letter); })
      .attr("y", function (d) { return y(d.frequency); })
      .attr("width", 4)
      .attr("height", function (d) { return height - y(d.frequency); });


    // UPDATE
    bars.attr("x", function (d) { return x(d.letter); })
      .attr("y", function (d) { return y(d.frequency); })
      .attr("width", 4)
      .attr("height", function (d) { return height - y(d.frequency); });

    // EXIT
    bars.exit()
      .remove();

  }

  // LOADING DATA

  function loadData(tsvFile) {

    theData = dataTime;

    x.domain(d3.extent(theData, function (d) { return d.letter; }));
    y.domain([0, d3.max(theData, function (d) { console.log(d.frequency); return d.frequency; })]);

    draw();
  }

  // START!

  window.addEventListener("resize", draw);
  loadData("../data/data.tsv");
})();









// SETUP
(function () {
  var svg = d3.select("#graph-deaths"),
    margin = { top: 0, right: 0, bottom: 30, left: 40 },
    x = d3.scaleBand().padding(0.1),
    y = d3.scaleLinear(),
    theData = undefined;

  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  g.append("g")
    .attr("class", "axis axis--x");

  g.append("g")
    .attr("class", "axis axis--y");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Frequency");

  // DRAWING

  function draw() {

    var bounds = svg.node().getBoundingClientRect(),
      width = bounds.width - margin.left - margin.right,
      height = bounds.height - margin.top - margin.bottom;

    x.rangeRound([0, width]);
    y.rangeRound([height, 0]);

    g.select(".axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    g.select(".axis--y")
      .call(d3.axisLeft(y).ticks(10, "%"));

    var bars = g.selectAll(".bar")
      .data(theData);

    // ENTER
    bars
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x(d.letter); })
      .attr("y", function (d) { return y(d.frequency); })
      .attr("width", x.bandwidth())
      .attr("height", function (d) { return height - y(d.frequency); });

    // UPDATE
    bars.attr("x", function (d) { return x(d.letter); })
      .attr("y", function (d) { return y(d.frequency); })
      .attr("width", x.bandwidth())
      .attr("height", function (d) { return height - y(d.frequency); });

    // EXIT
    bars.exit()
      .remove();

  }

  // LOADING DATA

  function loadData(tsvFile) {

    d3.tsv(tsvFile, function (d) {
      d.frequency = +d.frequency;
      return d;

    }, function (error, data) {
      if (error) throw error;

      theData = data;

      x.domain(theData.map(function (d) { return d.letter; }));
      y.domain([0, d3.max(theData, function (d) { return d.frequency; })]);

      draw();

    });
  }

  // START!

  window.addEventListener("resize", draw);
  loadData("../data/data.tsv");
})();