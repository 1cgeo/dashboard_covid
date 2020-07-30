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
        window.addEventListener("resize", () => {
            this.draw()
        })
    }

    downloadChart() {
        var downloadContainer = "print-container"
        var chartId = "print-graph"
        $(`#${downloadContainer}`).empty()
        $(`<svg id="${chartId}"></svg>`).appendTo(`#${downloadContainer}`)
        var options = Object.assign({}, this.options)
        options.parentId = ""
        options.barWithLabels = true
        options.toDownload = true
        options.offsetHeight = 400
        options.offsetWidth = 1200
        options.elementId = chartId
        options.customMargin = { top: 30, right: 30, bottom: 50, left: 70 }
        options.customStyles = {
            /* '.line-chart-mean': {
                'stroke-width': '2px'
            }, */
            'text': {
                'style': 'font: bold 12px sans-serif;'
            }
        }
        var copyChart = factories.createBarChart(options.chartType, options)
        copyChart.loadData(deepCopy(this.dataset.slice(-28)))
        d3ToPng(`#${chartId}`, this.getDownloadName(), {
            scale: 5,
            quality: 0.01,
        })
    }

    getDownloadName() {
        var suffix = (this.options.dataSource.getCurrentGroupData() == 'week') ? 'semanal' : 'diario'
        return `${this.options.downloadName}-${suffix}-${this.dataset[0].date}`
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
        this.dataset = data
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

    loadCSS() {
        var css = this.getCSS()
        for (var selector in css) {
            this.loadElementStyles(
                this.g.selectAll(selector),
                css[selector]
            )
            if (this.options.customStyles && this.options.customStyles[selector]) {
                this.loadElementStyles(
                    this.g.selectAll(selector),
                    this.options.customStyles[selector]
                )
            }
        }
    }

    getMargin() {
        if (this.options.customMargin) {
            return this.options.customMargin
        }
        return { top: 30, right: 10, bottom: 30, left: 70 }
    }

    createTooltip() {
        var groupData = this.options.dataSource.getCurrentGroupData()
        this.tooltip = d3.select("body").append("div").attr("class", "toolTip")
        this.tootipMouseover = function (d) { }
        this.tooltipMousemove = (d, idx) => {
            var currentBar = this.g.selectAll('.bar')
                .filter(function (d, i) { return i === idx; })
            this.loadElementStyles(currentBar, this.getHoverCSS()['active'])
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
        this.tooltipMouseleave = (d, idx) => {
            var currentBar = this.g.selectAll('.bar')
                .filter(function (d, i) { return i === idx; })
            this.loadElementStyles(currentBar, this.getHoverCSS()['deactive'])
            this.tooltip.style("display", "none")
        }
    }

    createLineChart(attributeX, attributeY) {
        return d3.line()
            .x((d) => { return this.x(d[attributeX]) + this.x.bandwidth() / 2 })
            .y((d) => { return this.y(d[attributeY]) })
            .curve(d3.curveMonotoneX)
    }

    createLineLabels() {

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

    getAxisXlabelFormat() {
        if (this.options.barWithLabels) {
            return (this.options.dataSource.getCurrentGroupData() == 'week') ?
                d3.axisBottom(this.x).ticks(1) : d3.axisBottom(this.x).tickFormat(d3.timeFormat('%d %b'))
        }
        return (this.options.dataSource.getCurrentGroupData() == 'week') ?
            d3.axisBottom(this.x).ticks(1) : d3.axisBottom(this.x).tickFormat(d3.timeFormat('%b'))
    }

    drawAxisX(width, height) {
        this.x.rangeRound([0, width]);
        this.g.select(".axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(this.getAxisXlabelFormat())
            .selectAll("text")
            .attr("y", 0)
            .attr("x", (this.options.barWithLabels) ? 25 : 7)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start")
        if (this.options.dataSource.getCurrentGroupData() != 'day' || this.options.barWithLabels) {
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

    loadElementStyles(element, css) {
        for (var key in css) {
            element.attr(key, css[key])
        }
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
            .attr('fill', 'none')
            .attr("d", this.createLineChart(this.options.attributeX, this.options.attributeYLine)(
                this.currentData
            ))
        if (this.options.toDownload) return
        var idx = Math.floor(this.currentData.length / 2)
        var xValue = this.currentData[idx][this.options.attributeX]
        var yValue = this.currentData[idx][this.options.attributeYLine]
        this.g.append("text")
            .attr("text-anchor", "middle")
            .attr("class", "label-chart-mean")
            .attr("x", this.x(xValue))
            .attr("y", this.y(1))
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

    createBarsLabels(bars) {
        var text = bars.enter().append("text")
            .attr("x", (d) => {
                return this.x(d[this.options.attributeX])  + this.x.bandwidth() / 2
            })
            .attr("y", (d) => {
                return this.y(d[this.options.attributeY]) - 12
            })
        text.append('tspan')
            .text((d) => {
                return `${numberWithPoint(this.getFormatedValue(d[this.options.attributeY]))}`
            })
            .style("text-anchor", "middle")
        text.append('tspan')
            .text((d, idx, arr) => {
                if (idx !== (arr.length - 1)) return
                var mean = Math.floor(+d[this.options.attributeYLine] * this.maxValue)
                if (mean == 0) {
                    return ''
                }
                return `${mean} média`
            })
            .attr("x", (d) => {
                return this.x(d[this.options.attributeX])
            })
            //.attr("dx", 20)
            .attr("dy", 12)
            .style("text-anchor", "start")
    }

    drawBars(width, height) {
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

        if (this.options.barWithLabels) {
            this.createBarsLabels(bars)
        }

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
        this.drawBars(width, height)
        this.drawLine()
        this.drawLineYMiddle()
        this.drawLineYTop()
        this.loadCSS()
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
        this.drawBars(width, height)
        this.removeLine()
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            this.drawLine()
            if (this.options.barWithLabels) {
                this.createLineLabels()
            }
        }
        this.drawLineYMiddle()
        this.drawLineYTop()
        this.loadCSS()
    }

    getCSS() {
        return {
            'path.arrow': {
                'stroke': 'rgb(0, 0, 0)',
                'stroke-width': '0.5px',
                'stroke-dasharray': '3'
            },
            'line': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'stroke': '#999',
                'fill': 'none',
                'stroke-width': '1.5'
            },
            '.line-chart-middle': {
                'fill': 'none',
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-top': {
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-mean': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'stroke': '#009624'
            },
            'text': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'fill': '#121212',
                'font-size': '13px',
            },
            '.bar': {
                'fill': 'rgba(113, 206, 6, 0.835)'
            }
        }
    }

    getHoverCSS() {
        return {
            'deactive': {
                'fill': 'rgba(113, 206, 6, 0.835)'
            },
            'active': {
                'fill': 'rgb(66, 122, 2)'
            }
        }
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
        this.drawBars(width, height)
        this.removeLine()
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            this.drawLine()
            if (this.options.barWithLabels) {
                this.createLineLabels()
            }
        }
        this.drawLineYMiddle()
        this.drawLineYTop()
        this.loadCSS()
    }

    getCSS() {
        return {
            'path.arrow': {
                'stroke': 'rgb(0, 0, 0)',
                'stroke-width': '0.5px',
                'stroke-dasharray': '3'
            },
            'line': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'stroke': '#999',
                'fill': 'none',
                'stroke-width': '1.5'
            },
            '.line-chart-middle': {
                'fill': 'none',
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-top': {
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-mean': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'stroke': 'red'
            },
            'text': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'fill': '#121212',
                'font-size': '13px',
            },
            '.bar': {
                'fill': 'rgba(207, 17, 17, 0.2)'
            }
        }
    }

    getHoverCSS() {
        return {
            'deactive': {
                'fill': 'rgba(207, 17, 17, 0.2)'
            },
            'active': {
                'fill': '#cf1111'
            }
        }
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
        this.drawBars(width, height)
        this.removeLine()
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            this.drawLine()
            if (this.options.barWithLabels) {
                this.createLineLabels()
            }
        }
        this.drawLineYMiddle()
        this.drawLineYTop()
        this.loadCSS()
    }

    getCSS() {
        return {
            'path.arrow': {
                'stroke': 'rgb(0, 0, 0)',
                'stroke-width': '0.5px',
                'stroke-dasharray': '3'
            },
            'line': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'stroke': '#999',
                'fill': 'none',
                'stroke-width': '1.5'
            },
            '.line-chart-middle': {
                'fill': 'none',
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-top': {
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-mean': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'stroke': 'gray'
            },
            'text': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'fill': '#121212',
                'font-size': '13px',
            },
            '.bar': {
                'fill': 'rgba(85, 85, 85, 0.2)'
            }
        }
    }

    getHoverCSS() {
        return {
            'deactive': {
                'fill': 'rgba(85, 85, 85, 0.2)'
            },
            'active': {
                'fill': '#555555'
            }
        }
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

    getHoverCSS() {
        return { 'fill': '#cf1111' }
    }

    downloadChart() {
        var downloadContainer = "print-container"
        var chartId = "print-graph"
        $(`#${downloadContainer}`).empty()
        $(`<svg id="${chartId}"></svg>`).appendTo(`#${downloadContainer}`)
        var options = Object.assign({}, this.options)
        options.parentId = ""
        options.barWithLabels = true
        options.offsetHeight = 600
        options.offsetWidth = 1400
        options.elementId = chartId
        options.toDownload = true
        options.customMargin = { top: 30, right: 10, bottom: 50, left: 70 }
        options.customStyles = {
            'text': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'fill': '#121212',
                'font-size': '15px',
                'style': 'font: bold 15px sans-serif;'
            }
        }
        var copyChart = factories.createBarChart(options.chartType, options)
        copyChart.currentData = deepCopy(this.currentData)
        copyChart.maxValue = this.maxValue
        copyChart.loadChart()
        d3ToPng(`#${chartId}`, this.getDownloadName(), {
            scale: 5,
            quality: 0.01,
        })
    }

    setTitleDate(value) {
        var prefix = (this.options.dataSource.getCurrentGroupData() == 'day') ? 'Data:' : 'Semana:'
        $(`#${this.options.dateTitleId}`).text(`[ ${prefix} ${value} ]`)
    }

    draw() {
        this.svg.attr('width', this.getWidthSvg())
            .attr('height', this.getHeightSvg())
        var width = this.getCurrentWidth()
        var height = this.getCurrentHeigth()
        this.drawAxisX(width, height)
        this.drawAxisY(height)
        this.drawBars(width, height)
        this.drawLineYMiddle()
        this.drawLineYTop()
        this.loadCSS()
    }

    getCSS() {
        return {
            '.line-chart-middle': {
                'fill': 'none',
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            '.line-chart-top': {
                'stroke': '#121212',
                'stroke-width': '1',
                'stroke-dasharray': '5'
            },
            'text': {
                'position': 'absolute',
                'left': '0',
                'bottom': '2px',
                'fill': '#121212',
                'font-size': '13px',
                //'style': 'font: bold 30px sans-serif;'
            }
        }
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
        this.tooltipMousemove = (d, idx) => {
            var currentBar = this.g.selectAll('.bar')
                .filter(function (d, i) { return i === idx; })
            this.loadElementStyles(currentBar, this.getHoverCSS())
            this.tooltip
                .style("left", d3.event.pageX - 100 + "px")
                .style("top", d3.event.pageY - 110 + "px")
                .style("display", "inline-block")
                .html(`
                ${this.getFormatedValue(d[this.options.attributeY])} ${this.options.title}
                <br>
                UF: ${d[this.options.attributeShortName]}
                `)
        }
        this.tooltipMouseleave = (d, idx) => {
            var currentBar = this.g.selectAll('.bar')
                .filter(function (d, i) { return i === idx; })
            this.loadElementStyles(currentBar, { 'fill': this.getColorByShorName(d.shortName) })
            this.tooltip.style("display", "none")
        }
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
            .attr("y", 10)
            .attr("x", (this.options.toDownload) ? 19 : 4)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start")
    }

    createBarsLabels(bars) {
        bars.enter().append("text")
            .text((d) => {
                return Math.floor(this.getFormatedValue(d[this.options.attributeY]));
            })
            .attr("x", (d) => {
                return this.x(d[this.options.attributeX])
            })
            .attr("y", (d) => {
                return this.y(d[this.options.attributeY]) - 12
            })
            .style("text-anchor", "middle")
    }

    drawBars(width, height) {
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

        if (this.options.barWithLabels) {
            this.createBarsLabels(bars)
        }

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

    createBarsLabels(bars) {
        bars.enter().append("text")
            .text((d) => {
                return `${this.getFormatedValue(d[this.options.attributeY])}%`;
            })
            .attr("x", (d) => {
                return this.x(d[this.options.attributeX])
            })
            .attr("y", (d) => {
                return this.y(d[this.options.attributeY]) - 12;
            })
            .style("text-anchor", "middle")
    }

    drawAxisY(height) {
        this.y.rangeRound([height, 0]);
        this.g.select(".axis--y")
            .call(d3.axisLeft(this.y).ticks(2).tickSize(0))
        this.g.select(".axis--y").select('.domain').remove()
        var xTicks = this.g.select(".axis--y").selectAll(".tick text").nodes()
        xTicks.forEach((n, idx) => {
            if (!n.textContent) return
            n.textContent = `${mFormatter(this.getFormatedValue(+n.textContent))}%`
        })
    }

    createTooltip() {
        this.tooltip = d3.select("body").append("div").attr("class", "toolTipState")
        this.tootipMouseover = function (d) {
            //d3.select(this).attr()
        }
        this.tooltipMousemove = (d, idx) => {
            var currentBar = this.g.selectAll('.bar')
                .filter(function (d, i) { return i === idx; })
            this.loadElementStyles(currentBar, this.getHoverCSS())
            this.tooltip
                .style("left", d3.event.pageX - 100 + "px")
                .style("top", d3.event.pageY - 110 + "px")
                .style("display", "inline-block")
                .html(`
                ${this.getFormatedValue(d[this.options.attributeY])}% ${this.options.title}
                <br>
                UF: ${d[this.options.attributeShortName]}
                `)
        }
        this.tooltipMouseleave = (d, idx) => {
            var currentBar = this.g.selectAll('.bar')
                .filter(function (d, i) { return i === idx; })
            this.loadElementStyles(currentBar, { 'fill': this.getColorByShorName(d.shortName) })
            this.tooltip.style("display", "none")
        }
    }

    getColorByShorName(shortName) {
        if (shortName == 'BR') {
            return "#8c9eff"
        }
        return "#90caf9"
    }

}

class BarChartIncidence extends BarChartStates {

    constructor(newOptions) {
        super(newOptions)
    }

    getColorByShorName(shortName) {
        if (shortName == 'BR') {
            return "#8c9eff"
        }
        return "#f4cfcd"
    }
}

class BarChartMortality extends BarChartStates {

    constructor(newOptions) {
        super(newOptions)
    }

    getColorByShorName(shortName) {
        if (shortName == 'BR') {
            return "#8c9eff"
        }
        return "#dddddd"
    }
}