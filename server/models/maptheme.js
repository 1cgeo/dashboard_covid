var csv = require("csvtojson");
const path = require("path");

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

let dadosBrasil;
csv()
  .fromFile(SUMMARY_BRASIL_FILE_PATH)
  .then(function (jsonData) {
    dadosBrasil = jsonData;
  });

let dadosEstados;
csv()
  .fromFile(SUMMARY_STATES_FILE_PATH)
  .then(function (jsonData) {
    dadosEstados = jsonData;
  });

let dadosCidades;
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

module.exports.totalDiarioBrasil = (cb) => {
  var totalBrasil = dadosBrasil.map((info) => {
    return {
      deaths: info.deaths,
      totalCases: info.totalCases,
      newDeaths: info.newDeaths,
      newCases: info.newCases,
      date: info.date,
    };
  });
  cb(totalBrasil);
};

module.exports.getChoroplethStates = (cb) => {
  var choroplethStatesData = dadosEstados.map((info) => {
    return {
      nrDiasDobraCasos: info.nrDiasDobraCasos,
      nrDiasDobraMortes: info.nrDiasDobraMortes,
      date: info.date,
      CD_GEOCUF: info.CD_GEOCUF,
    };
  });
  cb(choroplethStatesData);
};

module.exports.getCircleStates = (cb) => {
  let geojson = getGeoJsonCollectionTemplate();
  geojson.features = dadosEstados.map((info) => {
    let feat = getFeaturePointTemplate();
    feat.geometry.coordinates = [info.CENTROID_X, info.CENTROID_Y];
    feat.properties.totalCases = info.totalCases;
    feat.properties.deaths = info.deaths;
    feat.properties.state = info.state;
    feat.properties.city = info.city;
    feat.properties.date = info.date;
    return feat;
  });
  cb(geojson);
};

module.exports.getChoroplethCities = (cb) => {
  var choroplethStatesData = dadosCidades.map((info) => {
    return {
      nrDiasDobraCasos: info.nrDiasDobraCasos,
      nrDiasDobraMortes: info.nrDiasDobraMortes,
      date: info.date,
      CD_GEOCMU: info.ibgeID,
    };
  });
  cb(choroplethStatesData);
};

module.exports.getHeatCities = (cb) => {
  var heatCitiesData = dadosCidades.map((info) => {
    info.latlong = [info.lat, info.lon];
    return {
      latlong: info.latlong,
      deaths: info.deaths,
      totalCases: info.totalCases,
      date: info.date,
    };
  });
  cb(heatCitiesData);
};

module.exports.getCircleCities = (cb) => {
  let geojson = getGeoJsonCollectionTemplate();
  geojson.features = dadosCidades.map((info) => {
    info.lnglat = [info.lon, info.lat];
    let feat = getFeaturePointTemplate();
    feat.geometry.coordinates = info.lnglat;
    feat.properties.totalCases = info.totalCases;
    feat.properties.deaths = info.deaths;
    feat.properties.state = info.state;
    feat.properties.city = info.city;
    feat.properties.date = info.date;
    return feat;
  });
  cb(geojson);
};
