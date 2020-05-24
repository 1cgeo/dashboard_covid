var csv = require("csvtojson");
const path = require("path");

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

module.exports.getChoroplethStates = (cb) => {
  csv()
    .fromFile(SUMMARY_STATES_FILE_PATH)
    .then(function (jsonData) {
      var choroplethStatesData = jsonData.slice(1).map((info) => {
        return {
          nrDiasDobraCasos: info.nrDiasDobraCasos,
          nrDiasDobraMortes: info.nrDiasDobraMortes,
          CD_GEOCUF: info.CD_GEOCUF,
        };
      });
      cb(choroplethStatesData);
    });
};

module.exports.getCircleStates = (cb) => {
  csv()
    .fromFile(SUMMARY_STATES_FILE_PATH)
    .then(function (jsonData) {
      let geojson = getGeoJsonCollectionTemplate();
      geojson.features = jsonData.slice(1).map((info) => {
        let feat = getFeaturePointTemplate();
        feat.geometry.coordinates = [info.CENTROID_X, info.CENTROID_Y];
        feat.properties.totalCases = info.totalCases;
        feat.properties.deaths = info.deaths;
        feat.properties.state = info.state;
        feat.properties.city = info.city;
        return feat;
      });
      cb(geojson);
    });
};

module.exports.getChoroplethCities = (cb) => {
  csv()
    .fromFile(SUMMARY_CITIES_FILE_PATH)
    .then(function (jsonData) {
      var choroplethStatesData = jsonData.slice(1).map((info) => {
        return {
          nrDiasDobraCasos: info.nrDiasDobraCasos,
          nrDiasDobraMortes: info.nrDiasDobraMortes,
          CD_GEOCMU: info.ibgeID,
        };
      });
      cb(choroplethStatesData);
    });
};

module.exports.getHeatCities = (cb) => {
  csv()
    .fromFile(SUMMARY_CITIES_FILE_PATH)
    .then(function (infoDeatilsObj) {
      var heatCitiesData = infoDeatilsObj.map((info) => {
        info.latlong = [info.lat, info.lon];
        return {
          latlong: info.latlong,
          deaths: info.deaths,
          totalCases: info.totalCases,
        };
      });
      cb(heatCitiesData);
    });
};

module.exports.getCircleCities = (cb) => {
  csv()
    .fromFile(SUMMARY_CITIES_FILE_PATH)
    .then(function (infoDeatilsObj) {
      let geojson = getGeoJsonCollectionTemplate();
      geojson.features = infoDeatilsObj.map((info) => {
        info.lnglat = [info.lon, info.lat];
        let feat = getFeaturePointTemplate();
        feat.geometry.coordinates = info.lnglat;
        feat.properties.totalCases = info.totalCases;
        feat.properties.deaths = info.deaths;
        feat.properties.state = info.state;
        feat.properties.city = info.city;
        return feat;
      });
      cb(geojson);
    });
};
