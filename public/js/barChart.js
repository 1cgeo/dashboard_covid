
function createBarChart(options) {
  var obj = new BarChart()
  obj.initialize(options)
  return obj
}

function BarChart() {

  this.options = {}

  this.currentData = undefined
  this.months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  this.shortMonthsLabel = ["Jan.", "Fev.", "Mar.", "Abr.", "Maio", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."]

  this.initialize = function (options) {
    this.setOptions(options)
    this.currentData = this.options.data
    d3.timeFormatDefaultLocale({
      "decimal": ".",
      "thousands": ",",
      "grouping": [3],
      "currency": ["$", ""],
      "dateTime": "%a %b %e %X %Y",
      "date": "%m/%d/%Y",
      "time": "%H:%M:%S",
      "periods": ["AM", "PM"],
      "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      "months": this.months,
      "shortMonths": this.shortMonthsLabel
    })
    this.x = d3.scaleBand().padding(0.1)
    this.y = d3.scaleLinear()
    this.parent = document.getElementById(this.options.elementId)
    this.svg = d3.select(`#${this.options.elementId}`)
      .append('svg')
      .attr('width', this.parent.offsetWidth)
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.getMargin().left + "," + this.getMargin().top + ")")
    this.g.append("g")
      .attr("class", "axis axis--x");
    this.g.append("g")
      .attr("class", "axis axis--y")
    this.createTooltip()
    this.createLineChart()
    this.createAreaChart()
    window.addEventListener("resize", () => {
      this.draw()
    })
    this.loadData()
    this.draw()
  }

  this.setOptions = function (options) {
    for (var key in options) {
      this.options[key] = options[key]
    }
  }

  this.loadData = function () {
    var $this = this
    this.x.domain(this.currentData.map(function (d) { return d[$this.options.attributeX]; }));
    this.y.domain([0, d3.max(this.currentData, function (d) { return d[$this.options.attributeY]; })])
  }

  this.getMargin = function () {
    return { top: 10, right: 0, bottom: 20, left: 20 }
  }

  this.createTooltip = function () {
    var $this = this
    this.tooltip = d3.select("body").append("div").attr("class", "toolTip")
    this.tootipMouseover = function (d) { }
    this.tooltipMousemove = function (d) {
      $this.tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 110 + "px")
        .style("display", "inline-block")
        .html(`
        <b>${new Date(d[$this.options.attributeX]).getDate()} ${$this.months[new Date(d[$this.options.attributeX]).getMonth()]}</b>
        <br>
        ${d[$this.options.attributeY]} casos`)
    }
    this.tooltipMouseleave = function (d) { $this.tooltip.style("display", "none") }
  }

  this.createLineChart = function () {
    var $this = this
    this.line = d3.line()
      .x(function (d) { return $this.x(d[$this.options.attributeX]) + $this.x.bandwidth() / 2 })
      .y(function (d) { return $this.y(d[$this.options.attributeY]) })
      .curve(d3.curveMonotoneX)
  }

  this.createAreaChart = function () {
    var $this = this
    this.area = d3.area()
      .x(function (d) { return $this.x(d[$this.options.attributeX]) + $this.x.bandwidth() / 2; })
      .y1(function (d) { return $this.y(d[$this.options.attributeY]); })
      .curve(d3.curveMonotoneX)
  }

  this.draw = function (newData) {
    if (newData) {
      this.currentData = newData
      this.loadData()
    }
    this.svg.attr('width', this.parent.offsetWidth)
    var bounds = this.svg.node().getBoundingClientRect(),
      width = bounds.width - this.getMargin().left - this.getMargin().right,
      height = bounds.height - this.getMargin().top - this.getMargin().bottom;

    this.x.rangeRound([0, width]);
    this.y.rangeRound([height, 0]);

    this.g.select(".axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(this.x).tickFormat(d3.timeFormat('%b')))

    var xTicks = this.g.select(".axis--x").selectAll(".tick text").nodes()
    var xTickNames = xTicks.map((n) => n.textContent)
    xTicks.forEach((n, idx) => {
      if (xTickNames.indexOf(n.textContent) !== idx) n.textContent = ''
    })
    this.g.select(".axis--x").selectAll(".tick").nodes().forEach((n) => {
      if (!n.children[1].textContent) n.remove()
    })

    this.g.select(".axis--y")
      .call(d3.axisLeft(this.y).ticks(1).tickSize(0))
    this.g.select(".axis--y").select('.domain').remove()

    this.area.y0(height)
    if (this.g.select(".area").size() < 1) {
      this.g.append("path")
        .data([this.currentData])
        .attr("class", "area")
        .attr("d", this.area)
    } else {
      this.g.select(".area")
        .data([this.currentData])
        .attr("d", this.area)
    }

    var bars = this.g.selectAll(".bar").data(this.currentData)
    var $this = this
    bars
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return $this.x(d[$this.options.attributeX]); })
      .attr("y", function (d) { return $this.y(d[$this.options.attributeY]); })
      .attr("width", this.x.bandwidth())
      .attr("height", function (d) { return height - $this.y(d[$this.options.attributeY]); })

    this.g.selectAll(".bar")
      .on("mouseover", $this.tootipMouseover)
      .on("mousemove", $this.tooltipMousemove)
      .on("mouseleave", $this.tooltipMouseleave)

    bars.attr("x", function (d) { return $this.x(d[$this.options.attributeX]); })
      .attr("y", function (d) { return $this.y(d[$this.options.attributeY]); })
      .attr("width", this.x.bandwidth())
      .attr("height", function (d) { return height - $this.y(d[$this.options.attributeY]); })

    bars.exit().remove()

    this.g.select(".line-chart").remove()
    this.g.append("path")
      .attr("class", "line-chart")
      .attr("d", this.line(this.currentData))

  }

}