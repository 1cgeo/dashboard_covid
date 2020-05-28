this.startDate = new Date('2020/02/24').getTime()
this.endDate = new Date().getTime()

var dataSource = new DataSource({
    dataTimeInterval: [startDate, endDate]
})

var locationStatus = new Status(dataSource)


var dateSlider = new SliderDate({
    dataTimeInterval: [startDate, endDate],
    dateValues: [
        document.getElementById('start-date'),
        document.getElementById('end-date')
    ]
})

var barChartCases = new BarChart({
    parentId: "statistic-container",
    elementId: "graph-cases",
    dataSource: dataSource,
    dataLocation: 'country',
    attributeX: "date",
    attributeY: "totalCases",
    title: "Casos"
})


var barChartDeaths = new BarChart({
    parentId: "statistic-container",
    elementId: "graph-deaths",
    dataSource: dataSource,
    attributeX: "date",
    attributeY: "deaths",
    title: "Óbitos"
})

var factories = new Factories()
var covidmap = factories.createMap(
    'covidMap',
    dataSource,
    {
        elementId: "map"
    }
)


dateSlider.connectEndChange((timeInterval) => {
    dataSource.setDataTimeInterval(timeInterval)
    locationStatus.update()
    barChartCases.loadData()
    barChartDeaths.loadData()
    covidmap.reloadMapData()
})

covidmap.on('changeLocation', (layerClicked) => {
    dataSource.setCurrentLayer(layerClicked)
    locationStatus.update()
    barChartCases.loadData()
    barChartDeaths.loadData()
})
