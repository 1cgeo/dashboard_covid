class DataSource {
    constructor(newOptions) {
        this.options = {
            dataLocationId: null,
        };
        this.heatData = null;
        this.setOptions(newOptions);
    }

    numberWithPoint(x) {
        if (x === 'Sem dados') {
            return x
        }
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    deepCopy(data){
        return JSON.parse(JSON.stringify(data))
    }

    setDataTimeInterval(timeInterval) {
        this.options.dataTimeInterval = [
            new Date(timeInterval[0]).getTime(),
            new Date(timeInterval[1]).getTime(),
        ];
    }

    getDataTimeInterval() {
        return [
            new Date(this.options.dataTimeInterval[0]).getTime(),
            new Date(this.options.dataTimeInterval[1]).getTime(),
        ];
    }

    loadAllData(cb) {
        this.getStateThemeData("circles", (data) => {
            this.setStateCircleData(data);
        });
        this.getStateThemeData("choropleth", (data) => {
            this.setStateChoroplethData(deepCopy(data));
            this.setTableStateData(deepCopy(data))
        });
        this.getCitiesThemeData("circles", (data) => {
            this.setCityCircleData(data);
        });
        this.getCitiesThemeData("choropleth", (data) => {
            this.setCityChoroplethData(deepCopy(data));
            this.setTableCityData(deepCopy(data))
        });
        this.getCitiesThemeData("heat", (data) => {
            this.setHeatData(data);
            this.getCountryDataset( async (data) => {
                this.setCountryData(data);
                this.setDataTimeInterval([
                    new Date("2020/02/24").getTime(),
                    this.getMax(
                        data.map((el) => new Date(el.date.replace(/\-/g, "/")).getTime())
                    ),
                ]);
                while(! this.stateChoroplethData){
                    await this.sleep(1000)
                }
                cb()
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getMax(items) {
        return items.reduce((acc, val) => {
            acc = acc === undefined || val > acc ? val : acc;
            return acc;
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
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        return this.countryData.slice().filter((data) => {
            var elementDate = new Date(data.date.replace(/\-/g, "/"));
            return elementDate >= startDate && elementDate <= endDate;
        });
    }

    setHeatData(data) {
        this.heatData = data;
    }

    getHeatData(data) {
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        return this.heatData.slice().filter((data) => {
            var elementDate = new Date(data.date.replace(/\-/g, "/"));
            return (elementDate.getTime() >= startDate.getTime() && elementDate.getTime() <= endDate.getTime())
        });
    }

    setStateCircleData(data) {
        this.stateCircleData = data;
    }

    getStateCircleData() {
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        var geojson = JSON.parse(JSON.stringify(this.stateCircleData));
        geojson.features = geojson.features.filter((data) => {
            var elementDate = new Date(data.properties.date.replace(/\-/g, "/"));
            return (elementDate.getTime() >= startDate.getTime() && elementDate.getTime() <= endDate.getTime())
        });
        return geojson;
    }

    setCityCircleData(data) {
        this.cityCircleData = data;
    }

    getCityCircleData() {
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        var geojson = JSON.parse(JSON.stringify(this.cityCircleData));
        geojson.features = geojson.features.filter((data) => {
            var elementDate = new Date(data.properties.date.replace(/\-/g, "/"));
            return (elementDate.getTime() >= startDate.getTime() && elementDate.getTime() <= endDate.getTime())
        });
        return geojson;
    }

    setTableStateData(data) {
        var ids = []
        var result = []
        for (var i = data.length; i--;) {
            var idx = ids.indexOf(data[i].CD_GEOCUF);
            if (idx < 0) {
                ids.push(data[i].CD_GEOCUF)
                data[i].totalCases = this.numberWithPoint(data[i].totalCases)
                data[i].deaths = this.numberWithPoint(data[i].deaths)
                data[i].deaths_per_100k_inhabitants = this.numberWithPoint(Math.floor(data[i].deaths_per_100k_inhabitants))
                data[i].totalCases_per_100k_inhabitants = this.numberWithPoint(Math.floor(data[i].totalCases_per_100k_inhabitants))
                result.push(data[i])
            } else {
                break
            }
        }
        this.tableStateData = result
    }

    getTableStateData() {
        return this.tableStateData
    }

    setTableCityData(data) {
        var ids = []
        var result = []
        for (var i = data.length; i--;) {
            var idx = ids.indexOf(data[i].CD_GEOCMU);
            if (idx < 0) {
                ids.push(data[i].CD_GEOCMU)
                data[i].totalCases = this.numberWithPoint(data[i].totalCases)
                data[i].deaths = this.numberWithPoint(data[i].deaths)
                data[i].deaths_per_100k_inhabitants = this.numberWithPoint(Math.floor(data[i].deaths_per_100k_inhabitants))
                data[i].totalCases_per_100k_inhabitants = this.numberWithPoint(Math.floor(data[i].totalCases_per_100k_inhabitants))
                result.push(data[i])
            } else {
                break
            }
        }
        this.tableCityData = result
    }

    getTableCityData() {
        return this.tableCityData
    }

    setStateChoroplethData(data) {
        this.stateChoroplethData = data;
    }

    getStateChoroplethData() {
        var listedId = [];
        var reduced = [];
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        var data = this.stateChoroplethData
        for (var i = data.length; i--;) {
            var id = data[i].CD_GEOCUF
            var elementDate = new Date(data[i].date.replace(/\-/g, "/"));
            if (listedId.indexOf(id) < 0 && (elementDate.getTime() == endDate.getTime())) {
                listedId.push(id)
                reduced.push(data[i])
            }
            if (elementDate.getTime() < endDate.getTime()) break
        }
        return {
            data: reduced,
            ids: listedId
        }
    }

    setCityChoroplethData(data) {
        this.cityChoroplethData = data;
    }

    getCityChoroplethData() {
        var listedId = [];
        var reduced = [];
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        var data = this.cityChoroplethData
        for (var i = data.length; i--;) {
            var id = data[i].CD_GEOCMU
            var elementDate = new Date(data[i].date.replace(/\-/g, "/"));
            if (listedId.indexOf(id) < 0 && (elementDate.getTime() == endDate.getTime())) {
                listedId.push(id)
                reduced.push(data[i])
            }
            if (elementDate.getTime() < endDate.getTime()) break
        }
        return {
            data: reduced,
            ids: listedId
        }
    }

    setCurrentLayer(layer) {
        if (!layer) {
            this.setLayerProperties(null);
            return;
        }
        this.setLayerProperties(layer.properties);
    }

    setLayerProperties(properties) {
        this.options.layerProperties = properties;
    }

    getLayerProperties() {
        return this.options.layerProperties;
    }

    getLocationName() {
        var layerProperties = this.getLayerProperties();
        if (!layerProperties) {
            return "Brasil";
        } else if (layerProperties["CD_GEOCMU"]) {
            return layerProperties.NM_MUNICIP;
        }
        return layerProperties.NM_ESTADO;
    }

    getFeatureId() {
        var layerProperties = this.getLayerProperties();
        return layerProperties["CD_GEOCMU"] ?
            layerProperties["CD_GEOCMU"] :
            layerProperties["CD_GEOCUF"];
    }

    getStatisticsData() {
        var layerProperties = this.getLayerProperties();
        if (!layerProperties) {
            return this.getCountryData();
        }
        var featureId = this.getFeatureId()
        var timeInterval = this.getDataTimeInterval();
        var startDate = new Date(+timeInterval[0]);
        var endDate = new Date(+timeInterval[1]);
        var data = (layerProperties.CD_GEOCMU) ? this.cityChoroplethData : this.stateChoroplethData
        return data.slice().filter((data) => {
            var id = data.CD_GEOCMU ? data.CD_GEOCMU : data.CD_GEOCUF;
            var elementDate = new Date(data.date.replace(/\-/g, "/"));
            return elementDate >= startDate && elementDate <= endDate && featureId === id;
        })
    }

    getStateThemeData(themeType, cb) {
        var url;
        var options = {};
        if (themeType == "heat") {
            url = `${window.location.origin}/api/maptheme/heat?location=city`;
        } else if (themeType == "choropleth") {
            url = `${window.location.origin}/api/maptheme/choropleth?location=state`;
        } else if (themeType == "circles") {
            url = `${window.location.origin}/api/maptheme/circle?location=state`;
        }
        if (!url) return;
        httpGetAsync(url, function (data) {
            cb(JSON.parse(data));
        });
    }

    getCountryDataset(cb) {
        httpGetAsync(`${window.location.origin}/api/information/country`, function (
            data
        ) {
            cb(JSON.parse(data));
        });
    }

    getCitiesThemeData(themeType, cb) {
        var url;
        var options = {};
        if (themeType == "heat") {
            url = `${window.location.origin}/api/maptheme/heat?location=city`;
        } else if (themeType == "choropleth") {
            url = `${window.location.origin}/api/maptheme/choropleth?location=city`;
        } else if (themeType == "circles") {
            url = `${window.location.origin}/api/maptheme/circle?location=city`;
        }
        if (!url) return;
        httpGetAsync(url, function (data) {
            cb(JSON.parse(data));
        });
    }

    getThemeData(layerId, themeType, cb) {
        if (layerId === 0) {
            this.getStateThemeData(themeType, cb);
        } else if (layerId == 1) {
            this.getCitiesThemeData(themeType, cb);
        }
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

    getTendencyMapValues(){
        return [
            {value: "Diminuindo", color: "#badee8" },
            {value: "Aproximadamente o mesmo", color: "#f2df91"},
            {value: "Crescendo 1", color: "#ffae43"},
            {value: "Crescendo 2", color: "#ff6e0b"},
            {value: "Crescendo 3", color: "#ce0a05"},
            {value: "Sem ou poucos casos", color: "#f2f2f2", default: true}
        ]
    }

    getTendencyColor(tendencyValue){
        var found = this.getTendencyMapValues().find((elem) => {
            return elem.value === tendencyValue
        })
        return found.color
    }

    getAllLayers() {
        return [{
            name: "Estados",
            id: 0,
            mapLayers: [{
                url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
                style: {
                    weight: 1,
                    opacity: 0.7,
                    color: "white",
                    fill: true,
                    fillOpacity: 0.7,
                    fillColor: "#cfcfcf",
                },
                idField: "CD_GEOCUF",
                main: true,
            },],
            themeLayers: [{
                name: "Mapa de calor de casos",
                attributeName: "totalCases",
                type: "heat",
                id: 0,
            },
            {
                name: "Mapa de calor de óbitos",
                attributeName: "deaths",
                type: "heat",
                id: 1,
            },
            {
                name: "Taxa de crescimento de casos",
                attributeName: "nrDiasDobraCasos",
                attributeNameSecondary: "totalCases",
                type: "choroplethRate",
                id: 2,
            },
            {
                name: "Taxa de crescimento de óbitos",
                attributeName: "nrDiasDobraMortes",
                attributeNameSecondary: "deaths",
                type: "choroplethRate",
                id: 3,
            },
            {
                name: "Número de casos",
                attributeName: "newCases",
                type: "circles",
                id: 4,
                attributeLabel: "NM_ESTADO",
                popupAttributeTitle: 'Número de casos',
                scaleFactor: 0.003,
                scaleLenged: [10000, 50000, 100000],
                cicleStyle: {
                    fillColor: '#CF1111',
                    color: "#cf1111",
                    weight: 1,
                    fillOpacity: 0.3,
                    opacity: 0.3
                }
            },
            {
                name: "Número de óbitos",
                attributeName: "newDeaths",
                attributeLabel: "NM_ESTADO",
                popupAttributeTitle: 'Número de óbitos',
                type: "circles",
                id: 5,
                scaleFactor: 0.03,
                scaleLenged: [500, 5000, 10000],
                cicleStyle: {
                    fillColor: '#555555',
                    color: '#555555',
                    weight: 1,
                    fillOpacity: 0.3,
                    opacity: 0.3
                }
            },
            {
                name: "Número de recuperados",
                attributeName: "recovered",
                attributeLabel: "NM_ESTADO",
                type: "circles",
                id: 6,
                popupAttributeTitle: 'Número de recuperados',
                scaleFactor: 0.003,
                scaleLenged: [10000, 50000, 100000],
                cicleStyle: {
                    fillColor: '#009624',
                    color: '#009624',
                    weight: 1,
                    fillOpacity: 0.3,
                    opacity: 0.3
                }
            },
            {
                name: "Tendência de óbitos",
                attributeName: "tendencyDeaths",
                attributeNameSecondary: "deaths",
                type: "choroplethTendency",
                mapValues: this.getTendencyMapValues(),
                id: 7,
            },
            {
                name: "Tendência de casos",
                attributeName: "tendencyCases",
                attributeNameSecondary: "totalCases",
                type: "choroplethTendency",
                mapValues: this.getTendencyMapValues(),
                id: 8,
            }
            ],
        },
        {
            name: "Municípios",
            id: 1,
            mapLayers: [{
                url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
                style: {
                    weight: 1,
                    opacity: 0.7,
                    color: "black",
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
            },
            ],
            themeLayers: [{
                name: "Mapa de calor de casos",
                attributeName: "totalCases",
                type: "heat",
                id: 0,
            },
            {
                name: "Mapa de calor de óbitos",
                attributeName: "deaths",

                type: "heat",
                id: 1,
            },
            {
                name: "Taxa de crescimento de casos",
                attributeName: "nrDiasDobraCasos",
                attributeNameSecondary: "totalCases",
                type: "choroplethRate",
                id: 2,
            },
            {
                name: "Taxa de crescimento de óbitos",
                attributeName: "nrDiasDobraMortes",
                attributeNameSecondary: "deaths",
                type: "choroplethRate",
                id: 3,
            },
            {
                name: "Número de casos",
                attributeName: "newCases",
                type: "circles",
                id: 4,
                attributeLabel: "city",
                popupAttributeTitle: 'Número de casos',
                scaleFactor: 0.003,
                scaleLenged: [10000, 50000, 100000],
                cicleStyle: {
                    fillColor: '#CF1111',
                    color: "#cf1111",
                    weight: 1,
                    fillOpacity: 0.3,
                    opacity: 0.3
                }
            },
            {
                name: "Número de óbitos",
                attributeName: "newDeaths",
                type: "circles",
                attributeLabel: "city",
                id: 5,
                popupAttributeTitle: 'Número de óbitos',
                scaleFactor: 0.03,
                scaleLenged: [500, 5000, 10000],
                cicleStyle: {
                    fillColor: '#555555',
                    color: '#555555',
                    weight: 1,
                    fillOpacity: 0.3,
                    opacity: 0.3
                }
            },
            {
                name: "Tendência de óbitos",
                attributeName: "tendencyDeaths",
                attributeNameSecondary: "deaths",
                type: "choroplethTendency",
                mapValues: this.getTendencyMapValues(),
                id: 7,
            },
            {
                name: "Tendência de casos",
                attributeName: "tendencyCases",
                attributeNameSecondary: "totalCases",
                type: "choroplethTendency",
                mapValues: this.getTendencyMapValues(),
                id: 8,
            }
            ],
        },
        ];
    }
}