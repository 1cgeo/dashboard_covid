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

    dateSlider.connectEndChange((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData,
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData)
        barChartDeaths.loadData(statisticsData)
        barChartRecovered.loadData(statisticsData)
        covidmap.updateAnimation(timeInterval)
    })

    dateSlider.connectStartAnimation(() => {
        covidmap.startAnimation()

    }).connectUpdateAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.updateAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData,
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData)
        barChartDeaths.loadData(statisticsData)
        barChartRecovered.loadData(statisticsData)

    }).connectStopAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.stopAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData,
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData)
        barChartDeaths.loadData(statisticsData)
        barChartRecovered.loadData(statisticsData)
    })

    covidmap.on('changeLocation', (layerClicked) => {
        dataSource.setCurrentLayer(layerClicked)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            statisticsData,
            dataSource.getLocationName()
        )
        barChartCases.loadData(statisticsData)
        barChartDeaths.loadData(statisticsData)
        barChartRecovered.loadData(statisticsData)
    })

    covidmap.on('changeLayer', (layerId) => {
        if (+layerId === 1) {
            $(".recovered").each(function() {
                $(this).addClass('hide')
            })
        } else {
            $(".recovered").each(function() {
                $(this).removeClass('hide')
            })
            var statisticsData = dataSource.getStatisticsData()
            barChartRecovered.loadData(statisticsData)
        }
    })

    var statisticsData = dataSource.getStatisticsData()
    locationStatus.loadData(
        statisticsData,
        dataSource.getLocationName()
    )
    barChartCases.loadData(statisticsData)
    barChartDeaths.loadData(statisticsData)
    barChartRecovered.loadData(statisticsData)

    $('#loader').hide()
})