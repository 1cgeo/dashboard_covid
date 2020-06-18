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
        scrollYHeight: '35vh',
        columns: [
            { title: "", data: "name", "width": "30%" },
            { title: "casos confirmados", data: "totalCases", "width": "10%" },
            { title: "a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants", "width": "10%" },
            { title: "óbitos", data: "deaths", "width": "10%" },
            { title: "a cada 100.000 hab.", data: "deaths_per_100k_inhabitants", "width": "10%" },
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
            $(".recovered").each(function () {
                $(this).addClass('hide')
            })
            covidTable.setOptions({scrollYHeight: '60vh'})
            covidTable.reloadDataset(
                dataSource.getTableCityData()
            )
        } else {
            $(".recovered").each(function () {
                $(this).removeClass('hide')
            })
            barChartRecovered.loadData(statisticsData.slice())
            covidTable.setOptions({scrollYHeight: '35vh'})
            covidTable.reloadDataset(
                dataSource.getTableStateData()
            )
        }
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