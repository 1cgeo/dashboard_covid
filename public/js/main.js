var dataSource = new DataSource({})

dataSource.loadAllData(() => {

    var locationStatus = new Status(dataSource)

    var dateSlider = new SliderDate({
        dataTimeInterval: dataSource.getDataTimeInterval(),
        dateValues: [
            document.getElementById('start-date'),
            document.getElementById('end-date')
        ]
    })

    var barChartCases = new BarChart({
        parentId: "cases-chart",
        elementId: "graph-cases",
        dataSource: dataSource,
        dataLocation: 'country',
        attributeX: "date",
        attributeY: "newCases",
        attributeYLine: "meanCases",
        title: "Casos"
    })


    var barChartDeaths = new BarChart({
        parentId: "deaths-chart",
        elementId: "graph-deaths",
        dataSource: dataSource,
        attributeX: "date",
        attributeY: "newDeaths",
        attributeYLine: "meanDeaths",
        title: "Óbitos"
    })

    var barChartRecovered = new BarChart({
        parentId: "recovered-chart",
        elementId: "graph-recovered",
        dataSource: dataSource,
        attributeX: "date",
        attributeY: "recovered",
        attributeYLine: "meanRecovered",
        title: "Recuperados"
    })

    var factories = new Factories()
    var covidmap = factories.createMap(
        'covidMap',
        dataSource, {
            elementId: "map-container"
        }
    )

    var covidTable = new CovidTable({
        elementId: 'covid-table',
        dataset: dataSource.getTableStateData(),
        columns: [
            { title: "Estado", data: "CD_GEOCUF" },
            { title: "Nº Casos", data: "totalCases" },
            { title: "Nº Óbitos", data: "deaths" },
        ]
    })

    dateSlider.connectEndChange((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData.slice(),
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData.slice())
        barChartDeaths.loadData(statisticsData.slice())
        barChartRecovered.loadData(statisticsData.slice())
        covidmap.updateAnimation(timeInterval)
    })

    dateSlider.connectStartAnimation(() => {
        covidmap.startAnimation()

    }).connectUpdateAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.updateAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData.slice(),
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData.slice())
        barChartDeaths.loadData(statisticsData.slice())
        barChartRecovered.loadData(statisticsData.slice())

    }).connectStopAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.stopAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData.slice(),
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData.slice())
        barChartDeaths.loadData(statisticsData.slice())
        barChartRecovered.loadData(statisticsData.slice())
    })

    covidmap.on('changeLocation', (layerClicked) => {
        dataSource.setCurrentLayer(layerClicked)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData.slice(),
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData.slice())
        barChartDeaths.loadData(statisticsData.slice())
        barChartRecovered.loadData(statisticsData.slice())
    })

    covidmap.on('changeLayer', (layerId) => {
        var statisticsData = dataSource.getStatisticsData()
        if (+layerId === 1) {
            $(".recovered").each(function() {
                $(this).addClass('hide')
            })
            covidTable.setOptions({
                elementId: 'covid-table',
                dataset: dataSource.getTableCityData(),
                columns: [
                    { title: "Cidade", data: "CD_GEOCMU" },
                    { title: "Nº Casos", data: "totalCases" },
                    { title: "Nº Óbitos", data: "deaths" },
                ]
            })
        } else {
            $(".recovered").each(function() {
                $(this).removeClass('hide')
            })
            barChartRecovered.loadData(statisticsData.slice())
            covidTable.setOptions({
                elementId: 'covid-table',
                dataset: dataSource.getTableStateData(),
                columns: [
                    { title: "Estado", data: "CD_GEOCUF" },
                    { title: "Nº Casos", data: "totalCases" },
                    { title: "Nº Óbitos", data: "deaths" },
                ]
            })
        }
        covidTable.create()
        barChartCases.loadData(statisticsData.slice())
        barChartDeaths.loadData(statisticsData.slice())
    })

    var statisticsData = dataSource.getStatisticsData()
    locationStatus.loadData(
        statisticsData.slice(),
        dataSource.getLocationName()
    )
    barChartCases.loadData(statisticsData.slice())
    barChartDeaths.loadData(statisticsData.slice())
    barChartRecovered.loadData(statisticsData.slice())

    $('#loader').hide()
})