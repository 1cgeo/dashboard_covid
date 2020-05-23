var covidmap = createCovidMap({
    divId: "map",
    bounds: [
        [7.065995732871663, -30.13056410236547],
        [-35.113808689190826, -75.62426397706966]
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
                    attributeName: "totalCases",
                    type: "choroplethmap",
                    urlData: `${window.location.origin}/api/maptheme/choropleth/state`,
                },
                {
                    name: "Taxa de crescimento de óbitos",
                    attributeName: "deaths",
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
                    attributeName: "totalCases",
                    type: "choroplethmap",
                    urlData: `${window.location.origin}/api/maptheme/choropleth/city`,
                },
                {
                    name: "Taxa de crescimento de óbitos",
                    attributeName: "deaths",
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