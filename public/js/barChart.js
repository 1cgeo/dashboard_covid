
class BarChart {
  constructor(newOptions) {
    this.options = {}
    this.setOptions(newOptions)
    this.currentData = undefined
    this.months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    this.shortMonthsLabel = ["Jan.", "Fev.", "Mar.", "Abr.", "Maio", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."]
    this.init()
  }

  init() {
    this.setLocale()
    this.createAxis()
    this.parent = document.getElementById(this.options.parentId)
    this.svg = this.loadSvg()
    this.g = this.loadGroup()
    //this.createTitle()
    this.createTooltip()
    this.createLineChart()
    this.createAreaChart()
    window.addEventListener("resize", () => {
      this.draw()
    })
    this.loadData()

  }

  loadSvg() {
    return d3.select(`#${this.options.elementId}`)
      //.append('svg')
      .attr('width', this.parent.offsetWidth - 100)
      .attr('height', 150)
    //.attr('height', 600)
  }

  loadGroup() {
    var g = this.svg.append("g")
      .attr("transform", "translate(" + this.getMargin().left + "," + this.getMargin().top + ")")
    g.append("g")
      .attr("class", "axis axis--x");
    g.append("g")
      .attr("class", "axis axis--y")
    return g
  }

  createTitle() {
    this.g.append('text').attr("class", "chartTitle").attr('y', 5).text(this.options.title)
  }

  createAxis() {
    this.x = d3.scaleBand().padding(0.3)
    this.y = d3.scaleLinear()
  }

  setLocale() {
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
  }

  getMax(items) {
    return items.reduce((acc, val) => {
      acc = (acc === undefined || val > acc) ? val : acc
      return acc;
    })
  }


  formatInputData(jsonData) {
    var attributeX = this.options.attributeX
    var attributeY = this.options.attributeY
    this.maxValue = this.getMax(jsonData.map(elem => +elem[attributeY]))
    var data = jsonData.map((elem) => {
      var d = {}
      d[attributeX] = new Date(elem[attributeX].replace('-', '/')).getTime()
      d[attributeY] = (+elem[attributeY] / this.maxValue)
      return d
    })
    return data.sort(function (a, b) {
      var dateA = new Date(a[attributeX]), dateB = new Date(b[attributeX]);
      return dateA - dateB;
    });
  }

  updateDataTimeInterval(rangeTimestamp) {
  }

  getFormatedValue(value) {
    return Number((+value * +this.maxValue).toFixed(1))
  }

  setOptions(options) {
    for (var key in options) {
      this.options[key] = options[key]
    }
  }

  loadData() {
    this.options.dataSource.getBarChartData(
      (function (data) {
        this.currentData = []
        if (data.length > 0){
          this.currentData = this.formatInputData(data)
        }
        this.x.domain(this.currentData.map((function (d) {
          return d[this.options.attributeX];
        }).bind(this)));
        this.y.domain([0, d3.max(this.currentData, (function (d) {
          return d[this.options.attributeY];
        }).bind(this))])
        this.draw()
      }).bind(this))
  }

  getMargin() {
    return { top: 10, right: 0, bottom: 30, left: 20 }
  }

  createTooltip() {
    this.tooltip = d3.select("body").append("div").attr("class", "toolTip")
    this.tootipMouseover = function (d) { }
    this.tooltipMousemove = (function (d) {
      this.tooltip
        .style("left", d3.event.pageX - 100 + "px")
        .style("top", d3.event.pageY - 110 + "px")
        .style("display", "inline-block")
        .html(`
        <b>${new Date(d[this.options.attributeX]).getDate()} de 
        ${this.months[new Date(d[this.options.attributeX]).getMonth()]}</b>
        <br>
        ${this.getFormatedValue(d[this.options.attributeY])} casos`)
    }).bind(this)
    this.tooltipMouseleave = (function (d) { this.tooltip.style("display", "none") }).bind(this)
  }


  createLineChart() {
    this.line = d3.line()
      .x((function (d) { return this.x(d[this.options.attributeX]) + this.x.bandwidth() / 2 }).bind(this))
      .y((function (d) { return this.y(d[this.options.attributeY]) }).bind(this))
      .curve(d3.curveMonotoneX)
  }

  createAreaChart() {
    this.area = d3.area()
      .x((function (d) { return this.x(d[this.options.attributeX]) + this.x.bandwidth() / 2; }).bind(this))
      .y1((function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
      .curve(d3.curveMonotoneX)
  }

  drawArea(height) {
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
  }

  drawAxisX(width, height) {
    this.x.rangeRound([0, width]);
    this.g.select(".axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(this.x).tickFormat(d3.timeFormat('%b')))
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
    var xTicks = this.g.select(".axis--x").selectAll(".tick text").nodes()
    var xTickNames = xTicks.map((n) => n.textContent)
    xTicks.forEach((n, idx) => {
      if (xTickNames.indexOf(n.textContent) !== idx) n.textContent = ''
    })
    this.g.select(".axis--x").selectAll(".tick").nodes().forEach((n) => {
      if (!n.children[1].textContent) n.remove()
    })
  }

  drawAxisY(height) {
    this.y.rangeRound([height, 0]);
    this.g.select(".axis--y")
      .call(d3.axisLeft(this.y).ticks(0).tickSize(0))
    this.g.select(".axis--y").select('.domain').remove()
    /* var xTicks = this.g.select(".axis--y").selectAll(".tick text").nodes()
    xTicks.forEach((n, idx) => {
      if (!n.textContent) return
      n.textContent = this.getFormatedValue(+n.textContent)
    }) */
  }

  drawLine() {
    this.g.select(".line-chart").remove()
    this.g.append("path")
      .attr("class", "line-chart")
      .attr("d", this.line(this.currentData))
  }

  drawBars(height) {
    var bars = this.g.selectAll(".bar").data(this.currentData)
    bars
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (function (d) { return this.x(d[this.options.attributeX]); }).bind(this))
      .attr("y", (function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
      .attr("width", this.x.bandwidth())
      .attr("height", (function (d) { return height - this.y(d[this.options.attributeY]); }).bind(this))

    this.g.selectAll(".bar")
      .on("mouseover", this.tootipMouseover)
      .on("mousemove", this.tooltipMousemove)
      .on("mouseleave", this.tooltipMouseleave)

    bars.attr("x", (function (d) { return this.x(d[this.options.attributeX]); }).bind(this))
      .attr("y", (function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
      .attr("width", this.x.bandwidth())
      .attr("height", (function (d) { return height - this.y(d[this.options.attributeY]); }).bind(this))

    bars.exit().remove()
  }

  getCurrentHeigth() {
    var bounds = this.svg.node().getBoundingClientRect()
    return bounds.height - this.getMargin().top - this.getMargin().bottom
  }

  getCurrentWidth() {
    var bounds = this.svg.node().getBoundingClientRect()
    return bounds.width - this.getMargin().left - this.getMargin().right
  }


  draw(newData) {
    /* if (newData) {
      this.currentData = newData
      this.loadData()
    } */
    this.svg.attr('width', this.parent.offsetWidth)
    var width = this.getCurrentWidth()
    var height = this.getCurrentHeigth()
    this.drawAxisX(width, height)
    this.drawAxisY(height)
    this.drawArea(height)
    this.drawBars(height)
    //this.drawLine()
  }


}