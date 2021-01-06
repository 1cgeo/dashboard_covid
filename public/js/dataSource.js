class DataSource {
    constructor(newOptions) {
        this.options = {
            dataLocationId: null,
        };
        this.heatData = null
        this.setOptions(newOptions);
        this.createEvents()
        this.connectChangeGroupData()
    }

    createEvents() {
        this.events = new Signal()
        this.events.createEvent('changeTimeInterval')
        this.events.createEvent('changeGroupData')
    }

    getCurrentGroupData() {
        return $("#group-data-by").val()
    }

    connectChangeGroupData() {
        $("#group-data-by").change(() => {
            this.triggerChangeGroupData(
                this.getCurrentGroupData()
            )
        });
    }

    setDataTimeInterval(timeInterval) {
        this.options.dataTimeInterval = timeInterval
    }

    on(eventName, listener) {
        this.events.connect(eventName, listener)
    }

    triggerChangeTimeInterval(timeInterval) {
        this.events.trigger('changeTimeInterval', timeInterval)
    }

    triggerChangeGroupData(groupName) {
        this.events.trigger('changeGroupData', groupName)
    }

    getDataTimeInterval() {
        if (this.getCurrentGroupData() == 'day') {
            return [
                new Date(this.options.dataTimeInterval[0]).getTime(),
                new Date(this.options.dataTimeInterval[1]).getTime(),
            ];
        }
        return [
            +this.options.dataTimeInterval[0],
            +this.options.dataTimeInterval[1]
        ];
    }

    loadAllData(cb) {
        this.getDataFromServer("state", "choropleth", (data) => {
            this.setStateChoroplethData(data)
        })
        this.getDataFromServer("city", "choropleth", (data) => {
            this.setCityChoroplethData(data)
        })
        this.getDataFromServer("regions", "choropleth", (data) => {
            this.setRegionsChoroplethData(data)
        })
        this.getDataFromServer("api", "choropleth", (data) => {
            this.setAPIChoroplethData(data)
        })
        this.getDataFromServer("sapi", "choropleth", (data) => {
            this.setSAPIChoroplethData(data)
        })
        this.getDataFromServer("state", "circle", (data) => {
            this.setStateCircleData(data);
        })
        this.getDataFromServer("city", "circle", (data) => {
            this.setCityCircleData(data)
        })
        this.getDataFromServer("regions", "circle", (data) => {
            this.setRegionsCircleData(data)
        })
        this.getDataFromServer("api", "circle", (data) => {
            this.setAPICircleData(data)
        })
        this.getDataFromServer("sapi", "circle", (data) => {
            this.setSAPICircleData(data)
        })
        this.getDataFromServer("regions", "heat", (data) => {
            this.setRegionsHeatData(data)
        })
        this.getDataFromServer("api", "heat", (data) => {
            this.setAPIHeatData(data)
        })
        this.getDataFromServer("sapi", "heat", (data) => {
            this.setSAPIHeatData(data)
        })
        this.getDataFromServer("city", "heat", (data) => {
            this.setHeatData(data);
            this.getCountryDataFromServer(async (data) => {
                this.setCountryData(data)
                while (!this.stateChoroplethData || !this.cityChoroplethData) {
                    await sleep(1000)
                }
                cb()
            });
        });
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key];
        }
    }

    setCountryData(data) {
        this.countryData = data;
    }

    getCountryData() {
        var broupBy = this.getCurrentGroupData()
        var timeInterval = this.getDataTimeInterval();
        return deepCopy(this.countryData[broupBy]).filter((data) => {
            if (broupBy == 'day') {
                var elementDate = new Date(data.date.replace(/\-/g, "/"));
                return (elementDate.getTime() >= timeInterval[0] && elementDate.getTime() <= timeInterval[1])
            }
            return (data.week >= timeInterval[0] && data.week <= timeInterval[1])
        })
    }

    setHeatTimeInterval(layerId) {
        var broupBy = this.getCurrentGroupData()
        var data
        if ([0, 1].includes(layerId)) {
            data = this.heatData[broupBy]
        } else if (layerId == 2) {
            data = this.regionsHeatData[broupBy]
        } else if (layerId == 3) {
            data = this.apiHeatData[broupBy]
        } else if (layerId == 4) {
            data = this.sapiHeatData[broupBy]
        }
        if (broupBy == 'day') {
            this.setDataTimeInterval([
                new Date(data[0].date.replace(/\-/g, "/")).getTime(),
                new Date(data[data.length - 1].date.replace(/\-/g, "/")).getTime()
            ])
        } else {
            this.setDataTimeInterval([
                data[0].week,
                data[data.length - 1].week
            ])
        }
        this.triggerChangeTimeInterval(this.getDataTimeInterval())
    }

    filterHeadData(data) {
        var heatData = []
        for (var i = data.length; i--;) {
            if (this.isCurrentData(data[i])) {
                heatData.push(data[i])
            } else if (heatData.length > 0) {
                break
            }
        }
        return heatData
    }

    setHeatData(data) {
        this.heatData = data;
    }

    getHeatData(data) {
        var broupBy = this.getCurrentGroupData()
        var data = deepCopy(this.heatData[broupBy])
        return this.filterHeadData(data)
    }

    setRegionsHeatData(data) {
        this.regionsHeatData = data;
    }

    getRegionsHeatData(data) {
        var broupBy = this.getCurrentGroupData()
        var data = deepCopy(this.regionsHeatData[broupBy])
        return this.filterHeadData(data)
    }

    setAPIHeatData(data) {
        this.apiHeatData = data;
    }

    getAPIHeatData(data) {
        var broupBy = this.getCurrentGroupData()
        var data = deepCopy(this.apiHeatData[broupBy])
        return this.filterHeadData(data)
    }

    setSAPIHeatData(data) {
        this.sapiHeatData = data;
    }

    getSAPIHeatData(data) {
        var broupBy = this.getCurrentGroupData()
        var data = deepCopy(this.sapiHeatData[broupBy])
        return this.filterHeadData(data)
    }

    setCircleTimeInterval(layerId) {
        var broupBy = this.getCurrentGroupData()
        var data
        if (layerId == 0) {
            data = this.stateCircleData[broupBy]
        } else if (layerId == 1) {
            data = this.cityCircleData[broupBy]
        } else if (layerId == 2) {
            data = this.regionsCircleData[broupBy]
        } else if (layerId == 3) {
            data = this.apiCircleData[broupBy]
        } else if (layerId == 4) {
            data = this.sapiCircleData[broupBy]
        }
        if (broupBy == 'day') {
            this.setDataTimeInterval([
                new Date(data.features[0].properties.date.replace(/\-/g, "/")).getTime(),
                new Date(data.features[data.features.length - 1].properties.date.replace(/\-/g, "/")).getTime()
            ])
        } else {
            this.setDataTimeInterval([
                data.features[0].properties.week,
                data.features[data.features.length - 1].properties.week
            ])
        }
        this.triggerChangeTimeInterval(this.getDataTimeInterval())
    }

    filterCircleData(geojson) {
        var features = []
        for (var i = geojson.features.length; i--;) {
            if (this.isCurrentData(geojson.features[i].properties)) {
                features.push(geojson.features[i])
            } else if (features.length > 0) {
                break
            }
        }
        geojson.features = features
        return geojson;
    }

    setStateCircleData(data) {
        this.stateCircleData = data;
    }

    getStateCircleData() {
        var broupBy = this.getCurrentGroupData()
        var geojson = deepCopy(this.stateCircleData[broupBy])
        return this.filterCircleData(geojson)
    }

    setCityCircleData(data) {
        this.cityCircleData = data;
    }

    getCityCircleData() {
        var broupBy = this.getCurrentGroupData()
        var geojson = deepCopy(this.cityCircleData[broupBy]);
        return this.filterCircleData(geojson)
    }

    setRegionsCircleData(data) {
        this.regionsCircleData = data;
    }

    getRegionsCircleData() {
        var broupBy = this.getCurrentGroupData()
        var geojson = deepCopy(this.regionsCircleData[broupBy])
        return this.filterCircleData(geojson)
    }

    setAPICircleData(data) {
        this.apiCircleData = data;
    }

    getAPICircleData() {
        var broupBy = this.getCurrentGroupData()
        var geojson = deepCopy(this.apiCircleData[broupBy])
        return this.filterCircleData(geojson)
    }

    setSAPICircleData(data) {
        this.sapiCircleData = data;
    }

    getSAPICircleData() {
        var broupBy = this.getCurrentGroupData()
        var geojson = deepCopy(this.sapiCircleData[broupBy])
        return this.filterCircleData(geojson)
    }

    filterChoroplethData(data, idField) {
        var broupBy = this.getCurrentGroupData()
        var listedId = [];
        var reduced = [];
        var timeInterval = this.getDataTimeInterval();
        for (var i = data.length; i--;) {
            var id = data[i][idField]
            if (broupBy == 'day') {
                var elementDate = new Date(data[i].date.replace(/\-/g, "/"));
                if (listedId.indexOf(id) < 0 && (elementDate.getTime() == timeInterval[1])) {
                    listedId.push(id)
                    reduced.push(data[i])
                }
                if (elementDate.getTime() < timeInterval[1]) break
                continue
            }
            if (listedId.indexOf(id) < 0 && (data[i].week == timeInterval[1])) {
                listedId.push(id)
                reduced.push(data[i])
            }
            if (data[i].week < timeInterval[1]) break

        }
        return {
            data: reduced,
            ids: listedId
        }
    }

    setStateChoroplethData(data) {
        this.stateChoroplethData = data;
    }

    getStateChoroplethData() {
        var broupBy = this.getCurrentGroupData()
        var data = this.stateChoroplethData[broupBy]
        return this.filterChoroplethData(data, "CD_GEOCUF")
    }

    getStateStatisticData() {
        var broupBy = this.getCurrentGroupData()
        return this.stateChoroplethData[broupBy]
    }

    setCityChoroplethData(data) {
        this.cityChoroplethData = data;
    }

    getCityChoroplethData() {
        var broupBy = this.getCurrentGroupData()
        var data = this.cityChoroplethData[broupBy]
        return this.filterChoroplethData(data, "CD_GEOCMU")
    }

    getCityStatiscData() {
        var broupBy = this.getCurrentGroupData()
        return this.cityChoroplethData[broupBy]
    }

    setRegionsChoroplethData(data) {
        this.regionsChoroplethData = data;
    }

    getRegionsChoroplethData() {
        var broupBy = this.getCurrentGroupData()
        var data = this.regionsChoroplethData[broupBy]
        return this.filterChoroplethData(data, "name")
    }

    getRegionsStatiscData() {
        var broupBy = this.getCurrentGroupData()
        return this.regionsChoroplethData[broupBy]
    }

    setAPIChoroplethData(data) {
        this.apiChoroplethData = data;
    }

    getAPIChoroplethData() {
        var broupBy = this.getCurrentGroupData()
        var data = this.apiChoroplethData[broupBy]
        return this.filterChoroplethData(data, "name")
    }

    getAPIStatiscData() {
        var broupBy = this.getCurrentGroupData()
        return this.apiChoroplethData[broupBy]
    }

    setSAPIChoroplethData(data) {
        this.sapiChoroplethData = data;
    }

    getSAPIChoroplethData() {
        var broupBy = this.getCurrentGroupData()
        var data = this.sapiChoroplethData[broupBy]
        return this.filterChoroplethData(data, "name")
    }

    getSAPIStatiscData() {
        var broupBy = this.getCurrentGroupData()
        return this.sapiChoroplethData[broupBy]
    }

    setChoroplethTimeInterval(layerId) {
        var broupBy = this.getCurrentGroupData()
        var data
        if (layerId == 0) {
            data = this.stateChoroplethData[broupBy]
        } else if (layerId == 1) {
            data = this.cityChoroplethData[broupBy]
        } else if (layerId == 2) {
            data = this.regionsChoroplethData[broupBy]
        } else if (layerId == 3) {
            data = this.apiChoroplethData[broupBy]
        } else if (layerId == 4) {
            data = this.sapiChoroplethData[broupBy]
        }
        if (broupBy == 'day') {
            this.setDataTimeInterval([
                new Date(data[0].date.replace(/\-/g, "/")).getTime(),
                new Date(data[data.length - 1].date.replace(/\-/g, "/")).getTime()
            ])
        } else {
            this.setDataTimeInterval([
                data[0].week,
                data[data.length - 1].week
            ])
        }
        this.triggerChangeTimeInterval(
            this.getDataTimeInterval()
        )
    }

    getSearchData() {
        var broupBy = this.getCurrentGroupData()
        var listedId = [];
        var reduced = [];
        var data = this.cityChoroplethData[broupBy]
        for (var i = data.length; i--;) {
            var id = data[i].CD_GEOCMU
            if (listedId.indexOf(id) >= 0) break
            listedId.push(id)
            reduced.push(data[i])
        }
        return reduced
    }


    getStatisticsData(popoverLayer) {
        var layerProperties = popoverLayer.getCurrentFeatureProperties()
        if (!layerProperties) {
            return this.getCountryData();
        }
        var broupBy = this.getCurrentGroupData()
        var fieldIdDataset = popoverLayer.getFieldIdDataset()
        var featureId = popoverLayer.getCurrentFeatureId()
        var timeInterval = this.getDataTimeInterval()
        return popoverLayer.getStatisticDataset().filter((data) => {
            var id = data[fieldIdDataset]
            if (broupBy == 'day') {
                var elementDate = new Date(data.date.replace(/\-/g, "/"));
                return elementDate >= timeInterval[0] && elementDate <= timeInterval[1] && featureId === id;
            }
            return data.week >= timeInterval[0] && data.week <= timeInterval[1] && featureId === id;
        })
    }

    getStateStatistics() {
        var countryData = this.getCountryData()
        return this.getStateChoroplethData().data.concat(countryData[countryData.length - 1])
    }

    isCurrentData(data) {
        var success = false
        var timeInterval = this.getDataTimeInterval()
        if (this.getCurrentGroupData() == 'day') {
            var elementDate = new Date(data.date.replace(/\-/g, "/"));
            success = (elementDate.getTime() === timeInterval[1])
        } else {
            success = (+data.week === timeInterval[1])
        }
        return success
    }

    getCountryDataFromServer(cb) {
        httpGetAsync(`${window.location.origin}/api/information/country`, function (
            data
        ) {
            cb(JSON.parse(data));
        });
    }

    getDataFromServer(location, theme, cb) {
        var url = `${window.location.origin}/api/maptheme/${theme}?location=${location}`;
        httpGetAsync(url, function (data) {
            cb(JSON.parse(data));
        });
    }

    getMapLayer(layerId) {
        var layers = this.getAllLayers();
        for (var i = layers.length; i--;) {
            if (layers[i].id !== layerId) continue;
            return layers[i];
        }
    }

    getThemeLayers(layerId) {
        var layers = this.getAllLayers();
        for (var i = layers.length; i--;) {
            if (layers[i].id == layerId) {
                return layers[i].themeLayers;
            }
        }
    }

    getThemeLayer(layerId) {
        var layers = this.getAllLayers();
        for (var i = layers.length; i--;) {
            if (layers[i].id !== layerId) continue;
            return layers[i].themeLayers;
        }
    }

    getMapLayerNames() {
        return this.getAllLayers().map((data) => {
            return {
                name: data.name,
                id: data.id,
            };
        });
    }

    getTrendCasesMapValues() {
        return [
            { value: "Diminuindo", color: "#badee8" },
            { value: "Aproximadamente o mesmo", color: "#f2df91" },
            { value: "Crescendo 1", color: "#ffae43" },
            { value: "Crescendo 2", color: "#ff6e0b" },
            { value: "Crescendo 3", color: "#ce0a05" },
            { value: "Sem ou poucos casos", color: "#f2f2f2", default: true }
        ]
    }

    getTrendDeathsMapValues() {
        return [
            { value: "Diminuindo", color: "#badee8" },
            { value: "Aproximadamente o mesmo", color: "#f2df91" },
            { value: "Crescendo 1", color: "#cbc9e2" },
            { value: "Crescendo 2", color: "#9e9ac8" },
            { value: "Crescendo 3", color: "#6a51a3" },
            { value: "Sem ou poucos casos", color: "#f2f2f2", default: true }
        ]
    }

    getTendencyColor(tendencyValue) {
        var found = this.getTrendCasesMapValues().find((elem) => {
            return elem.value === tendencyValue
        })
        return found.color
    }

    getAllLayers() {
        return [
            {
                name: "Estados",
                id: 0,
                center: [-12.940292375503162, -50.44921875000001],
                zoom: 3,
                popoverLayer: {
                    statisticDataset: this.getStateStatisticData.bind(this),
                    fieldIdGeojson: "CD_GEOCUF",
                    fieldIdDataset: "CD_GEOCUF",
                    fieldTitle: "NM_ESTADO",
                    datasetCallback: this.getStateChoroplethData.bind(this)
                },
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: "white",
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf",
                        },
                        styleLimit: {
                            weight: 0.5,
                            opacity: 1,
                            color: 'black'
                        },
                        idField: "CD_GEOCUF",
                        main: true,
                    },
                ],
                themeLayers: [
                    /* {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        type: "heat",
                        datasetCallback: this.getHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        id: 0,
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        type: "heat",
                        datasetCallback: this.getHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        id: 1,
                    }, */
                    {
                        name: "Tendência de casos",
                        attributeName: "tendencyCases",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethTendency",
                        mapValues: this.getTrendCasesMapValues(),
                        datasetCallback: this.getStateChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 8,
                    },
                    {
                        name: "Tendência de óbitos",
                        attributeName: "tendencyDeaths",
                        attributeNameSecondary: "deaths",
                        type: "choroplethTendency",
                        mapValues: this.getTrendDeathsMapValues(),
                        datasetCallback: this.getStateChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 7,
                    },
                    {
                        name: "Taxa de crescimento de casos",
                        attributeName: "nrDiasDobraCasos",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethRate",
                        rate: [14, 30, 50],
                        datasetCallback: this.getStateChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 2,
                    },
                    {
                        name: "Taxa de crescimento de óbitos",
                        attributeName: "nrDiasDobraMortes",
                        attributeNameSecondary: "deaths",
                        rate: [14, 30, 50],
                        datasetCallback: this.getStateChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        type: "choroplethRate",
                        id: 3,
                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 4,
                        datasetCallback: this.getStateCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de casos",
                        scaleFactor: 0.00015,
                        scaleLenged: [500000, 1500000, 3000000],
                        cicleStyle: {
                            fillColor: "#CF1111",
                            color: "#cf1111",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getStateCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de óbitos",
                        type: "circles",
                        id: 5,
                        scaleFactor: 0.0015,
                        scaleLenged: [20000, 75000, 200000],
                        cicleStyle: {
                            fillColor: "#555555",
                            color: "#555555",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de recuperados",
                        attributeName: "totalRecovered",
                        datasetCallback: this.getStateCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        type: "circles",
                        id: 6,
                        popupAttributeTitle: "Número de recuperados",
                        scaleFactor: 0.00015,
                        scaleLenged: [500000, 1500000, 3000000],
                        cicleStyle: {
                            fillColor: "#009624",
                            color: "#009624",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                ],
            },
            {
                name: "Municípios",
                id: 1,
                center: [-12.940292375503162, -50.44921875000001],
                zoom: 3,
                popoverLayer: {
                    statisticDataset: this.getCityStatiscData.bind(this),
                    fieldIdGeojson: "CD_GEOCMU",
                    fieldIdDataset: "CD_GEOCMU",
                    fieldTitle: "NM_MUNICIP",
                    datasetCallback: this.getCityChoroplethData.bind(this)
                },
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: "black",
                        },
                        styleLimit: {
                            weight: 0.5,
                            opacity: 1,
                            color: 'black'
                        },
                        idField: "CD_GEOCUF",
                    },
                    {
                        url: `${window.location.origin}/api/layer/tile/city/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: "white",
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf",
                        },
                        idField: "CD_GEOCMU",
                        main: true,
                        styleLimit: {
                            weight: 0.1,
                            opacity: 1,
                            color: 'black'
                        },
                    },
                ],
                themeLayers: [
                    {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        datasetCallback: this.getHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 0,
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 1,
                    },

                    {
                        name: "Tendência de casos",
                        attributeName: "tendencyCases",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethTendency",
                        datasetCallback: this.getCityChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        mapValues: this.getTrendCasesMapValues(),
                        id: 8,
                    },
                    {
                        name: "Tendência de óbitos",
                        attributeName: "tendencyDeaths",
                        attributeNameSecondary: "deaths",
                        type: "choroplethTendency",
                        datasetCallback: this.getCityChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        mapValues: this.getTrendDeathsMapValues(),
                        id: 7,
                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 4,
                        datasetCallback: this.getCityCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de casos",
                        scaleFactor: 0.0015,
                        scaleLenged: [50000, 150000, 300000],
                        cicleStyle: {
                            fillColor: "#CF1111",
                            color: "#cf1111",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        type: "circles",
                        datasetCallback: this.getCityCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        id: 5,
                        popupAttributeTitle: "Número de óbitos",
                        scaleFactor: 0.015,
                        scaleLenged: [2000, 10000, 20000],
                        cicleStyle: {
                            fillColor: "#555555",
                            color: "#555555",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                ],
            },
            {
                name: "Regiões",
                id: 2,
                center: [-12.940292375503162, -50.44921875000001],
                zoom: 3,
                popoverLayer: {
                    statisticDataset: this.getRegionsStatiscData.bind(this),
                    fieldIdGeojson: "REGIAO",
                    fieldIdDataset: "name",
                    fieldTitle: "REGIAO",
                    datasetCallback: this.getRegionsChoroplethData.bind(this)
                },
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/regions/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: "white",
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf",
                        },
                        styleLimit: {
                            weight: 0.5,
                            opacity: 1,
                            color: 'black'
                        },
                        idField: "REGIAO",
                        main: true,
                    }
                ],
                themeLayers: [
                    /* {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        datasetCallback: this.getRegionsHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 0,
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getRegionsHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 1,
                    }, */
                    {
                        name: "Tendência de casos",
                        attributeName: "tendencyCases",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethTendency",
                        mapValues: this.getTrendCasesMapValues(),
                        datasetCallback: this.getRegionsChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 8,
                    },
                    {
                        name: "Tendência de óbitos",
                        attributeName: "tendencyDeaths",
                        attributeNameSecondary: "deaths",
                        type: "choroplethTendency",
                        mapValues: this.getTrendDeathsMapValues(),
                        datasetCallback: this.getRegionsChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 7,
                    },
                    {
                        name: "Taxa de crescimento de casos",
                        attributeName: "nrDiasDobraCasos",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethRate",
                        rate: [14, 30, 50],
                        datasetCallback: this.getRegionsChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 2,
                    },
                    {
                        name: "Taxa de crescimento de óbitos",
                        attributeName: "nrDiasDobraMortes",
                        attributeNameSecondary: "deaths",
                        rate: [14, 30, 50],
                        datasetCallback: this.getRegionsChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        type: "choroplethRate",
                        id: 3,
                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 4,
                        datasetCallback: this.getRegionsCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de casos",
                        scaleFactor: 0.00015,
                        scaleLenged: [100000, 1500000, 3000000],
                        cicleStyle: {
                            fillColor: "#CF1111",
                            color: "#cf1111",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getRegionsCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de óbitos",
                        type: "circles",
                        id: 5,
                        scaleFactor: 0.015,
                        scaleLenged: [2000, 10000, 20000],
                        cicleStyle: {
                            fillColor: "#555555",
                            color: "#555555",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de recuperados",
                        attributeName: "totalRecovered",
                        datasetCallback: this.getRegionsCircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        type: "circles",
                        id: 6,
                        popupAttributeTitle: "Número de recuperados",
                        scaleFactor: 0.00015,
                        scaleLenged: [100000, 1500000, 3000000],
                        cicleStyle: {
                            fillColor: "#009624",
                            color: "#009624",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                ],
            },
            {
                name: "Área",
                id: 3,
                center: [-27.790788301514944, -51.48193359375001],
                zoom: 5,
                popoverLayer: {
                    statisticDataset: this.getAPIStatiscData.bind(this),
                    fieldIdGeojson: "nome",
                    fieldIdDataset: "name",
                    fieldTitle: "nome",
                    datasetCallback: this.getAPIChoroplethData.bind(this)
                },
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/api/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: "white",
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf",
                        },
                        styleLimit: {
                            weight: 0.5,
                            opacity: 1,
                            color: 'black'
                        },
                        idField: "nome",
                        main: true,
                    }
                ],
                themeLayers: [
                    /* {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        datasetCallback: this.getAPIHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 0,
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getAPIHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 1,
                    }, */
                    {
                        name: "Tendência de casos",
                        attributeName: "tendencyCases",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethTendency",
                        mapValues: this.getTrendCasesMapValues(),
                        datasetCallback: this.getAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 8,
                    },
                    {
                        name: "Tendência de óbitos",
                        attributeName: "tendencyDeaths",
                        attributeNameSecondary: "deaths",
                        type: "choroplethTendency",
                        mapValues: this.getTrendDeathsMapValues(),
                        datasetCallback: this.getAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 7,
                    },
                    {
                        name: "Taxa de crescimento de casos",
                        attributeName: "nrDiasDobraCasos",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethRate",
                        rate: [14, 30, 50],
                        datasetCallback: this.getAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 2,
                    },
                    {
                        name: "Taxa de crescimento de óbitos",
                        attributeName: "nrDiasDobraMortes",
                        attributeNameSecondary: "deaths",
                        rate: [14, 30, 50],
                        datasetCallback: this.getAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        type: "choroplethRate",
                        id: 3,
                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 4,
                        datasetCallback: this.getAPICircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de casos",
                        scaleFactor: 0.00015,
                        scaleLenged: [100000, 1500000, 3000000],
                        cicleStyle: {
                            fillColor: "#CF1111",
                            color: "#cf1111",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getAPICircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de óbitos",
                        type: "circles",
                        id: 5,
                        scaleFactor: 0.015,
                        scaleLenged: [2000, 10000, 20000],
                        cicleStyle: {
                            fillColor: "#555555",
                            color: "#555555",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    /* {
                        name: "Número de recuperados",
                        attributeName: "totalRecovered",
                        datasetCallback: this.getAPICircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        type: "circles",
                        id: 6,
                        popupAttributeTitle: "Número de recuperados",
                        scaleFactor: 0.0015,
                        scaleLenged: [10000, 50000, 100000],
                        cicleStyle: {
                            fillColor: "#009624",
                            color: "#009624",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    }, */
                ],
            },
            {
                name: "Subárea",
                id: 4,
                center: [-27.790788301514944, -51.48193359375001],
                zoom: 5,
                popoverLayer: {
                    statisticDataset: this.getSAPIStatiscData.bind(this),
                    fieldIdGeojson: "nome",
                    fieldIdDataset: "name",
                    fieldTitle: "nome",
                    datasetCallback: this.getSAPIChoroplethData.bind(this)
                },
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/sapi/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: "white",
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf",
                        },
                        styleLimit: {
                            weight: 0.5,
                            opacity: 1,
                            color: 'black'
                        },
                        idField: "nome",
                        main: true,
                    }
                ],
                themeLayers: [
                    /* {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        datasetCallback: this.getSAPIHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 0,
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getSAPIHeatData.bind(this),
                        loadTimeIntervalCallback: this.setHeatTimeInterval.bind(this),
                        type: "heat",
                        id: 1,
                    }, */
                    {
                        name: "Tendência de casos",
                        attributeName: "tendencyCases",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethTendency",
                        mapValues: this.getTrendCasesMapValues(),
                        datasetCallback: this.getSAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 8,
                    },
                    {
                        name: "Tendência de óbitos",
                        attributeName: "tendencyDeaths",
                        attributeNameSecondary: "deaths",
                        type: "choroplethTendency",
                        mapValues: this.getTrendDeathsMapValues(),
                        datasetCallback: this.getSAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 7,
                    },
                    {
                        name: "Taxa de crescimento de casos",
                        attributeName: "nrDiasDobraCasos",
                        attributeNameSecondary: "totalCases",
                        type: "choroplethRate",
                        rate: [14, 30, 50],
                        datasetCallback: this.getSAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        id: 2,
                    },
                    {
                        name: "Taxa de crescimento de óbitos",
                        attributeName: "nrDiasDobraMortes",
                        attributeNameSecondary: "deaths",
                        rate: [14, 30, 50],
                        datasetCallback: this.getSAPIChoroplethData.bind(this),
                        loadTimeIntervalCallback: this.setChoroplethTimeInterval.bind(this),
                        type: "choroplethRate",
                        id: 3,
                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 4,
                        datasetCallback: this.getSAPICircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de casos",
                        scaleFactor: 0.00015,
                        scaleLenged: [100000, 1500000, 3000000],
                        cicleStyle: {
                            fillColor: "#CF1111",
                            color: "#cf1111",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        datasetCallback: this.getSAPICircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        popupAttributeTitle: "Número de óbitos",
                        type: "circles",
                        id: 5,
                        scaleFactor: 0.015,
                        scaleLenged: [2000, 10000, 20000],
                        cicleStyle: {
                            fillColor: "#555555",
                            color: "#555555",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    },
                    /* {
                        name: "Número de recuperados",
                        attributeName: "totalRecovered",
                        datasetCallback: this.getSAPICircleData.bind(this),
                        loadTimeIntervalCallback: this.setCircleTimeInterval.bind(this),
                        type: "circles",
                        id: 6,
                        popupAttributeTitle: "Número de recuperados",
                        scaleFactor: 0.0015,
                        scaleLenged: [10000, 50000, 100000],
                        cicleStyle: {
                            fillColor: "#009624",
                            color: "#009624",
                            weight: 1,
                            fillOpacity: 0.3,
                            opacity: 0.3,
                        },
                    }, */
                ],
            },
        ];
    }
}
