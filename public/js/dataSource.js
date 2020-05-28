class DataSource {
    constructor(newOptions) {
        this.options = {
            dataLocationId: null
        }
        this.setOptions(newOptions)
        this.setLocationName('Brasil')
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    setDataTimeInterval(timeInterval) {
        this.options.dataTimeInterval = [
            new Date(timeInterval[0]).getTime(),
            new Date(timeInterval[1]).getTime()
        ]
    }

    setCurrentLayer(layer) {
        if(!layer){
            this.setLocationName('Brasil')
            this.setLocationLevel(null)
            this.setLocationId(null)
            return
        }
        if (layer.properties["CD_GEOCMU"]) {
            this.setLocationName(layer.properties.NM_MUNICIP)
            this.setLocationLevel('city')
            this.setLocationId(layer.properties["CD_GEOCMU"])
        } else {
            this.setLocationName(layer.properties.NM_ESTADO)
            this.setLocationLevel('state')
            this.setLocationId(layer.properties["CD_GEOCUF"])
        }
    }

    setLocationLevel(level) {
        this.options.locationLevel = level
    }

    setLocationName(name) {
        this.options.locationName = name
    }

    getLocationName() {
        return this.options.locationName
    }

    setLocationId(id) {
        this.options.locationId = id
    }

    isCountry() {
        return !(this.options.locationId && this.options.locationLevel)
    }

    getQueryLocationId() {
        return `location=${this.options.locationLevel}&id=${this.options.locationId}`
    }

    getQueryTime() {
        return `startDate=${this.options.dataTimeInterval[0]}&endDate=${this.options.dataTimeInterval[1]}`
    }

    getUrl() {
        if (this.isCountry()) {
            return `${window.location.origin}/api/information/country?${this.getQueryTime()}`
        }
        else {
            return `${window.location.origin}/api/information?${this.getQueryLocationId()}&${this.getQueryTime()}`
        }
    }

    getStatusData(cb) {
        httpGetAsync(this.getUrl(), (data) => {
            cb(JSON.parse(data), this.getLocationName())
        })
    }

    getBarChartData(cb) {
        httpGetAsync(this.getUrl(), (data) => {
            cb(JSON.parse(data))
        })
    }

    getStateThemeData(themeType, cb) {
        var url
        var options = {}
        if (themeType == 'heat') {
            url = `${window.location.origin}/api/maptheme/heat?location=city&${this.getQueryTime()}`
        } else if (themeType == 'choropleth') {
            url = `${window.location.origin}/api/maptheme/choropleth?location=state&${this.getQueryTime()}`
        } else if (themeType == 'circles') {
            url = `${window.location.origin}/api/maptheme/circle?location=state&${this.getQueryTime()}`
        }
        if (!url) return
        httpGetAsync(url, function (data) {
            cb(JSON.parse(data))
        })
    }

    getCitiesThemeData(themeType, cb) {
        var url
        var options = {}
        if (themeType == 'heat') {
            url = `${window.location.origin}/api/maptheme/heat?location=city&${this.getQueryTime()}`
        } else if (themeType == 'choropleth') {
            url = `${window.location.origin}/api/maptheme/choropleth?location=city&${this.getQueryTime()}`
        } else if (themeType == 'circles') {
            url = `${window.location.origin}/api/maptheme/circle?location=city&${this.getQueryTime()}`
        }
        if (!url) return
        httpGetAsync(url, function (data) {
            cb(JSON.parse(data))
        })
    }

    getThemeData(layerId, themeType, cb) {
        if (layerId === 0) {
            this.getStateThemeData(themeType, cb)
        } else if (layerId == 1) {
            this.getCitiesThemeData(themeType, cb)
        }
    }

    getMapLayer(layerId) {
        var layers = this.getAllLayers()
        for (var i = layers.length; i--;) {
            if (layers[i].id !== layerId) continue
            return layers[i]
        }
    }

    getThemeLayers(layerId) {
        var layers = this.getAllLayers()
        for (var i = layers.length; i--;) {
            if (layers[i].id == layerId) {
                return layers[i].themeLayers
            }

        }
    }

    getThemeLayer(layerId) {
        var layers = this.getAllLayers()
        for (var i = layers.length; i--;) {
            if (layers[i].id !== layerId) continue
            return layers[i].themeLayers
        }
    }

    getMapLayerNames() {
        return this.getAllLayers().map((data) => {
            return {
                name: data.name,
                id: data.id
            }
        })
    }

    getAllLayers() {
        return [
            {
                name: "Estados",
                id: 0,
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: 'white',
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf"
                        },
                        idField: 'CD_GEOCUF',
                        main: true

                    }
                ],
                themeLayers: [
                    {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        type: "heat",
                        id: 0
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        type: "heat",
                        id: 1
                    },
                    {
                        name: "Taxa de crescimento de casos",
                        attributeName: "nrDiasDobraCasos",
                        type: "choropleth",
                        id: 2

                    },
                    {
                        name: "Taxa de crescimento de óbitos",
                        attributeName: "nrDiasDobraMortes",
                        type: "choropleth",
                        id: 3

                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 4,
                        attributeLabel: "NM_ESTADO",
                        scaleFactor: 0.003,
                        scaleLenged: [10000, 50000, 100000]

                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        attributeLabel: "NM_ESTADO",
                        type: "circles",
                        id: 5,
                        attributeLabel: "state",
                        scaleFactor: 0.003,
                        scaleLenged: [10000, 50000, 100000]

                    }

                ]
            },
            {
                name: "Municípios",
                id: 1,
                mapLayers: [
                    {
                        url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: 'black'
                        },
                        idField: 'CD_GEOCUF'

                    },
                    {
                        url: `${window.location.origin}/api/layer/tile/city/{z}/{x}/{y}.pbf`,
                        style: {
                            weight: 1,
                            opacity: 0.7,
                            color: 'white',
                            fill: true,
                            fillOpacity: 0.7,
                            fillColor: "#cfcfcf"
                        },
                        idField: 'CD_GEOCMU',
                        main: true
                    }

                ],
                themeLayers: [
                    {
                        name: "Mapa de calor de casos",
                        attributeName: "totalCases",
                        type: "heat",
                        id: 6
                    },
                    {
                        name: "Mapa de calor de óbitos",
                        attributeName: "deaths",
                        type: "heat",
                        id: 7
                    },
                    {
                        name: "Taxa de crescimento de casos",
                        attributeName: "nrDiasDobraCasos",
                        type: "choropleth",
                        id: 8
                    },
                    {
                        name: "Taxa de crescimento de óbitos",
                        attributeName: "nrDiasDobraMortes",
                        type: "choropleth",
                        id: 9
                    },
                    {
                        name: "Número de casos",
                        attributeName: "totalCases",
                        type: "circles",
                        id: 10,
                        attributeLabel: "city",
                        scaleFactor: 0.003,
                        scaleLenged: [10000, 50000, 100000],
                    },
                    {
                        name: "Número de óbitos",
                        attributeName: "deaths",
                        type: "circles",
                        attributeLabel: "city",
                        id: 11,
                        scaleFactor: 0.05,
                        scaleLenged: [500, 5000, 10000],
                    },

                ]
            }
        ]
    }
}