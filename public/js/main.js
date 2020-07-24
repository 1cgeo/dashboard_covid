jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "formatted-num-pre": function (a) {
        a = (a === "-" || a === "") ? 0 : a.replace(/\./g, "");
        return parseInt(a);
    },

    "formatted-num-asc": function (a, b) {
        return a - b;
    },

    "formatted-num-desc": function (a, b) {
        return b - a;
    }
});

var factories = new Factories()

var dataSource = new DataSource({})

dataSource.loadAllData(() => {

    var covidmap = factories.createMap(
        'covidMap',
        dataSource,
        {
            elementId: "map-container"
        }
    )

    var locationStatus = new Status(dataSource)

    var dateSlider = new SliderDate({
        dataSource: dataSource,
        dataTimeInterval: dataSource.getDataTimeInterval(),
        dateValues: [
            document.getElementById('start-date'),
            document.getElementById('end-date')
        ]
    })

    var barChartCases = factories.createBarChart(
        'cases',
        {
            parentId: "cases-chart-container",
            elementId: "graph-cases",
            dataSource: dataSource,
            attributeX: "date",
            attributeY: "newCases",
            attributeYLine: "meanCases",
            title: "Casos",
            downloadBtnId: "download-cases"
        })


    var barChartDeaths = factories.createBarChart(
        'deaths',
        {
            parentId: "deaths-chart-container",
            elementId: "graph-deaths",
            dataSource: dataSource,
            attributeX: "date",
            attributeY: "newDeaths",
            attributeYLine: "meanDeaths",
            title: "Óbitos",
            downloadBtnId: "download-deaths"
        }
    )

    var barChartRecovered = factories.createBarChart(
        'recovered',
        {
            parentId: "recovered-chart-container",
            elementId: "graph-recovered",
            dataSource: dataSource,
            attributeX: "date",
            attributeY: "recovered",
            attributeYLine: "meanRecovered",
            title: "Recuperados",
            downloadBtnId: "download-recovered"
        }
    )

    var barChartLethality = factories.createBarChart(
        'lethality',
        {
            parentId: "lethality-chart-container",
            elementId: "graph-lethality",
            dataSource: dataSource,
            attributeX: "index",
            attributeShortName: "shortName",
            attributeY: "fatalityRate",
            title: "Letalidade",
            downloadBtnId: "download-lethality"
        })

    var barChartIncidence = factories.createBarChart(
        'incidence',
        {
            parentId: "incidence-chart-container",
            elementId: "graph-incidence",
            dataSource: dataSource,
            attributeX: "index",
            attributeShortName: "shortName",
            attributeY: "totalCases_per_100k_inhabitants",
            title: "Incidência",
            downloadBtnId: "download-incidence"
        })

    var barChartMortality = factories.createBarChart(
        'mortality',
        {
            parentId: "mortality-chart-container",
            elementId: "graph-mortality",
            dataSource: dataSource,
            attributeX: "index",
            attributeShortName: "shortName",
            attributeY: "deaths_per_100k_inhabitants",
            title: "Mortalidade",
            downloadBtnId: "download-mortality"
        })



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
                    return numberWithPoint(Math.floor(data))
                },
                "targets": [2, 3, 4, 5]
            },
            { type: 'formatted-num', targets: [2, 3, 4, 5] }
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

    dataSource.on('changeTimeInterval', (timeInterval) => {
        var sliderOptions
        if (dataSource.getCurrentGroupData() == 'day') {
            var sliderOptions = {
                range: {
                    min: timeInterval[0],
                    max: timeInterval[1]
                },
                behaviour: 'drag',
                connect: true,
                step: 24 * 60 * 60 * 1000,
                start: timeInterval,
                format: {
                    from: Number,
                    to: function (value) {
                        return new Date(value);
                    }
                }
            }
        } else {
            sliderOptions = {
                start: timeInterval,
                step: 1,
                connect: true,
                behaviour: 'drag',
                range: {
                    'min': timeInterval[0],
                    'max': timeInterval[1]
                }
            }
        }
        dateSlider.reloadSliderOptions(sliderOptions)
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        locationStatus.loadData(
            deepCopy(statisticsData),
            covidmap.getCurrentFeatureName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        covidTable.updateDataset(dataSource)
    })

    dataSource.on('changeGroupData', (groupName) => {
        covidmap.getCurrentThemeLayer().loadTimeInterval()
        var timeInterval = dataSource.getDataTimeInterval()
        var sliderOptions
        if (dataSource.getCurrentGroupData() == 'day') {
            var sliderOptions = {
                range: {
                    min: timeInterval[0],
                    max: timeInterval[1]
                },
                behaviour: 'drag',
                connect: true,
                step: 24 * 60 * 60 * 1000,
                start: timeInterval,
                format: {
                    from: Number,
                    to: function (value) {
                        return new Date(value);
                    }
                }
            }
        } else {
            sliderOptions = {
                start: timeInterval,
                step: 1,
                connect: true,
                behaviour: 'drag',
                range: {
                    'min': timeInterval[0],
                    'max': timeInterval[1]
                }
            }
        }
        dateSlider.reloadSliderOptions(sliderOptions)
        covidmap.updateAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        locationStatus.loadData(
            deepCopy(statisticsData),
            covidmap.getCurrentFeatureName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        covidTable.updateDataset(dataSource)
    })

    dateSlider.on('endChange', (sliderTimeInterval) => {
        var timeInterval = [dataSource.getDataTimeInterval()[0], sliderTimeInterval[1]]
        dataSource.setDataTimeInterval(timeInterval)
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        locationStatus.loadData(
            deepCopy(statisticsData),
            covidmap.getCurrentFeatureName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        covidmap.updateAnimation(timeInterval)
        setTimeout(() => {
            covidTable.updateDataset(dataSource)
        }, 500)
    })

    dateSlider.connectStartAnimation(() => {
        covidmap.startAnimation()

    }).connectUpdateAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.updateAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        locationStatus.loadData(
            deepCopy(statisticsData),
            covidmap.getCurrentFeatureName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        setTimeout(() => {
            covidTable.updateDataset(dataSource)
        }, 500)

    }).connectStopAnimation((timeInterval) => {
        dataSource.setDataTimeInterval(timeInterval)
        covidmap.stopAnimation(timeInterval)
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        locationStatus.loadData(
            deepCopy(statisticsData),
            covidmap.getCurrentFeatureName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        setTimeout(() => {
            covidTable.updateDataset(dataSource)
        }, 500)
    })

    covidmap.on('changeLocation', (layerClicked) => {
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        locationStatus.loadData(
            deepCopy(statisticsData),
            covidmap.getCurrentFeatureName()
        )
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
        barChartRecovered.loadData(deepCopy(statisticsData))
        setTimeout(() => {
            if (!layerClicked) {
                if (covidmap.getCurrentLayerOptions().id == 0) {
                    if (covidTable.getColumnName(1) == 'Municípios') {
                        covidTable.reloadDataset(
                            dataSource.getStateChoroplethData().data
                        )
                    }
                }
                covidTable.filterColumn(0, '')
            }
            else if (layerClicked.properties.CD_GEOCUF) {
                covidTable.changeColumnName(1, 'Municípios')
                covidTable.reloadDataset(
                    dataSource.getCityChoroplethData().data
                )
                covidTable.filterColumn(0, `^${layerClicked.properties.CD_GEOCUF}`)
            } else if (layerClicked.properties.CD_GEOCMU) {
                covidTable.filterColumn(0, `^${layerClicked.properties.CD_GEOCMU.slice(0, 2)}`)
            }
        }, 500)
    })

    covidmap.on('changeLayer', (layerId) => {
        var statisticsData = dataSource.getStatisticsData(
            covidmap.getCurrentPopoverLayer()
        )
        if ([1, 3, 4].includes(+layerId)) {
            $(".recovered").each(function () {
                $(this).addClass('hide')
            })
        } else {
            $(".recovered").each(function () {
                $(this).removeClass('hide')
            })
        }
        if (+layerId === 1) {
            covidTable.changeColumnName(1, 'Municípios')
            covidTable.reloadDataset(
                dataSource.getCityChoroplethData().data
            )
        } else {
            barChartRecovered.loadData(deepCopy(statisticsData))
            covidTable.changeColumnName(1, 'Estados')
            covidTable.reloadDataset(
                dataSource.getStateChoroplethData().data
            )
        }
        barChartCases.loadData(deepCopy(statisticsData))
        barChartDeaths.loadData(deepCopy(statisticsData))
    })

    var statisticsData = dataSource.getStatisticsData(
        covidmap.getCurrentPopoverLayer()
    )
    locationStatus.loadData(
        deepCopy(statisticsData),
        covidmap.getCurrentFeatureName()
    )
    barChartCases.loadData(deepCopy(statisticsData))
    barChartDeaths.loadData(deepCopy(statisticsData))
    barChartRecovered.loadData(deepCopy(statisticsData))

    var stateStatistics = dataSource.getStateStatistics()
    barChartLethality.loadData(deepCopy(stateStatistics))
    barChartIncidence.loadData(deepCopy(stateStatistics))
    barChartMortality.loadData(deepCopy(stateStatistics))

    $('#loader').hide()
})