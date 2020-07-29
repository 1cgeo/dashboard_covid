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

const DAY_API_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "cidades_api.csv"
);

const WEEK_API_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "cidades_api_semana.csv"
);

const DAY_SAPI_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "cidades_sapi.csv"
);

const WEEK_SAPI_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "cidades_sapi_semana.csv"
);

const DAY_REGIONS_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "estados_regiao.csv"
);

const WEEK_REGIONS_FILE_PATH = path.join(
    __dirname,
    "..",
    "data",
    "covid19br",
    "estados_regiao_semana.csv"
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

var dayApi;
csv()
    .fromFile(DAY_API_FILE_PATH)
    .then(function (jsonData) {
        dayApi = jsonData;
    });

var weekApi;
csv()
    .fromFile(WEEK_API_FILE_PATH)
    .then(function (jsonData) {
        weekApi = jsonData;
    });

var daySapi;
csv()
    .fromFile(DAY_SAPI_FILE_PATH)
    .then(function (jsonData) {
        daySapi = jsonData;
    });

var weekSapi;
csv()
    .fromFile(WEEK_SAPI_FILE_PATH)
    .then(function (jsonData) {
        weekSapi = jsonData;
    });

var dayRegions;
csv()
    .fromFile(DAY_REGIONS_FILE_PATH)
    .then(function (jsonData) {
        dayRegions = jsonData;
    });

var weekRegions;
csv()
    .fromFile(WEEK_REGIONS_FILE_PATH)
    .then(function (jsonData) {
        weekRegions = jsonData;
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

function getDataSource(location, groupData) {
    if (groupData === 'day') {
        switch (location) {
            case 'city':
                return dadosCidades.slice()
            case 'state':
                return dadosEstados.slice()
            case 'regions':
                return dayRegions.slice()
            case 'api':
                return dayApi.slice()
            case 'sapi':
                return daySapi.slice()
            case 'country':
                return dadosBrasil.slice()
            default:
                return null
        }
    }
    switch (location) {
        case 'city':
            return weekCities.slice()
        case 'state':
            return weekStates.slice()
        case 'regions':
            return weekRegions.slice()
        case 'api':
            return weekApi.slice()
        case 'sapi':
            return weekSapi.slice()
        case 'country':
            return weekCountry.slice()
        default:
            return null
    }
}

module.exports.getCircleThemeData = (location, cb) => {
    cb({
        day: this.getCircleThemeDayData(location),
        week: this.getCircleThemeWeekData(location)
    });
}

module.exports.getCircleThemeDayData = (location) => {
    let dataSource = getDataSource(location, "day")
    let geojson = getGeoJsonCollectionTemplate();
    geojson.features = dataSource.map((info) => {
        let feat = getFeaturePointTemplate();
        feat.geometry.coordinates =
            location === "city" ? [info.centroid_long, info.centroid_lat] : [info.CENTROID_X, info.CENTROID_Y];
        feat.properties.totalCases = info.totalCases;
        feat.properties.deaths = info.deaths;
        feat.properties.newCases = info.newCases;
        feat.properties.newDeaths = info.newDeaths;
        feat.properties.state = info.state;
        feat.properties.city = info.city;
        feat.properties.totalRecovered = info.totalRecovered
        feat.properties.date = info.date
        if (location === "city") {
            feat.properties.ibgeID = info.ibgeID
            feat.properties.recovered = "Sem dados"
        } else if (location === "state") {
            feat.properties.ibgeID = STATES_MAP[info.state.toLowerCase()]
            feat.properties.recovered = info.recovered
        }
        return feat
    });
    return geojson.features.length > 0 ? geojson : "";
};

module.exports.getCircleThemeWeekData = (location) => {
    let dataSource = getDataSource(location, "week")
    let geojson = getGeoJsonCollectionTemplate();
    geojson.features = dataSource.map((info) => {
        let feat = getFeaturePointTemplate();
        feat.geometry.coordinates =
            location === "city" ? [info.centroid_long, info.centroid_lat] : [info.CENTROID_X, info.CENTROID_Y];
        feat.properties.totalCases = info.totalCases;
        feat.properties.deaths = info.deaths;
        feat.properties.newCases = info.newCases;
        feat.properties.newDeaths = info.newDeaths;
        feat.properties.state = info.state;
        feat.properties.totalRecovered = info.totalRecovered
        feat.properties.city = info.city
        feat.properties.week = info.semana
        if (location === "city") {
            feat.properties.ibgeID = info.ibgeID
            feat.properties.recovered = "Sem dados"
        } else if (location === "state") {
            feat.properties.ibgeID = STATES_MAP[info.state.toLowerCase()]
            feat.properties.recovered = info.recovered
        }
        return feat
    });
    return geojson.features.length > 0 ? geojson : "";
};


module.exports.getHeatThemeData = (location, cb) => {
    cb({
        day: this.getHeatThemeDayData(location),
        week: this.getHeatThemeWeekData(location)
    });
};

module.exports.getHeatThemeDayData = (location) => {
    let dataSource = (["city", "state"].includes(location))?
        getDataSource("city", "day"): getDataSource(location, "day")
    var heatCitiesData = dataSource.map((info) => {
        if(info.CENTROID_Y && info.CENTROID_X){
            latlong = [info.CENTROID_Y, info.CENTROID_X]
        } else{
            latlong = [info.lat, info.lon]
        } 
        return {
            latlong : latlong,
            deaths: info.deaths,
            totalCases: info.totalCases,
            date: info.date,
            ibgeID: info.ibgeID,
            recovered: "Sem dados",
        };
    });
    return heatCitiesData
};

module.exports.getHeatThemeWeekData = (location) => {
    let dataSource = (["city", "state"].includes(location))?
        getDataSource("city", "week"): getDataSource(location, "week")
    var heatCitiesData = dataSource.map((info) => {
        if(info.CENTROID_Y && info.CENTROID_X){
            latlong = [info.CENTROID_Y, info.CENTROID_X]
        } else{
            latlong = [info.lat, info.lon]
        }
        return {
            latlong: latlong,
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
    let dataSource = getDataSource(location, "day")
    var choroplethStatesData = dataSource.map((info) => {
        var data = {
            nrDiasDobraCasos: info.nrDiasDobraCasos,
            nrDiasDobraMortes: info.nrDiasDobraMortes,
            date: info.date,
            totalCases: info.totalCases,
            totalRecovered: info.totalRecovered,
            shortName: info.state,
            newCases: info.newCases,
            fatalityRate: ((+info.deaths / +info.totalCases) * 100).toFixed(1),
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
    let dataSource = getDataSource(location, "week")
    var choroplethStatesData = dataSource.map((info) => {
        var data = {
            nrDiasDobraCasos: info.nrDiasDobraCasos,
            nrDiasDobraMortes: info.nrDiasDobraMortes,
            week: info.semana,
            shortName: info.state,
            totalCases: info.totalCases,
            totalRecovered: info.totalRecovered,
            newCases: info.newCases,
            deaths: info.deaths,
            fatalityRate: ((+info.deaths / +info.totalCases) * 100).toFixed(1),
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
    let dataSource = getDataSource("country", "day")
    let data = dataSource.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: info.recovered,
            totalRecovered: info.totalRecovered,
            date: info.date,
            fatalityRate: ((+info.deaths / +info.totalCases) * 100).toFixed(1),
            shortName: 'BR',
            meanCases: info.meanCases,
            meanRecovered: info.meanRecovered,
            meanDeaths: info.meanDeaths,
            totalCases_per_100k_inhabitants: info.totalCases_per_100k_inhabitants,
            deaths_per_100k_inhabitants: info.deaths_per_100k_inhabitants
        };
    });
    return data
};

module.exports.getCountryWeekInformation = () => {
    let dataSource = getDataSource("country", "week")
    let data = dataSource.map((info) => {
        return {
            deaths: info.deaths,
            totalCases: info.totalCases,
            newDeaths: info.newDeaths,
            newCases: info.newCases,
            recovered: info.recovered,
            totalRecovered: info.totalRecovered,
            shortName: 'BR',
            fatalityRate: ((+info.deaths / +info.totalCases) * 100).toFixed(1),
            week: info.semana,
            meanCases: info.meanCases,
            meanRecovered: info.meanRecovered,
            meanDeaths: info.meanDeaths,
            totalCases_per_100k_inhabitants: info.totalCases_per_100k_inhabitants,
            deaths_per_100k_inhabitants: info.deaths_per_100k_inhabitants
        };
    });
    return data
};