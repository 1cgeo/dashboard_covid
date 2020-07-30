var geojsonvt = require('geojson-vt');
const vtpbf = require('vt-pbf')
const citiesGeoJSON = require('../data/geojson/cities.json')
var citiesTileIndex = geojsonvt(citiesGeoJSON)
const statesGeoJSON = require('../data/geojson/states.json')
var statesTileIndex = geojsonvt(statesGeoJSON)

const regionsGeoJSON = require('../data/geojson/regioes.json')
var regionsTileIndex = geojsonvt(regionsGeoJSON)
const APIGeoJSON = require('../data/geojson/area.json')
var APITileIndex = geojsonvt(APIGeoJSON)
const SAPIGeoJSON = require('../data/geojson/subarea.json')
var SAPITileIndex = geojsonvt(SAPIGeoJSON)

module.exports.getCitiesVectorTilePbf = (z, x, y) => {
    var tile = citiesTileIndex.getTile(z, x, y)
    if (!tile) return
    return vtpbf.fromGeojsonVt({ data: tile })
}

module.exports.getStatesVectorTilePbf = (z, x, y) => {
    var tile = statesTileIndex.getTile(z, x, y)
    if (!tile) return
    return vtpbf.fromGeojsonVt({ data: tile })
}

module.exports.getRegionsVectorTilePbf = (z, x, y) => {
    var tile = regionsTileIndex.getTile(z, x, y)
    if (!tile) return
    return vtpbf.fromGeojsonVt({ data: tile })
}

module.exports.getAPIVectorTilePbf = (z, x, y) => {
    var tile = APITileIndex.getTile(z, x, y)
    if (!tile) return
    return vtpbf.fromGeojsonVt({ data: tile })
}

module.exports.getSAPIVectorTilePbf = (z, x, y) => {
    var tile = SAPITileIndex.getTile(z, x, y)
    if (!tile) return
    return vtpbf.fromGeojsonVt({ data: tile })
}
/* 
module.exports.getStateGeoJSON = (id) => {
    for (var i = statesGeoJSON.features.length; i--;) {
        if (statesGeoJSON.features[i].properties["CD_GEOCUF"] != id) continue
        return statesGeoJSON.features[i]
    }
}

module.exports.getCityGeoJSON = (id) => {
    for (var i = citiesGeoJSON.features.length; i--;) {
        if (citiesGeoJSON.features[i].properties["CD_GEOCMU"] != id) continue
        return citiesGeoJSON.features[i]
    }
} */