var dateSlider = createDateRangeSlider({
    parentId: "map-container",
    elementId: "slider-range"
})

var barChartCases = createBarChart({
    parentId: "statistic-container",
    elementId: "graph-cases",
    urlData: `${window.location.origin}/api/info/country`,
    attributeX: "date",
    attributeY: "totalCases",
    title: "Casos"
})


var barChartDeaths = createBarChart({
    parentId: "statistic-container",
    elementId: "graph-deaths",
    urlData: `${window.location.origin}/api/info/country`,
    attributeX: "date",
    attributeY: "deaths",
    title: "Mortes"
})

var covidmap = createCovidMap({
    divId: "map",
    bounds: [
        [5.7908968128719565, -33.7553522173281],
        [-35.6037187406973, -98.00339909232811]
    ],
    layers: [
        {
            name: "Estados",
            idField: 'CD_GEOCUF',
            urlVectorTile: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
            themes: [
                {
                    name: "Mapa de calor de casos",
                    attributeName: "totalCases",
                    type: "heatmap",
                    urlData: `${window.location.origin}/api/maptheme/heat/city`
                },
                {
                    name: "Mapa de calor de óbitos",
                    attributeName: "deaths",
                    type: "heatmap",
                    urlData: `${window.location.origin}/api/maptheme/heat/city`
                },
                {
                    name: "Taxa de crescimento de casos",
                    attributeName: "nrDiasDobraCasos",
                    type: "choroplethmap",
                    urlData: `${window.location.origin}/api/maptheme/choropleth/state`,
                },
                {
                    name: "Taxa de crescimento de óbitos",
                    attributeName: "nrDiasDobraMortes",
                    type: "choroplethmap",
                    urlData: `${window.location.origin}/api/maptheme/choropleth/state`
                },
                {
                    name: "Número de casos",
                    attributeName: "totalCases",
                    type: "circlemap",
                    scaleFactor: 0.003,
                    scaleLenged: [10000, 50000, 100000],
                    urlData: `${window.location.origin}/api/maptheme/circle/state`
                },
                {
                    name: "Número de óbitos",
                    attributeName: "deaths",
                    type: "circlemap",
                    scaleFactor: 0.05,
                    scaleLenged: [500, 5000, 10000],
                    urlData: `${window.location.origin}/api/maptheme/circle/state`
                },

            ]
        },
        {
            name: "Municípios",
            idField: 'CD_GEOCMU',
            urlVectorTile: `${window.location.origin}/api/layer/tile/city/{z}/{x}/{y}.pbf`,
            themes: [
                {
                    name: "Mapa de calor de casos",
                    attributeName: "totalCases",
                    type: "heatmap",
                    urlData: `${window.location.origin}/api/maptheme/heat/city`
                },
                {
                    name: "Mapa de calor de óbitos",
                    attributeName: "deaths",
                    type: "heatmap",
                    urlData: `${window.location.origin}/api/maptheme/heat/city`
                },
                {
                    name: "Taxa de crescimento de casos",
                    attributeName: "nrDiasDobraCasos",
                    type: "choroplethmap",
                    urlData: `${window.location.origin}/api/maptheme/choropleth/city`,
                },
                {
                    name: "Taxa de crescimento de óbitos",
                    attributeName: "nrDiasDobraMortes",
                    type: "choroplethmap",
                    urlData: `${window.location.origin}/api/maptheme/choropleth/city`
                },
                {
                    name: "Número de casos",
                    attributeName: "totalCases",
                    type: "circlemap",
                    scaleFactor: 0.003,
                    scaleLenged: [10000, 50000, 100000],
                    urlData: `${window.location.origin}/api/maptheme/circle/city`
                },
                {
                    name: "Número de óbitos",
                    attributeName: "deaths",
                    type: "circlemap",
                    scaleFactor: 0.05,
                    scaleLenged: [500, 5000, 10000],
                    urlData: `${window.location.origin}/api/maptheme/circle/city`
                },

            ]
        }
    ]
})