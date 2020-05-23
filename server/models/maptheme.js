var csv = require("csvtojson");
const path = require("path");

const SUMMARY_STATES_FILE_PATH = path.join(
  __dirname,
  "..",
  "data",
  "covid19br",
  "cases-brazil-total.csv"
);
//const DETAILED_STATES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'cases-brazil-states.csv');
const SUMMARY_CITIES_FILE_PATH = path.join(
  __dirname,
  "..",
  "data",
  "covid19br",
  "cases-brazil-cities.csv"
);
//const DETAILED_CITIES_FILE_PATH = path.join(__dirname, '..', 'data', 'covid19br', 'cases-brazil-cities-time.csv');
const GPS_CITIES_FILE_PATH = path.join(
  __dirname,
  "..",
  "data",
  "covid19br",
  "gps_cities.csv"
);
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

const CAPITAL_LONGLAT = {
  12: [-70.47328292677747, -9.212885649935345],
  27: [-36.62493568258749, -9.513863003221216],
  16: [-51.95591825155354, 1.4433194100864792],
  13: [-64.65314125809812, -4.1541774962084865],
  29: [-41.720938911070434, -12.475023160706591],
  23: [-39.61569434441216, -5.093345341909123],
  53: [-47.797360710672436, -15.78069237206831],
  32: [-40.671055018320395, -19.575176278904788],
  52: [-49.623613836840505, -16.042226540338994],
  21: [-45.279219098204535, -5.061285423346907],
  51: [-55.91214511674978, -12.948967062457939],
  50: [-54.84562553295657, -20.327310172709474],
  31: [-44.673428803067964, -18.456186829161783],
  41: [-51.616677647570015, -24.635898790420217],
  25: [-36.8326212120934, -7.121054785753983],
  15: [-53.064237017832134, -3.974791181863984],
  26: [-37.99842718037774, -8.326066015729186],
  22: [-42.96862048010858, -7.387529980730431],
  33: [-42.65238049607588, -22.18874087675864],
  24: [-36.67347663399284, -5.8396770998903405],
  43: [-53.32028520735447, -29.705680835656878],
  11: [-62.84197488942675, -10.913217855658173],
  14: [-61.399278640505194, 2.0842261078887936],
  42: [-50.47480416322352, -27.247356007160242],
  28: [-37.44389983877831, -10.584474946738762],
  35: [-48.733912679641236, -22.26347186372864],
  17: [-48.329230191330495, -10.150316285695997],
};

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
          totalCases: info.totalCases,
          deaths: info.deaths,
          CD_GEOCUF: STATES_MAP[info.state.toLowerCase()],
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
        feat.geometry.coordinates = CAPITAL_LONGLAT[
          STATES_MAP[info.state.toLowerCase()]
        ].slice();
        feat.properties.totalCases = info.totalCases;
        (feat.properties.deaths = info.deaths),
          (feat.properties.state = info.state),
          (feat.properties.city = info.city);
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
          totalCases: info.totalCases,
          deaths: info.deaths,
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
      csv()
        .fromFile(GPS_CITIES_FILE_PATH)
        .then(function (gpsCitiesObj) {
          var heatCitiesData = infoDeatilsObj.map((info) => {
            gpsCitiesObj.forEach((gps) => {
              if (+info.ibgeID == +gps.ibgeID) {
                info.latlong = [gps.lat, gps.lon];
              } else if (info.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA")) {
                info.latlong = CAPITAL_LONGLAT[
                  STATES_MAP[info.state.toLowerCase()]
                ]
                  .slice()
                  .reverse();
              }
            });
            return {
              latlong: info.latlong,
              deaths: info.deaths,
              totalCases: info.totalCases,
            };
          });
          cb(heatCitiesData);
        });
    });
};

module.exports.getCircleCities = (cb) => {
  csv()
    .fromFile(SUMMARY_CITIES_FILE_PATH)
    .then(function (infoDeatilsObj) {
      csv()
        .fromFile(GPS_CITIES_FILE_PATH)
        .then(function (gpsCitiesObj) {
          let geojson = getGeoJsonCollectionTemplate();
          geojson.features = infoDeatilsObj.map((info) => {
            gpsCitiesObj.forEach((gps) => {
              if (+info.ibgeID == +gps.ibgeID) {
                info.lnglat = [gps.lon, gps.lat];
              } else if (info.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA")) {
                info.lnglat = CAPITAL_LONGLAT[
                  STATES_MAP[info.state.toLowerCase()]
                ].slice();
              }
            });
            let feat = getFeaturePointTemplate();
            feat.geometry.coordinates = info.lnglat;
            feat.properties.totalCases = info.totalCases;
            feat.properties.deaths = info.deaths;
            (feat.properties.state = info.state),
              (feat.properties.city = info.city);
            return feat;
          });
          cb(geojson);
        });
    });
};
