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

    var initTimeInterval = dataSource.getDataTimeInterval()

    var locationStatus = new Status(dataSource)

    var dateSlider = new SliderDate({
        dataSource: dataSource,
        dataTimeInterval: initTimeInterval,
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
            downloadName: "casos"
        })
    $(`#download-cases`).click(() => {
        barChartCases.downloadChart()
    });


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
            downloadName: "obitos"
        }
    )
    $(`#download-deaths`).click(() => {
        barChartDeaths.downloadChart()
    });

    var barChartVaccinated = factories.createBarChart(
        'vaccinated',
        {
            parentId: "vaccinated-chart-container",
            elementId: "graph-vaccinated",
            dataSource: dataSource,
            attributeX: "date",
            attributeY: "vaccinated",
            attributeYLine: "meanVaccinated",
            title: "Vacinados 1ª Dose",
            downloadName: "vacinados"
        })
    $(`#download-vaccinated`).click(() => {
        barChartVaccinated.downloadChart()
    });

    var barChartVaccinatedSecond = factories.createBarChart(
        'vaccinatedSecond',
        {
            parentId: "vaccinatedSecond-chart-container",
            elementId: "graph-vaccinatedSecond",
            dataSource: dataSource,
            attributeX: "date",
            attributeY: "vaccinated_second",
            attributeYLine: "meanVaccinatedSecond",
            title: "Vacinados 2ª Dose",
            downloadName: "vacinados-segunda-dose"
        })
    $(`#download-vaccinatedSecond`).click(() => {
        barChartVaccinatedSecond.downloadChart()
    });

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
            downloadName: "recuperados"
        }
    )
    $(`#download-recovered`).click(() => {
        barChartRecovered.downloadChart()
    });

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
            dateTitleId: "lethality-date",
            downloadName: "letalidade"
        })
    $(`#download-lethality`).click(() => {
        barChartLethality.downloadChart()
    });

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
            dateTitleId: "incidence-date",
            downloadName: "casos-por-100k-hab"
        })
    $(`#download-incidence`).click(() => {
        barChartIncidence.downloadChart()
    });

    var barChartVaccinated100k = factories.createBarChart(
        'vaccinated100k',
        {
            parentId: "vaccinated100k-chart-container",
            elementId: "graph-vaccinated100k",
            dataSource: dataSource,
            attributeX: "index",
            attributeShortName: "shortName",
            attributeY: "vaccinated_per_100k_inhabitants",
            title: "Vacinados 1ª Dose",
            dateTitleId: "vaccinated100k-date",
            downloadName: "vacinados-por-100k-hab"
        })
    $(`#download-vaccinated100k`).click(() => {
        barChartVaccinated100k.downloadChart()
    });

    var barChartVaccinatedSecond100k = factories.createBarChart(
        'vaccinated100kSecond',
        {
            parentId: "vaccinated100k-second-chart-container",
            elementId: "graph-vaccinated100k-second",
            dataSource: dataSource,
            attributeX: "index",
            attributeShortName: "shortName",
            attributeY: "vaccinated_second_per_100k_inhabitants",
            title: "Vacinados 2ª Dose",
            dateTitleId: "vaccinated100k-second-date",
            downloadName: "vacinados-segunda-dose-por-100k-hab"
        })
    $(`#download-vaccinated100k-second`).click(() => {
        barChartVaccinatedSecond100k.downloadChart()
    });

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
            dateTitleId: "mortality-date",
            downloadName: "obitos-por-100k-hab"
        })
    $(`#download-mortality`).click(() => {
        barChartMortality.downloadChart()
    });


    var covidTable = factories.createTable(
        'state',
        {
            elementId: 'covid-table',
            dataSource: dataSource,
        }
    )

    dataSource.on('changeTimeInterval', (timeInterval) => {
        var sliderOptions
        if (dataSource.getCurrentGroupData() == 'day') {
            var sliderOptions = {
                range: {
                    min: timeInterval[0],
                    max: timeInterval[1]
                },
                //behaviour: 'drag',
                connect: [true, true, false],
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
                connect: [true, true, false],
                //behaviour: 'drag',
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
        barChartVaccinated.loadData(deepCopy(statisticsData))
        barChartVaccinatedSecond.loadData(deepCopy(statisticsData))
        covidTable.updateDataset()
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
                //behaviour: 'drag',
                connect: [true, true, false],
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
                connect: [true, true, false],
                //behaviour: 'drag',
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
        barChartVaccinated.loadData(deepCopy(statisticsData))
        barChartVaccinatedSecond.loadData(deepCopy(statisticsData))

        var stateStatistics = dataSource.getStateStatistics()
        barChartLethality.loadData(deepCopy(stateStatistics))
        barChartIncidence.loadData(deepCopy(stateStatistics))
        barChartVaccinated100k.loadData(deepCopy(stateStatistics))
        barChartVaccinatedSecond100k.loadData(deepCopy(stateStatistics))
        barChartMortality.loadData(deepCopy(stateStatistics))

        var currentDateChart = dateSlider.getTimeFormated(timeInterval, 1)
        barChartLethality.setTitleDate(currentDateChart)
        barChartIncidence.setTitleDate(currentDateChart)
        barChartVaccinated100k.setTitleDate(currentDateChart)
        barChartVaccinatedSecond100k.setTitleDate(currentDateChart)
        barChartMortality.setTitleDate(currentDateChart)
        covidTable.updateDataset()
    })

    dateSlider.on('endChange', (sliderTimeInterval) => {
        var timeInterval = sliderTimeInterval//[dataSource.getDataTimeInterval()[0], sliderTimeInterval[1]]
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
        barChartVaccinated.loadData(deepCopy(statisticsData))
        barChartVaccinatedSecond.loadData(deepCopy(statisticsData))

        var stateStatistics = dataSource.getStateStatistics()
        barChartLethality.loadData(deepCopy(stateStatistics))
        barChartIncidence.loadData(deepCopy(stateStatistics))
        barChartVaccinated100k.loadData(deepCopy(stateStatistics))
        barChartVaccinatedSecond100k.loadData(deepCopy(stateStatistics))
        barChartMortality.loadData(deepCopy(stateStatistics))
        var currentDateChart = dateSlider.getTimeFormated(timeInterval, 1)
        barChartLethality.setTitleDate(currentDateChart)
        barChartIncidence.setTitleDate(currentDateChart)
        barChartMortality.setTitleDate(currentDateChart)
        barChartVaccinated100k.setTitleDate(currentDateChart)
        barChartVaccinatedSecond100k.setTitleDate(currentDateChart)
        covidmap.updateAnimation(timeInterval)
        setTimeout(() => {
            covidTable.updateDataset()
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
        barChartVaccinated.loadData(deepCopy(statisticsData))
        barChartVaccinatedSecond.loadData(deepCopy(statisticsData))

        var stateStatistics = dataSource.getStateStatistics()
        barChartLethality.loadData(deepCopy(stateStatistics))
        barChartIncidence.loadData(deepCopy(stateStatistics))
        barChartMortality.loadData(deepCopy(stateStatistics))
        barChartVaccinated100k.loadData(deepCopy(stateStatistics))
        barChartVaccinatedSecond100k.loadData(deepCopy(stateStatistics))

        var currentDateChart = dateSlider.getTimeFormated(timeInterval, 1)
        barChartLethality.setTitleDate(currentDateChart)
        barChartIncidence.setTitleDate(currentDateChart)
        barChartMortality.setTitleDate(currentDateChart)
        barChartVaccinated100k.setTitleDate(currentDateChart)
        barChartVaccinatedSecond100k.setTitleDate(currentDateChart)


        setTimeout(() => {
            covidTable.updateDataset()
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
        barChartVaccinated.loadData(deepCopy(statisticsData))
        barChartVaccinatedSecond.loadData(deepCopy(statisticsData))

        var stateStatistics = dataSource.getStateStatistics()
        barChartLethality.loadData(deepCopy(stateStatistics))
        barChartIncidence.loadData(deepCopy(stateStatistics))
        barChartMortality.loadData(deepCopy(stateStatistics))
        barChartVaccinated100k.loadData(deepCopy(stateStatistics))
        barChartVaccinatedSecond100k.loadData(deepCopy(stateStatistics))

        var currentDateChart = dateSlider.getTimeFormated(timeInterval, 1)
        barChartLethality.setTitleDate(currentDateChart)
        barChartIncidence.setTitleDate(currentDateChart)
        barChartMortality.setTitleDate(currentDateChart)
        barChartVaccinated100k.setTitleDate(currentDateChart)
        barChartVaccinatedSecond100k.setTitleDate(currentDateChart)


        setTimeout(() => {
            covidTable.updateDataset()
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
        barChartVaccinated.loadData(deepCopy(statisticsData))
        barChartVaccinatedSecond.loadData(deepCopy(statisticsData))
        covidTable.changeLocation(layerClicked)
    })

    covidmap.on('changeLayer', (layerId) => {
        var statisticsData = dataSource.getCountryData()
        var stateStatistics = dataSource.getStateStatistics()
        locationStatus.loadData(
            deepCopy(statisticsData),
            'Brasil'
        )
        if ([1, 3, 4].includes(+layerId)) {
            $(".recovered").each(function () {
                $(this).addClass('hide')
            })
            $(".vaccinated").each(function () {
                $(this).addClass('hide')
            })
            $(".vaccinatedSecond").each(function () {
                $(this).addClass('hide')
            })
        } else {
            $(".recovered").each(function () {
                $(this).removeClass('hide')
            })
            $(".vaccinated").each(function () {
                $(this).removeClass('hide')
            })
            $(".vaccinatedSecond").each(function () {
                $(this).removeClass('hide')
            })
            barChartRecovered.loadData(deepCopy(statisticsData))
            barChartVaccinated.loadData(deepCopy(statisticsData))
            barChartVaccinatedSecond.loadData(deepCopy(statisticsData))
            barChartVaccinated100k.loadData(deepCopy(stateStatistics))
            barChartVaccinatedSecond100k.loadData(deepCopy(stateStatistics))
        }
        covidTable = factories.createTableFromLayerId(
            layerId,
            {
                elementId: 'covid-table',
                dataSource: dataSource,
            }
        )
        var stateStatistics = dataSource.getStateStatistics()
        barChartLethality.loadData(deepCopy(stateStatistics))
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
    barChartVaccinated.loadData(deepCopy(statisticsData))
    barChartVaccinatedSecond.loadData(deepCopy(statisticsData))

    var stateStatistics = dataSource.getStateStatistics()
    barChartLethality.loadData(deepCopy(stateStatistics))
    barChartIncidence.loadData(deepCopy(stateStatistics))
    barChartMortality.loadData(deepCopy(stateStatistics))
    barChartVaccinated100k.loadData(deepCopy(stateStatistics))
    barChartVaccinatedSecond100k.loadData(deepCopy(stateStatistics))

    var currentDateChart = dateSlider.getTimeFormated(initTimeInterval, 1)
    barChartLethality.setTitleDate(currentDateChart)
    barChartIncidence.setTitleDate(currentDateChart)
    barChartMortality.setTitleDate(currentDateChart)
    barChartVaccinated100k.setTitleDate(currentDateChart)
    barChartVaccinatedSecond100k.setTitleDate(currentDateChart)
    $('#loader').hide()
})