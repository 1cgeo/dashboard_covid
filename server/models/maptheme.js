var csv = require("csvtojson");
const path = require("path");

const STATES_MAP = {
    ac: "12",
    al: "27",
    ap: "16",
    ba: "29",
    ce: "23",
    df: "53",
    es: "32",
    go: "52",
    ma: "21",
    mt: "51",
    ms: "50",
    mg: "31",
    pa: "15",
    pb: "25",
    pe: "26",
    pi: "22",
    rj: "33",
    rn: "24",
    rs: "43",
    rr: "14",
    sc: "42",
    sp: "35",
    se: "28",
    to: "17",
    pr: "41",
    ro: "11",
    am: "13",
};

const SUMMARY_BRASIL_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "brasil.csv"
);
const SUMMARY_STATES_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "estados.csv"
);
const SUMMARY_CITIES_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "cidades.csv"
);

const WEEK_COUNTRY_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "brasil_semana.csv"
);

const WEEK_CITIES_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "cidades_semana.csv"
);

const WEEK_STATES_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "estados_semana.csv"
);

var weekCountry;
csv()
    .fromFile(WEEK_COUNTRY_FILE_PATH)
    .then(function (jsonData) {
        weekCountry = jsonData;
    });

var weekStates;
csv()
    .fromFile(WEEK_STATES_FILE_PATH)
    .then(function (jsonData) {
        weekStates = jsonData;
    });
    
var weekCities;
csv()
    .fromFile(WEEK_CITIES_FILE_PATH)
    .then(function (jsonData) {
        weekCities = jsonData;
    });

var dadosBrasil;
csv()
    .fromFile(SUMMARY_BRASIL_FILE_PATH)
    .then(function (jsonData) {
        dadosBrasil = jsonData;
    });

var dadosEstados;
csv()
    .fromFile(SUMMARY_STATES_FILE_PATH)
    .then(function (jsonData) {
        dadosEstados = jsonData;
    });

var dadosCidades;

csv()
    .fromFile(SUMMARY_CITIES_FILE_PATH)
    .then(function (jsonData) {
        dadosCidades = jsonData;
    });

getGeoJsonCollectionTemplate = () => {
    return {
        type: "FeatureCollection",
        features: [],
    };
};

getFeaturePointTemplate = () => {
    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [],
        },
        properties: {},
    };
};

module.exports.totalDiarioCidades = (cb) => {
    var total = dadosCidades.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: "Sem dados",
            date: info.date,
        };
    });
    cb(total);
};

module.exports.totalDiarioEstados = (cb) => {
    var total = dadosEstados.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: info.recovered,
            date: info.date,
        };
    });
    cb(total);
};

module.exports.totalDiarioBrasil = (cb) => {
    var totalBrasil = dadosBrasil.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: info.recovered,
            date: info.date,
        };
    });
    cb(totalBrasil);
};

module.exports.getCircleThemeData = (location, cb) => {
    cb({
        day: this.getCircleThemeDayData(location),
        week: this.getCircleThemeWeekData(location)
    });
};

module.exports.getCircleThemeDayData = (location) => {
    let sourceData =
        location === "city" ? dadosCidades.slice() : dadosEstados.slice();
    let geojson = getGeoJsonCollectionTemplate();
    geojson.features = sourceData.map((info) => {
        let feat = getFeaturePointTemplate();
        feat.geometry.coordinates =
            location === "city" ? [info.centroid_long, info.centroid_lat] : [info.CENTROID_X, info.CENTROID_Y];
        feat.properties.totalCases = info.totalCases;
        feat.properties.deaths = info.deaths;
        feat.properties.newCases = info.newCases;
        feat.properties.newDeaths = info.newDeaths;
        feat.properties.state = info.state;
        feat.properties.city = info.city;
        feat.properties.date = info.date;
        feat.properties.ibgeID =
            location === "city" ? info.ibgeID : STATES_MAP[info.state.toLowerCase()];
        feat.properties.recovered =
            location === "city" ? "Sem dados" : info.recovered;
        return feat;
    });
    return geojson.features.length > 0 ? geojson : "";
};

module.exports.getCircleThemeWeekData = (location) => {
    let sourceData =
        location === "city" ? weekCities.slice() : weekStates.slice();
    let geojson = getGeoJsonCollectionTemplate();
    geojson.features = sourceData.map((info) => {
        let feat = getFeaturePointTemplate();
        feat.geometry.coordinates =
            location === "city" ? [info.centroid_long, info.centroid_lat] : [info.CENTROID_X, info.CENTROID_Y];
        feat.properties.totalCases = info.totalCases;
        feat.properties.deaths = info.deaths;
        feat.properties.newCases = info.newCases;
        feat.properties.newDeaths = info.newDeaths;
        feat.properties.state = info.state;
        feat.properties.city = info.city;
        feat.properties.week = info.semana
        feat.properties.ibgeID =
            location === "city" ? info.ibgeID : STATES_MAP[info.state.toLowerCase()];
        feat.properties.recovered =
            location === "city" ? "Sem dados" : info.recovered;
        return feat;
    });
    return geojson.features.length > 0 ? geojson : "";
};


