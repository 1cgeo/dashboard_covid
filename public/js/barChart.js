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
        this.createMarkers()
        this.createTooltip()
        this.createAreaChart()
        this.connectDownloadBtn()
        window.addEventListener("resize", () => {
            this.draw()
        })
    }

    connectDownloadBtn() {
        $(`#${this.options.downloadBtnId}`).click(() => {
            this.downloadChart()
        });
    }

    downloadChart() {
        var downloadContainer = "print-container"
        var chartId = "print-graph"
        $(`#${downloadContainer}`).empty()
        $(`<svg id="${chartId}"></svg>`).appendTo(`#${downloadContainer}`)
        var options = Object.assign({}, this.options)
        options.parentId = ""
        options.offsetHeight = 152
        options.offsetWidth = 900
        options.elementId = chartId
        var copyChart = factories.createBarChart(options.chartType, options)
        copyChart.currentData = deepCopy(this.currentData)
        copyChart.maxValue = this.maxValue
        copyChart.loadChart()
        copyStyles(
            `#${this.options.elementId}`,
            `#${chartId}`,
            [
                'fill',
                'stroke',
                'stroke-width',
                'stroke-dasharray',
                'position',
                'left',
                'bottom',
                'font-size'

            ]
        )
        d3ToPng(`#${chartId}`, this.options.chartType, {
            scale: 3,
            quality: 0.01,
        })
    }

    loadSvg() {
        return d3.select(`#${this.options.elementId}`)
            .attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
    }

    getWidthSvg() {
        if (this.options.offsetWidth) {
            return this.options.offsetWidth
        }
        return this.parent.offsetWidth
    }

    getHeightSvg() {
        if (this.options.offsetHeight) {
            return this.options.offsetHeight
        }
        return this.parent.offsetHeight
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

    formatInputData(jsonData) {
        var attributeX = this.options.attributeX
        var attributeY = this.options.attributeY
        var attributeYLine = this.options.attributeYLine
        var yValues = jsonData.map(elem => +elem[attributeY])
        this.maxValue = (yValues.length < 1) ? 0 : getMax(yValues)
        var dataFormated = []
        for (var i = jsonData.length; i--;) {
            var d = {}
            if (this.options.dataSource.getCurrentGroupData() == 'day') {
                d[attributeX] = new Date(jsonData[i][attributeX].replace(/\-/g, '/')).getTime()
            } else {
                d[attributeX] = +jsonData[i].week
            }
            d[attributeY] = (this.maxValue == 0 || isNaN(jsonData[i][attributeY])) ? 0 : (+jsonData[i][attributeY] / this.maxValue)
            d[attributeYLine] = (this.maxValue == 0 || isNaN(jsonData[i][attributeYLine])) ? 0 : (+jsonData[i][attributeYLine] / this.maxValue)
            dataFormated.push(d)
        }
        return dataFormated.sort(function (a, b) {
            var dateA = new Date(a[attributeX]),
                dateB = new Date(b[attributeX]);
            return dateA - dateB;
        });
    }

    getFormatedValue(value) {
        return Number((+value * +this.maxValue).toFixed(1))
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    loadData(data) {
        this.currentData = []
        if (data.length < 0) return
        this.currentData = this.formatInputData(data)
        this.loadChart()
    }

    loadChart() {
        this.x.domain(this.currentData.map((function (d) {
            return d[this.options.attributeX];
        }).bind(this)));
        this.y.domain([0, d3.max(this.currentData, (function (d) {
            return d[this.options.attributeY];
        }).bind(this))])
        this.draw()
    }

    getMargin() {
        return { top: 30, right: 10, bottom: 30, left: 70 }
    }

    createTooltip() {
        var groupData = this.options.dataSource.getCurrentGroupData()
        this.tooltip = d3.select("body").append("div").attr("class", "toolTip")
        this.tootipMouseover = function (d) { }
        this.tooltipMousemove = (d) => {
            this.tooltip
                .style("left", d3.event.pageX - 100 + "px")
                .style("top", d3.event.pageY - 110 + "px")
                .style("display", "inline-block")
                .html(`
        ${(groupData == 'day') ?
                        `<b>${new Date(d[this.options.attributeX]).getDate()} de 
    ${this.months[new Date(d[this.options.attributeX]).getMonth()]}
    </b>` :
                        `Semana ${d[this.options.attributeX]}`}
        <br>
        ${numberWithPoint(
                            this.getFormatedValue(d[this.options.attributeY]
                            ))} ${this.options.title}
        <br>
        
        ${(groupData == 'day') ? `${Math.floor(+d[this.options.attributeYLine] * this.maxValue)} média` : ``}`)
        }
        this.tooltipMouseleave = (d) => { this.tooltip.style("display", "none") }
    }


    createLineChart(attributeX, attributeY) {
        return d3.line()
            .x((d) => { return this.x(d[attributeX]) + this.x.bandwidth() / 2 })
            .y((d) => { return this.y(d[attributeY]) })
            .curve(d3.curveMonotoneX)
    }

    createAreaChart() {
        this.area = d3.area()
            .x((function (d) { return this.x(d[this.options.attributeX]) + this.x.bandwidth() / 2; }).bind(this))
            .y1((function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
            .curve(d3.curveMonotoneX)
    }

    drawArea(height) {
        try {
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
        } catch (error) {

        }
    }

    drawAxisX(width, height) {
        this.x.rangeRound([0, width]);
        this.g.select(".axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(
                (this.options.dataSource.getCurrentGroupData() == 'day') ?
                    d3.axisBottom(this.x).tickFormat(d3.timeFormat('%b')) :
                    d3.axisBottom(this.x).ticks(1)
            )
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 7)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start")
        if (this.options.dataSource.getCurrentGroupData() != 'day') {
            return
        }
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
            .call(d3.axisLeft(this.y).ticks(2).tickSize(0))
        this.g.select(".axis--y").select('.domain').remove()
        var xTicks = this.g.select(".axis--y").selectAll(".tick text").nodes()
        xTicks.forEach((n, idx) => {
            if (!n.textContent) return
            n.textContent = mFormatter(this.getFormatedValue(+n.textContent))
        })
    }

    drawLineYMiddle() {
        this.g.select(".line-chart-middle").remove()
        this.g.append("path")
            .attr("class", "line-chart-middle")
            .attr("d", this.createLineChart(this.options.attributeX, this.options.attributeY)(
                JSON.parse(JSON.stringify(this.currentData)).map((d) => {
                    d[this.options.attributeY] = 0.5
                    return d
                })))
    }

    drawLineYTop() {
        this.g.select(".line-chart-top").remove()
        this.g.append("path")
            .attr("class", "line-chart-top")
            .attr("d", this.createLineChart(this.options.attributeX, this.options.attributeY)(
                JSON.parse(JSON.stringify(this.currentData)).map((d) => {
                    d[this.options.attributeY] = 1
                    return d
                })))
    }

    createMarkers() {
        this.svg.append("defs").append("marker")
            .attr("id", "marker")
            .attr("viewBox", "-5 -5 10 10")
            .attr("refX", 4)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .attr('markerUnits', 'strokeWidth')
            .append("path")
            .attr("d", "M 0,0 m -5,-5 L 5,0 L -5,5 Z")
            .attr('fill', '#999 !important');
    }

    removeLine() {
        this.g.select(".line-chart-mean").remove()
        this.g.select(".label-chart-mean").remove()
        this.g.select(".arrow").remove()
    }

    drawLine() {
        if (this.currentData.length < 1) return
        this.g.append("path")
            .attr("class", "line-chart-mean")
            .attr("d", this.createLineChart(this.options.attributeX, this.options.attributeYLine)(
                this.currentData
            ))
        var idx = Math.floor(this.currentData.length / 2)
        var xValue = this.currentData[idx][this.options.attributeX]
        var yValue = this.currentData[idx][this.options.attributeYLine]
        this.g.append("text")
            .attr("text-anchor", "middle")
            .attr("class", "label-chart-mean")
            .attr("x", this.x(xValue))
            .attr("y", this.y(1.1))
            .text("Média de 7 dias");
        this.g.append("path")
            .attr("class", "arrow")
            .attr("d", d3.line()
                .x((d) => { return this.x(d[0]) + this.x.bandwidth() / 2 })
                .y((d) => { return this.y(d[1]) })
                .curve(d3.curveMonotoneX)([
                    [xValue, 1.009],
                    [xValue, yValue]
                ]))
            .attr('stroke-linecap', 'round')
    }

    drawBars(height) {
        var bars = this.g.selectAll(".bar").data(this.currentData)
        bars
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", (function (d) { return this.x(d[this.options.attributeX]); }).bind(this))
            .attr("y", (function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
            .attr("width", this.x.bandwidth())
            .attr("height", (d) => {
                var h = height - this.y(d[this.options.attributeY])
                return (h < 0) ? 0 : h;
            })

        this.g.selectAll(".bar")
            .on("mouseover", this.tootipMouseover)
            .on("mousemove", this.tooltipMousemove)
            .on("mouseleave", this.tooltipMouseleave)

        bars.attr("x", (function (d) { return this.x(d[this.options.attributeX]); }).bind(this))
            .attr("y", (function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
            .attr("width", this.x.bandwidth())
            .attr("height", (d) => {
                var h = height - this.y(d[this.options.attributeY])
                return (h < 0) ? 0 : h;
            })
        bars.exit().remove()
    }

    getCurrentHeigth() {
        return this.getHeightSvg() - this.getMargin().top - this.getMargin().bottom
    }

    getCurrentWidth() {
        return this.getWidthSvg() - this.getMargin().left - this.getMargin().right
    }


    draw() {
        this.svg.attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
        var width = this.getCurrentWidth()
        var height = this.getCurrentHeigth()
        this.drawAxisX(width, height)
        this.drawAxisY(height)
        this.drawBars(height)
        this.drawLine()
        this.drawLineYMiddle()
        this.drawLineYTop()
    }


}


class BarChartRecovered extends BarChart {

    constructor(newOptions) {
        super(newOptions)
    }

    draw() {
        this.svg.attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
        var width = this.getCurrentWidth()
        var height = this.getCurrentHeigth()
        this.drawAxisX(width, height)
        this.drawAxisY(height)
        this.drawBars(height)
        this.removeLine()
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            this.drawLine()
        }
        this.drawLineYMiddle()
        this.drawLineYTop()
    }

    formatInputData(jsonData) {
        var attributeX = this.options.attributeX
        var attributeY = this.options.attributeY
        var attributeYLine = this.options.attributeYLine
        var yValues = jsonData.map(elem => +elem[attributeY])
        this.maxValue = (yValues.length < 1) ? 0 : getMax(yValues)
        var dataFormated = []
        for (var i = jsonData.length; i--;) {
            var d = {}
            if (this.options.dataSource.getCurrentGroupData() == 'day') {
                d[attributeX] = new Date(jsonData[i][attributeX].replace(/\-/g, '/')).getTime()
            } else {
                d[attributeX] = +jsonData[i].week
            }
            d[attributeY] = (this.maxValue == 0 || isNaN(jsonData[i][attributeY])) ? 0 : (+jsonData[i][attributeY] / this.maxValue)
            d[attributeYLine] = (this.maxValue == 0 || isNaN(jsonData[i][attributeYLine])) ? 0 : (+jsonData[i][attributeYLine] / this.maxValue)
            dataFormated.push(d)
        }
        return dataFormated.sort(function (a, b) {
            var dateA = new Date(a[attributeX]),
                dateB = new Date(b[attributeX]);
            return dateA - dateB;
        });
    }

}


class BarChartCases extends BarChart {

    constructor(newOptions) {
        super(newOptions)
    }

    draw() {
        this.svg.attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
        var width = this.getCurrentWidth()
        var height = this.getCurrentHeigth()
        this.drawAxisX(width, height)
        this.drawAxisY(height)
        this.drawBars(height)
        this.removeLine()
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            this.drawLine()
        }
        this.drawLineYMiddle()
        this.drawLineYTop()
    }

    formatInputData(jsonData) {
        var attributeX = this.options.attributeX
        var attributeY = this.options.attributeY
        var attributeYLine = this.options.attributeYLine
        var yValues = jsonData.map(elem => +elem[attributeY])
        this.maxValue = (yValues.length < 1) ? 0 : getMax(yValues)
        var dataFormated = []
        for (var i = jsonData.length; i--;) {
            var d = {}
            if (this.options.dataSource.getCurrentGroupData() == 'day') {
                d[attributeX] = new Date(jsonData[i][attributeX].replace(/\-/g, '/')).getTime()
            } else {
                d[attributeX] = +jsonData[i].week
            }
            d[attributeY] = (this.maxValue == 0 || isNaN(jsonData[i][attributeY])) ? 0 : (+jsonData[i][attributeY] / this.maxValue)
            d[attributeYLine] = (this.maxValue == 0 || isNaN(jsonData[i][attributeYLine])) ? 0 : (+jsonData[i][attributeYLine] / this.maxValue)
            dataFormated.push(d)
        }
        return dataFormated.sort(function (a, b) {
            var dateA = new Date(a[attributeX]),
                dateB = new Date(b[attributeX]);
            return dateA - dateB;
        });
    }

}


class BarChartDeaths extends BarChart {

    constructor(newOptions) {
        super(newOptions)
    }

    draw() {
        this.svg.attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
        var width = this.getCurrentWidth()
        var height = this.getCurrentHeigth()
        this.drawAxisX(width, height)
        this.drawAxisY(height)
        this.drawBars(height)
        this.removeLine()
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            this.drawLine()
        }
        this.drawLineYMiddle()
        this.drawLineYTop()
    }

    formatInputData(jsonData) {
        var attributeX = this.options.attributeX
        var attributeY = this.options.attributeY
        var attributeYLine = this.options.attributeYLine
        var yValues = jsonData.map(elem => +elem[attributeY])
        this.maxValue = (yValues.length < 1) ? 0 : getMax(yValues)
        var dataFormated = []
        for (var i = jsonData.length; i--;) {
            var d = {}
            if (this.options.dataSource.getCurrentGroupData() == 'day') {
                d[attributeX] = new Date(jsonData[i][attributeX].replace(/\-/g, '/')).getTime()
            } else {
                d[attributeX] = +jsonData[i].week
            }
            d[attributeY] = (this.maxValue == 0 || isNaN(jsonData[i][attributeY])) ? 0 : (+jsonData[i][attributeY] / this.maxValue)
            d[attributeYLine] = (this.maxValue == 0 || isNaN(jsonData[i][attributeYLine])) ? 0 : (+jsonData[i][attributeYLine] / this.maxValue)
            dataFormated.push(d)
        }
        return dataFormated.sort(function (a, b) {
            var dateA = new Date(a[attributeX]),
                dateB = new Date(b[attributeX]);
            return dateA - dateB;
        });
    }

}


class BarChartStates extends BarChart {

    constructor(newOptions) {
        super(newOptions)
    }

    draw() {
        this.svg.attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
        var width = this.getCurrentWidth()
        var height = this.getCurrentHeigth()
        this.drawAxisX(width, height)
        this.drawAxisY(height)
        this.drawBars(height)
        this.drawLineYMiddle()
        this.drawLineYTop()
    }

    formatInputData(jsonData) {
        var attributeX = this.options.attributeX
        var attributeY = this.options.attributeY
        var attributeShortName = this.options.attributeShortName
        var yValues = jsonData.map(elem => +elem[attributeY])
        this.maxValue = (yValues.length < 1) ? 0 : getMax(yValues)
        var dataFormated = []
        for (var i = jsonData.length; i--;) {
            var d = {}
            d[attributeShortName] = jsonData[i][attributeShortName]
            d[attributeY] = (this.maxValue == 0 || isNaN(jsonData[i][attributeY])) ? 0 : (+jsonData[i][attributeY] / this.maxValue)
            dataFormated.push(d)
        }
        dataFormated.sort(function (a, b) {
            return a[attributeY] - b[attributeY];
        });
        dataFormated.forEach((data, idx) => {
            data[attributeX] = idx
        })
        return dataFormated
    }

    createTooltip() {
        this.tooltip = d3.select("body").append("div").attr("class", "toolTipState")
        this.tootipMouseover = function (d) { }
        this.tooltipMousemove = (d) => {
            this.tooltip
                .style("left", d3.event.pageX - 100 + "px")
                .style("top", d3.event.pageY - 110 + "px")
                .style("display", "inline-block")
                .html(`
                ${this.getFormatedValue(d[this.options.attributeY])} ${this.options.title}`)
        }
        this.tooltipMouseleave = (d) => { this.tooltip.style("display", "none") }
    }

    drawAxisX(width, height) {
        this.x.rangeRound([0, width]);
        this.g.select(".axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(
                d3.axisBottom(this.x).tickFormat((d, i) => {
                    return this.currentData[+d][this.options.attributeShortName];
                })
            )
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 7)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start")
    }

    drawBars(height) {
        var bars = this.g.selectAll(".bar").data(this.currentData)
        bars
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", ((d) => { return this.x(d[this.options.attributeX]); }))
            .attr("y", ((d) => { return this.y(d[this.options.attributeY]); }))
            .attr("width", this.x.bandwidth())
            .attr("height", (d) => {
                var h = height - this.y(d[this.options.attributeY])
                return (h < 0) ? 0 : h;
            })
            .attr("fill", (d) => {
                return this.getColorByShorName(d.shortName)
            })

        this.g.selectAll(".bar")
            .on("mouseover", this.tootipMouseover)
            .on("mousemove", this.tooltipMousemove)
            .on("mouseleave", this.tooltipMouseleave)

        bars.attr("x", (function (d) { return this.x(d[this.options.attributeX]); }).bind(this))
            .attr("y", (function (d) { return this.y(d[this.options.attributeY]); }).bind(this))
            .attr("width", this.x.bandwidth())
            .attr("height", (d) => {
                var h = height - this.y(d[this.options.attributeY])
                return (h < 0) ? 0 : h;
            })
            .attr("fill", (d) => {
                return this.getColorByShorName(d.shortName)
            })
        bars.exit().remove()
    }

}

class BarChartLethality extends BarChartStates {

    constructor(newOptions) {
        super(newOptions)
    }

    getColorByShorName(shortName) {
        if (shortName == 'BR') {
            return "#6a6767"
        }
        return "#f4cfcd"
    }


}

class BarChartIncidence extends BarChartStates {

    constructor(newOptions) {
        super(newOptions)
    }

    getColorByShorName(shortName) {
        if (shortName == 'BR') {
            return "#6a6767"
        }
        return "#90caf9"
    }


}

class BarChartMortality extends BarChartStates {

    constructor(newOptions) {
        super(newOptions)
    }

    getColorByShorName(shortName) {
        if (shortName == 'BR') {
            return "#6a6767"
        }
        return "#dddddd"
    }

}