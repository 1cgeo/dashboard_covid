var csv = require("csvtojson");
const path = require('path');

const SUMMARY_STATES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'cases-brazil-total.csv');
const DETAILED_STATES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'cases-brazil-states.csv');
const SUMMARY_CITIES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'cases-brazil-cities.csv');
const DETAILED_CITIES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'cases-brazil-cities-time.csv');
const GPS_CITIES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'gps_cities.csv');
const STATES_MAP = {
    'ac': '12',
    'al': '27',
    'ap': '16',
    'ba': '29',
    'ce': '23',
    'df': '53',
    'es': '32',
    'go': '52',
    'ma': '21',
    'mt': '51',
    'ms': '50',
    'mg': '31',
    'pa': '15',
    'pb': '25',
    'pe': '26',
    'pi': '22',
    'rj': '33',
    'rn': '24',
    'rs': '43',
    'rr': '14',
    'sc': '42',
    'sp': '35',
    'se': '28',
    'to': '17',
    'pr': '41',
    'ro': '11',
    'am': '13',
}
const CAPITAL_LONGLAT = {
    ac: [-67.80000655, -9.966589336],
    al: [-35.72997441, -9.619995505],
    ap: [-51.0500212, 0.033007018],
    ba: [-38.47998743, -12.9699719],
    ce: [-38.57998132, -3.750017884],
    df: [-47.91605229, -15.78334023],
    es: [-40.36599634, -20.32399331],
    go: [-49.30002466, -16.72002724],
    ma: [-44.26599085, -2.515984681],
    mt: [56.08498519, -15.56960651],
    ms: [-54.61662521, -20.45003213],
    mg: [-43.91500452, -19.91502602],
    pa: [-48.48002303, -1.450003236],
    pb: [-34.87607117, -7.10113513],
    pe: [-34.91560551, -8.075645326],
    pi: [-42.7800092, -5.095000388],
    rj: [-43.22502079, -22.92502317],
    rn: [-35.24000431, -5.780023174],
    rs: [-51.20001205, -30.05001463],
    rr: [-60.66599756, 2.816092955],
    sc: [-48.52002059, -27.57998452],
    sp: [-46.62501998, -23.55867959],
    se: [-37.11996708, -10.90002073],
    to: [-48.2877867, -10.23773558],
    pr: [-49.3199976, -25.420013],
    ro: [-63.90001205, -8.750022767],
    am: [-60.00001754, -3.100031719]
}

getGeoJsonCollectionTemplate = () => {
    return {
        "type": "FeatureCollection",
        "features": []
    }
}

getFeaturePointTemplate = () => {
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": []
        },
        "properties": {}
    }
}

module.exports.getChoroplethStates = (cb) => {
    csv()
    .fromFile(SUMMARY_STATES_FILE_PATH)
    .then(function (jsonData) {
        var choroplethStatesData = jsonData.slice(1).map((info) => {
            return {
                totalCases: info.totalCases,
                deaths: info.deaths,
                CD_GEOCUF: STATES_MAP[info.state.toLowerCase()]
            }
        })
        cb(choroplethStatesData)
    })
}


module.exports.getCircleStates = (cb) => {
    csv()
        .fromFile(SUMMARY_STATES_FILE_PATH)
        .then(function (jsonData) {
            let geojson = getGeoJsonCollectionTemplate()
            geojson.features = jsonData.slice(1).map((info) => {
                let feat = getFeaturePointTemplate()
                feat.geometry.coordinates = CAPITAL_LONGLAT[info.state.toLowerCase()].slice()
                feat.properties.totalCases = info.totalCases
                feat.properties.deaths = info.deaths,
                feat.properties.state = info.state,
                feat.properties.city = info.city
                return feat
            })
            cb(geojson)
        })
}

module.exports.getChoroplethCities = (cb) => {
    csv()
    .fromFile(SUMMARY_CITIES_FILE_PATH)
    .then(function (jsonData) {
        var choroplethStatesData = jsonData.slice(1).map((info) => {
            return {
                totalCases: info.totalCases,
                deaths: info.deaths,
                CD_GEOCMU: info.ibgeID
            }
        })
        cb(choroplethStatesData)
    })

}

module.exports.getHeatCities = (cb) => {
    csv().fromFile(SUMMARY_CITIES_FILE_PATH).then(function (infoDeatilsObj) {
        csv().fromFile(GPS_CITIES_FILE_PATH).then(function (gpsCitiesObj) {
            var heatCitiesData = infoDeatilsObj.map((info) => {
                gpsCitiesObj.forEach((gps) => {
                    if (+info.ibgeID == +gps.ibgeID) {
                        info.latlong = [gps.lat, gps.lon]
                    }
                    else if (info.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA")) {
                        info.latlong = CAPITAL_LONGLAT[info.state.toLowerCase()].slice().reverse()
                    }
                })
                return {
                    latlong: info.latlong,
                    deaths: info.deaths,
                    totalCases: info.totalCases
                }
            })
            cb(heatCitiesData)
        })
    })
}

module.exports.getCircleCities = (cb) => {
    csv().fromFile(SUMMARY_CITIES_FILE_PATH).then(function (infoDeatilsObj) {
        csv().fromFile(GPS_CITIES_FILE_PATH).then(function (gpsCitiesObj) {
            let geojson = getGeoJsonCollectionTemplate()
            geojson.features = infoDeatilsObj.map((info) => {
                gpsCitiesObj.forEach((gps) => {
                    if (+info.ibgeID == +gps.ibgeID) {
                        info.lnglat = [gps.lon, gps.lat]
                    }
                    else if (info.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA")) {
                        info.lnglat = CAPITAL_LONGLAT[info.state.toLowerCase()].slice()
                    }
                })
                let feat = getFeaturePointTemplate()
                feat.geometry.coordinates = info.lnglat;
                feat.properties.totalCases = info.totalCases
                feat.properties.deaths = info.deaths
                feat.properties.state = info.state,
                feat.properties.city = info.city
                return feat
            })
            cb(geojson)
        })
    })
}

