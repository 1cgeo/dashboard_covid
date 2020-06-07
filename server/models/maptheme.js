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
  let sourceData =
    location === "city" ? dadosCidades.slice() : dadosEstados.slice();
  let geojson = getGeoJsonCollectionTemplate();
  geojson.features = sourceData.map((info) => {
    let feat = getFeaturePointTemplate();
    feat.geometry.coordinates =
      location === "city"
        ? [info.centroid_long, info.centroid_lat]
        : [info.CENTROID_X, info.CENTROID_Y];
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
  geojson.features.length > 0 ? cb(geojson) : cb();
};

module.exports.getHeatThemeData = (cb) => {
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
  cb(heatCitiesData);
};

module.exports.getChoroplethThemeData = (location, cb) => {
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
    };
    if (location === "city") {
      data.recovered = "Sem dados";
      data.CD_GEOCMU = info.ibgeID;
      return data;
    }
    data.CD_GEOCUF = info.CD_GEOCUF;
    data.recovered = info.recovered;
    return data;
  });
  cb(choroplethStatesData);
};

module.exports.getCountryInformation = (cb) => {
  var sourceData = dadosBrasil.slice();
  let data = sourceData.map((info) => {
    return {
      deaths: info.deaths,
      totalCases: info.totalCases,
      newDeaths: info.newDeaths,
      newCases: info.newCases,
      recovered: info.recovered,
      date: info.date,
    };
  });
  cb(data);
};

module.exports.getCityInformation = (ibgeID, cb) => {
  var sourceData = dadosCidades.slice();
  var resultData = [];
  for (var i = sourceData.length; i--; ) {
    var id = +sourceData[i].ibgeID;
    if (!(id === +ibgeID)) continue;
    resultData.push({
      deaths: sourceData[i].deaths,
      totalCases: sourceData[i].totalCases,
      newDeaths: sourceData[i].newDeaths,
      newCases: sourceData[i].newCases,
      date: sourceData[i].date,
      recovered: "Sem dados",
      city: sourceData[i].city,
    });
  }
  cb(resultData);
};

module.exports.getStateInformation = (
  ibgeID,
  startTimestamp,
  endTimestamp,
  cb
) => {
  var sourceData = dadosEstados.slice();
  var resultData = [];
  for (var i = sourceData.length; i--; ) {
    var id = +STATES_MAP[sourceData[i].state.toLowerCase()];
    if (!(id === +ibgeID)) continue;
    resultData.push({
      deaths: sourceData[i].deaths,
      totalCases: sourceData[i].totalCases,
      newDeaths: sourceData[i].newDeaths,
      newCases: sourceData[i].newCases,
      date: sourceData[i].date,
      recovered: sourceData[i].recovered,
      state: sourceData[i].state,
    });
  }
  cb(resultData);
};