module.exports.getHeatThemeData = (cb) => {
    cb({
        day: this.getHeatThemeDayData(),
        week: this.getHeatThemeWeekData()
    });
};

module.exports.getHeatThemeDayData = () => {
    var sourceData = dadosCidades.slice();
    var heatCitiesData = sourceData.map((info) => {
        return {
            latlong: [info.lat, info.lon],
            deaths: info.deaths,
            totalCases: info.totalCases,
            date: info.date,
            ibgeID: info.ibgeID,
            recovered: "Sem dados",
        };
    });
    return heatCitiesData
};

module.exports.getHeatThemeWeekData = () => {
    var sourceData = weekCities.slice();
    var heatCitiesData = sourceData.map((info) => {
        return {
            latlong: [info.lat, info.lon],
            deaths: info.deaths,
            totalCases: info.totalCases,
            week: info.semana,
            ibgeID: info.ibgeID,
            recovered: "Sem dados",
        };
    });
    return heatCitiesData
};

module.exports.getChoroplethThemeData = (location, cb) => {
    cb({
        day: this.getChoroplethThemeDayData(location),
        week: this.getChoroplethThemeWeekData(location)
    });
};

module.exports.getChoroplethThemeDayData = (location) => {
    let sourceData =
        location === "city" ? dadosCidades.slice() : dadosEstados.slice();
    var choroplethStatesData = sourceData.map((info) => {
        var data = {
            nrDiasDobraCasos: info.nrDiasDobraCasos,
            nrDiasDobraMortes: info.nrDiasDobraMortes,
            date: info.date,
            totalCases: info.totalCases,
            newCases: info.newCases,
            deaths: info.deaths,
            newDeaths: info.newDeaths,
            meanCases: info.meanCases,
            meanRecovered: info.meanRecovered,
            meanDeaths: info.meanDeaths,
            last14AvgCases: info.last14AvgCases,
            tendencyCases: info.tendencia_casos,
            tendencyDeaths: info.tendencia_obitos,
            totalCases_per_100k_inhabitants: info.totalCases_per_100k_inhabitants,
            deaths_per_100k_inhabitants: info.deaths_per_100k_inhabitants,
            id: (info.CD_GEOCUF) ? info.CD_GEOCUF : info.ibgeID
        };
        if (location === "city") {
            data.recovered = "Sem dados";
            data.CD_GEOCMU = info.ibgeID;
            data.name = info.city
            data.lat = info.centroid_lat
            data.lng = info.centroid_long
            return data;
        }
        data.name = info.nome
        data.CD_GEOCUF = info.CD_GEOCUF;
        data.recovered = info.recovered;
        data.lat = info.CENTROID_Y
        data.lng = info.CENTROID_X
        return data;
    });
    return choroplethStatesData
};

module.exports.getChoroplethThemeWeekData = (location) => {
    let sourceData =
        location === "city" ? weekCities.slice() : weekStates.slice();
    var choroplethStatesData = sourceData.map((info) => {
        var data = {
            nrDiasDobraCasos: info.nrDiasDobraCasos,
            nrDiasDobraMortes: info.nrDiasDobraMortes,
            week: info.semana,
            totalCases: info.totalCases,
            newCases: info.newCases,
            deaths: info.deaths,
            newDeaths: info.newDeaths,
            meanCases: info.meanCases,
            meanRecovered: info.meanRecovered,
            meanDeaths: info.meanDeaths,
            last14AvgCases: info.last14AvgCases,
            tendencyCases: info.tendencia_casos,
            tendencyDeaths: info.tendencia_obitos,
            totalCases_per_100k_inhabitants: info.totalCases_per_100k_inhabitants,
            deaths_per_100k_inhabitants: info.deaths_per_100k_inhabitants,
            id: (info.CD_GEOCUF) ? info.CD_GEOCUF : info.ibgeID
        };
        if (location === "city") {
            data.recovered = "Sem dados";
            data.CD_GEOCMU = info.ibgeID;
            data.name = info.city
            data.lat = info.centroid_lat
            data.lng = info.centroid_long
            return data;
        }
        data.name = info.nome
        data.CD_GEOCUF = info.CD_GEOCUF;
        data.recovered = info.recovered;
        data.lat = info.CENTROID_Y
        data.lng = info.CENTROID_X
        return data;
    });
    return choroplethStatesData
};

module.exports.getCountryInformation = (cb) => {
    cb({
        day: this.getCountryDayInformation(),
        week: this.getCountryWeekInformation()
    });
};

module.exports.getCountryDayInformation = () => {
    var sourceData = dadosBrasil.slice();
    let data = sourceData.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: info.recovered,
            date: info.date,
            meanCases: info.meanCases,
            meanRecovered: info.meanRecovered,
            meanDeaths: info.meanDeaths
        };
    });
    return data
};

module.exports.getCountryWeekInformation = () => {
    var sourceData = weekCountry.slice();
    let data = sourceData.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: info.recovered,
            week: info.semana,
            meanCases: info.meanCases,
            meanRecovered: info.meanRecovered,
            meanDeaths: info.meanDeaths
        };
    });
    return data
};