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
      date: info.date,
    };
  });
  cb(totalBrasil);
};


module.exports.getCircleThemeData = (location, startTimestamp, endTimestamp, cb) => {
  let sourceData = (location === 'city') ? dadosCidades.slice() : dadosEstados.slice();
  let geojson = getGeoJsonCollectionTemplate();
  if (startTimestamp && endTimestamp) {
    let dataFiltered = sourceData.filter((info) => {
      let elementDate = new Date(info.date.replace('-', '/'))
      let startDate = new Date(+startTimestamp)
      let endDate = new Date(+endTimestamp)
      return (startDate <= elementDate && elementDate <= endDate)
    })
    sourceData = dataFiltered
  }
  geojson.features = sourceData.map((info) => {
    let feat = getFeaturePointTemplate();
    feat.geometry.coordinates = (location === 'city') ? [info.lon, info.lat] : [info.CENTROID_X, info.CENTROID_Y];
    feat.properties.totalCases = info.totalCases;
    feat.properties.deaths = info.deaths;
    feat.properties.state = info.state;
    feat.properties.city = info.city;
    feat.properties.date = info.date;
    return feat;
  });
  (geojson.features.length > 0) ? cb(geojson) : cb();
};


module.exports.getHeatThemeData = (startTimestamp, endTimestamp, cb) => {
  var sourceData = dadosCidades.slice()
  if (startTimestamp && endTimestamp) {
    let dataFiltered = sourceData.filter((info) => {
      let elementDate = new Date(info.date.replace('-', '/'))
      let startDate = new Date(+startTimestamp)
      let endDate = new Date(+endTimestamp)
      return (startDate <= elementDate && elementDate <= endDate)
    })
    sourceData = dataFiltered
  }
  var heatCitiesData = sourceData.map((info) => {
    return {
      latlong: [info.lat, info.lon],
      deaths: info.deaths,
      totalCases: info.totalCases,
      date: info.date,
      ibgeID: info.ibgeID,
    };
  });
  cb(heatCitiesData);
};



module.exports.getChoroplethThemeData = (location, startTimestamp, endTimestamp, cb) => {
  let sourceData = (location === 'city') ? dadosCidades.slice() : dadosEstados.slice();
  if (startTimestamp && endTimestamp) {
    let dataFiltered = sourceData.filter((info) => {
      let elementDate = new Date(info.date.replace('-', '/'))
      let startDate = new Date(+startTimestamp)
      let endDate = new Date(+endTimestamp)
      return (startDate <= elementDate && elementDate <= endDate)
    })
    sourceData = dataFiltered
  }
  var choroplethStatesData = sourceData.map((info) => {
    var data = {
      nrDiasDobraCasos: info.nrDiasDobraCasos,
      nrDiasDobraMortes: info.nrDiasDobraMortes,
      date: info.date
    }
    if (location === 'city') {
      data.CD_GEOCMU = info.ibgeID
      return data
    }
    data.CD_GEOCUF = info.CD_GEOCUF
    return data
  });
  cb(choroplethStatesData);
};



module.exports.getCountryInformation = (startTimestamp, endTimestamp, cb) => {
  var sourceData = dadosBrasil.slice()
  if (startTimestamp && endTimestamp) {
    let dataFiltered = sourceData.filter((info) => {
      let elementDate = new Date(info.date.replace('-', '/'))
      let startDate = new Date(+startTimestamp)
      let endDate = new Date(+endTimestamp)
      return (startDate <= elementDate && elementDate <= endDate)
    })
    sourceData = dataFiltered
  }
  let data = sourceData.map((info) => {
    return {
      deaths: info.deaths,
      totalCases: info.totalCases,
      newDeaths: info.newDeaths,
      newCases: info.newCases,
      date: info.date,
    };
  });
  cb(data);
};



module.exports.getCityInformation = (ibgeID, startTimestamp, endTimestamp, cb) => {
  var sourceData = dadosCidades.slice()
  var resultData = []
  for (var i = sourceData.length; i--;) {
    var passed = false
    var id = +sourceData[i].ibgeID
    if (startTimestamp && endTimestamp) {
      let elementDate = new Date(sourceData[i].date.replace('-', '/'))
      let startDate = new Date(+startTimestamp)
      let endDate = new Date(+endTimestamp)
      if ((startDate <= elementDate && elementDate <= endDate) && id === +ibgeID) {
        passed = true
      }
    } else if (id === +ibgeID) {
      passed = true
    }
    if (!passed) continue
    resultData.push({
      deaths: sourceData[i].deaths,
      totalCases: sourceData[i].totalCases,
      newDeaths: sourceData[i].newDeaths,
      newCases: sourceData[i].newCases,
      date: sourceData[i].date,
      city: sourceData[i].city,
    })
  }
  cb(resultData)
};


module.exports.getStateInformation = (ibgeID, startTimestamp, endTimestamp, cb) => {
  var sourceData = dadosEstados.slice()
  var resultData = []
  for (var i = sourceData.length; i--;) {
    var passed = false
    var id = +STATES_MAP[sourceData[i].state.toLowerCase()]
    if (startTimestamp && endTimestamp) {
      let elementDate = new Date(sourceData[i].date.replace('-', '/'))
      let startDate = new Date(+startTimestamp)
      let endDate = new Date(+endTimestamp)
      if ((startDate <= elementDate && elementDate <= endDate) && id === +ibgeID) {
        passed = true
      }
    } else if (id === +ibgeID) {
      passed = true
    }
    if (!passed) continue
    resultData.push({
      deaths: sourceData[i].deaths,
      totalCases: sourceData[i].totalCases,
      newDeaths: sourceData[i].newDeaths,
      newCases: sourceData[i].newCases,
      date: sourceData[i].date,
      state: sourceData[i].state,
    })
  }
  cb(resultData)
};

