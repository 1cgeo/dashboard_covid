class Factories {

    createLayer(type, options) {
        var layer
        if (type === "heat") {
            layer = new HeatLayer(options)
        } else if (type === "choroplethRate") {
            layer = new ChoroplethRateLayer(options)
        } else if (type === "circles") {
            layer = new CirclesLayer(options)
        } else if (type === "vectorTile") {
            layer = new VectorTileLayer(options)
        } else if (type === "popover") {
            layer = new PopoverLayer(options)
        } else if (type === "choroplethTendency") {
            layer = new ChoroplethTendencyLayer(options)
        }
        return layer;
    }

    createMap(type, dataSource, options) {
        var layer
        if (type === "covidMap") {
            layer = new CovidMap(dataSource, options)
        }
        return layer;
    }

    createBarChart(type, options) {
        var barChart
        options.chartType = type
        if (type === "recovered") {
            barChart = new BarChartRecovered(options)
        } else if (type === "cases") {
            barChart = new BarChartCases(options)
        } else if (type === "deaths") {
            barChart = new BarChartDeaths(options)
        } else if (type === "lethality") {
            barChart = new BarChartLethality(options)
        } else if (type === "incidence") {
            barChart = new BarChartIncidence(options)
        } else if (type === "mortality") {
            barChart = new BarChartMortality(options)
        }
        return barChart;
    }
}