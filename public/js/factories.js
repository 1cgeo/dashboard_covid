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

    createTable(type, options) {
        var table
        if (type === "state") {
            table = new CovidTableState(options)
        } else if (type === "city") {
            table = new CovidTableCity(options)
        } else if (type === "regions") {
            table = new CovidTableRegions(options)
        } else if (type === "api") {
            table = new CovidTableAPI(options)
        } else if (type === "sapi") {
            table = new CovidTableSAPI(options)
        } 
        return table;
    }

    createTableFromLayerId(layerId, options) {
        var table
        if (+layerId === 0) {
            table = this.createTable('state', options)
        } else if (+layerId === 1) {
            table = this.createTable('city', options)
        } else if (+layerId === 2) {
            table = this.createTable('regions', options)
        } else if (+layerId === 3) {
            table = this.createTable('api', options)
        } else if (+layerId === 4) {
            table = this.createTable('sapi', options)
        } 
        return table;
    }
}