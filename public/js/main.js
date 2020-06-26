jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "formatted-num-pre": function ( a ) {
        a = (a === "-" || a === "") ? 0 : a.replace( /\./g, "" ) ;
        return parseInt( a );
    },
 
    "formatted-num-asc": function ( a, b ) {
        return a - b;
    },
 
    "formatted-num-desc": function ( a, b ) {
        return b - a;
    }
} );


var dataSource = new DataSource({})

function deepCopy(data) {
    return JSON.parse(JSON.stringify(data))
}


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
        parentId: "cases-chart-container",
        elementId: "graph-cases",
        dataSource: dataSource,
        dataLocation: 'country',
        attributeX: "date",
        attributeY: "newCases",
        attributeYLine: "meanCases",
        title: "Casos"
    })


    var barChartDeaths = new BarChart({
        parentId: "deaths-chart-container",
        elementId: "graph-deaths",
        dataSource: dataSource,
        attributeX: "date",
        attributeY: "newDeaths",
        attributeYLine: "meanDeaths",
        title: "Óbitos"
    })

    var barChartRecovered = new BarChart({
        parentId: "recovered-chart-container",
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
        dataset: dataSource.getStateChoroplethData().data,
        "drawCallback": function (settings) {
            var api = this.api()
            var rowIds = api.rows({ page: 'current' }).indexes()
            for (var i = rowIds.length; i--;) {
                var containerId = `linechart-container-${rowIds[i]}`
                var lineChart = new LineChart({
                    width: 90,
                    height: 40,
                    data: api.row(rowIds[i]).data().last14AvgCases,
                    containerId: containerId,
                    color: dataSource.getTendencyColor(
                        api.row(rowIds[i]).data().tendencyCases
                    )
                })
                $(`#${containerId}`).append(lineChart.create())
            }
        },
        "columnDefs": [
            {
                "render": function (data, type, row, meta) {
                    return ``
                },
                "targets": 6
            },
            {
                "targets": 6,
                "createdCell": function (td, cellData, rowData, row, col) {
                    $(td).attr('id', `linechart-container-${row}`)
                }
            },
            {
                "render": function (data, type, row, meta) {
                    return dataSource.numberWithPoint(Math.floor(data))
                },
                "targets": [2,3,4,5]
            },
            { type: 'formatted-num', targets: [2,3,4,5] }
        ],
        columns: [
            { title: "id", visible: false, data: "id", },
            { title: "Estados", data: "name" },
            { title: "Casos confirmados", data: "totalCases" },
            { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
            { title: "Óbitos", data: "deaths" },
            { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
            {
                title: "Tendência de casos dos últimos 14 dias",
                sortable: false,
                data: "last14AvgCases",
                "width": "12%"
            }
        ]
    })

    dateSlider.connectEndChange((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            deepCopy(statisticsData),
            dataSource.getLocationName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        covidmap.updateAnimation(timeInterval)
        setTimeout(()=>{
            covidTable.updateDataset(dataSource)
        }, 500)
    })

    dateSlider.connectStartAnimation(() => {
        covidmap.startAnimation()

    }).connectUpdateAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.updateAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            deepCopy(statisticsData),
            dataSource.getLocationName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        setTimeout(()=>{
            covidTable.updateDataset(dataSource)
        }, 500)

    }).connectStopAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.stopAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            deepCopy(statisticsData),
            dataSource.getLocationName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        setTimeout(()=>{
            covidTable.updateDataset(dataSource)
        }, 500)
    })

    covidmap.on('changeLocation', (layerClicked) => {
        dataSource.setCurrentLayer(layerClicked)
        var statisticsData = dataSource.getStatisticsData()
        locationStatus.loadData(
            deepCopy(statisticsData),
            dataSource.getLocationName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        setTimeout(() => {
            if (layerClicked && layerClicked.properties.CD_GEOCUF) {
                covidTable.changeColumnName(1, 'Municípios')
                covidTable.reloadDataset(
                    dataSource.getCityChoroplethData().data
                )
                covidTable.filterColumn(0, `^${layerClicked.properties.CD_GEOCUF}`)
            } else if (layerClicked && layerClicked.properties.CD_GEOCMU) {
                covidTable.filterColumn(0, `^${layerClicked.properties.CD_GEOCMU.slice(0, 2)}`)
            } else {
                covidTable.filterColumn(0, '')
            }
        }, 500)
    })

    covidmap.on('changeLayer', (layerId) => {
        var statisticsData = dataSource.getStatisticsData()
        if (+layerId === 1) {
            $(".recovered").each(function () {
                $(this).addClass('hide')
            })
            covidTable.changeColumnName(1, 'Municípios')
            covidTable.reloadDataset(
                dataSource.getCityChoroplethData().data
            )
        } else {
            $(".recovered").each(function () {
                $(this).removeClass('hide')
            })
            barChartRecovered.loadData(deepCopy(statisticsData))
            covidTable.changeColumnName(1, 'Estados')
            covidTable.reloadDataset(
                dataSource.getStateChoroplethData().data
            )
        }
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
    })

    var statisticsData = dataSource.getStatisticsData()
    locationStatus.loadData(
        deepCopy(statisticsData),
        dataSource.getLocationName()
    )
    barChartCases.loadData(deepCopy(statisticsData))
    barChartDeaths.loadData(deepCopy(statisticsData))
    barChartRecovered.loadData(deepCopy(statisticsData))

    $('#loader').hide()
})