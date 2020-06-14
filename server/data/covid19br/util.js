const https = require("https");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const epi = require("./epidemiological-week");

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

const CENTROID = {
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

const download = (url, dest, cb) => {
  const file = fs.createWriteStream(dest);
  console.log(`Download de ${dest} iniciado.`);
  const request = https
    .get(url, function (response) {
      response.pipe(file);
      file.on("finish", function () {
        console.log(`Download de ${dest} FINALIZADO!`);
        file.close(cb); // close() is async, call cb after close completes.
      });
    })
    .on("error", function (err) {
      // Handle errors
      fs.unlinkSync(dest); // Delete the file async. (But we don't check the result)
      console.log(`Download de ${dest} com ERRO!`);
      if (cb) cb(err.message);
    });
};

const calcSemana = (date) => {
  return epi.calculate(date).week;
};

const csv_brasil = (file, output) => {
  console.log("Preparo do CSV do Brasil iniciado.");
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (data.state == "TOTAL") {
        data.totalRecovered = data.recovered > 0 ? +data.recovered : 0;
        dataArray.push(data);
      }
    })
    .on("end", function () {
      dataArray[0].recovered = +dataArray[0].totalRecovered;
      for (var i = dataArray.length - 1; i >= 1; i--) {
        dataArray[i].recovered =
          +dataArray[i].recovered - dataArray[i - 1].recovered;
      }

      for (var i = 0; i < dataArray.length; i++) {
        if (i < 6) {
          dataArray[i].meanCases = +dataArray[i].newCases;
          dataArray[i].meanDeaths = +dataArray[i].newDeaths;
          dataArray[i].meanRecovered = +dataArray[i].recovered;
        } else {
          dataArray[i].meanCases =
            (+dataArray[i].newCases +
              +dataArray[i - 1].newCases +
              +dataArray[i - 2].newCases +
              +dataArray[i - 3].newCases +
              +dataArray[i - 4].newCases +
              +dataArray[i - 5].newCases +
              +dataArray[i - 6].newCases) /
            7.0;
          dataArray[i].meanDeaths =
            (+dataArray[i].newDeaths +
              +dataArray[i - 1].newDeaths +
              +dataArray[i - 2].newDeaths +
              +dataArray[i - 3].newDeaths +
              +dataArray[i - 4].newDeaths +
              +dataArray[i - 5].newDeaths +
              +dataArray[i - 6].newDeaths) /
            7.0;

          dataArray[i].meanRecovered =
            (+dataArray[i].recovered +
              +dataArray[i - 1].recovered +
              +dataArray[i - 2].recovered +
              +dataArray[i - 3].recovered +
              +dataArray[i - 4].recovered +
              +dataArray[i - 5].recovered +
              +dataArray[i - 6].recovered) /
            7.0;
        }
      }

      const fields = Object.keys(dataArray[0]);
      const opts = { fields };
      const parser = new Parser(opts);
      const result = parser.parse(dataArray);

      fs.writeFileSync(output, result);
      console.log("Preparo do CSV do Brasil FINALIZADO!");
      csv_brasil_semana(output, `${output.split(".")[0]}_semana.csv`);
    });
};

const csv_brasil_semana = (file, output) => {
  console.log("Preparo do CSV do Brasil por Semana iniciado.");
  const data = {};
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (d) {
      let semana = calcSemana(d.date);
      if (!(semana in data)) {
        data[semana] = {};
        data[semana].semana = semana;
        data[semana].dias_semana = 0;
        data[semana].country = d.country;
        data[semana].state = d.state;
        data[semana].city = d.city;
        data[semana].newDeaths = 0;
        data[semana].newCases = 0;
        data[semana].recovered = 0;
        data[semana].meanCases = 0;
        data[semana].meanDeaths = 0;
        data[semana].meanRecovered = 0;
      }

      data[semana].dias_semana += 1;
      data[semana].newDeaths += +d.newDeaths;
      data[semana].deaths = +d.deaths;
      data[semana].newCases += +d.newCases;
      data[semana].totalCases = +d.totalCases;
      data[semana].deaths_per_100k_inhabitants = +d.deaths_per_100k_inhabitants;
      data[
        semana
      ].totalCases_per_100k_inhabitants = +d.totalCases_per_100k_inhabitants;
      data[semana].deaths_by_totalCases = +d.deaths_by_totalCases;
      data[semana].recovered += +d.recovered;
      data[semana].totalRecovered = +d.totalRecovered;
      data[semana].meanCases =
        (+d.meanCases +
          (data[semana].dias_semana - 1) * +data[semana].meanCases) /
        data[semana].dias_semana;
      data[semana].meanDeaths =
        (+d.meanDeaths +
          (data[semana].dias_semana - 1) * +data[semana].meanDeaths) /
        data[semana].dias_semana;
      data[semana].meanRecovered =
        (+d.meanRecovered +
          (data[semana].dias_semana - 1) * +data[semana].meanRecovered) /
        data[semana].dias_semana;
    })
    .on("end", function () {
      const dataArray = [];
      for (var key in data) {
        dataArray.push(data[key]);
      }

      const fields = Object.keys(dataArray[0]);
      const opts = { fields };
      const parser = new Parser(opts);
      const result = parser.parse(dataArray);

      fs.writeFileSync(output, result);
      console.log("Preparo do CSV do Brasil por Semana FINALIZADO!");
    });
};

const modify_csv_estado = (file, output) => {
  console.log("Preparo do CSV dos Estados iniciado.");
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (data.state != "TOTAL") {
        data.CD_GEOCUF = STATES_MAP[data.state.toLowerCase()];
        data.CENTROID_X = +CENTROID[data.CD_GEOCUF][0];
        data.CENTROID_Y = +CENTROID[data.CD_GEOCUF][1];
        data.totalRecovered = data.recovered > 0 ? +data.recovered : 0;
        dataArray.push(data);
      }
    })
    .on("end", function () {
      const negativoCases = {};
      const negativoDeaths = {};
      for (var i = 0; i < dataArray.length; i++) {
        if (dataArray[i].state in negativoCases) {
          dataArray[i].newCases =
            +dataArray[i].newCases - negativoCases[dataArray[i].state];
          negativoCases[dataArray[i].state] = 0;
          delete negativoCases[dataArray[i].state];
        }

        if (dataArray[i].newCases < 0) {
          if (!(dataArray[i].state in negativoCases)) {
            negativoCases[dataArray[i].state] = 0;
          }
          negativoCases[dataArray[i].state] =
            +negativoCases[dataArray[i].state] - dataArray[i].newCases;
          dataArray[i].newCases = 0;
        }

        if (dataArray[i].state in negativoDeaths) {
          dataArray[i].newDeaths =
            +dataArray[i].newDeaths - negativoDeaths[dataArray[i].state];
          negativoDeaths[dataArray[i].state] = 0;
          delete negativoDeaths[dataArray[i].state];
        }

        if (dataArray[i].newDeaths < 0) {
          if (!(dataArray[i].state in negativoDeaths)) {
            negativoDeaths[dataArray[i].state] = 0;
          }
          negativoDeaths[dataArray[i].state] =
            +negativoDeaths[dataArray[i].state] - dataArray[i].newDeaths;
          dataArray[i].newDeaths = 0;
        }
      }

      dataArray[0].recovered = dataArray[0].totalRecovered;
      for (var i = dataArray.length - 1; i >= 1; i--) {
        let rec = 0;
        for (var j = i - 1; j >= 0; j--) {
          if (dataArray[i].state == dataArray[j].state) {
            rec = +dataArray[i].recovered - dataArray[j].recovered;
            break;
          }
        }
        dataArray[i].recovered = rec > 0 ? +rec : 0;
      }

      const last7Cases = {};
      const last7Deaths = {};
      const last7Recovered = {};
      const average = (list) =>
        list.reduce((prev, curr) => +prev + +curr) / list.length;

      for (var i = 0; i < dataArray.length; i++) {
        if (!(dataArray[i].state in last7Cases)) {
          last7Cases[dataArray[i].state] = [];
        }
        last7Cases[dataArray[i].state].push(dataArray[i].newCases);
        if (last7Cases[dataArray[i].state].length > 7) {
          last7Cases[dataArray[i].state].shift();
        }

        if (last7Cases[dataArray[i].state].length < 7) {
          dataArray[i].meanCases = +dataArray[i].newCases;
        } else {
          dataArray[i].meanCases = average(last7Cases[dataArray[i].state]);
        }

        if (!(dataArray[i].state in last7Deaths)) {
          last7Deaths[dataArray[i].state] = [];
        }
        last7Deaths[dataArray[i].state].push(dataArray[i].newDeaths);
        if (last7Deaths[dataArray[i].state].length > 7) {
          last7Deaths[dataArray[i].state].shift();
        }

        if (last7Deaths[dataArray[i].state].length < 7) {
          dataArray[i].meanDeaths = +dataArray[i].newDeaths;
        } else {
          dataArray[i].meanDeaths = average(last7Deaths[dataArray[i].state]);
        }

        if (!(dataArray[i].state in last7Recovered)) {
          last7Recovered[dataArray[i].state] = [];
        }
        last7Recovered[dataArray[i].state].push(dataArray[i].recovered);
        if (last7Recovered[dataArray[i].state].length > 7) {
          last7Recovered[dataArray[i].state].shift();
        }

        if (last7Recovered[dataArray[i].state].length < 7) {
          dataArray[i].meanRecovered = +dataArray[i].recovered;
        } else {
          dataArray[i].meanRecovered = average(
            last7Recovered[dataArray[i].state]
          );
        }
      }

      dataArray[0].nrDiasDobraCasos = 0;
      dataArray[0].nrDiasDobraMortes = 0;
      for (var i = dataArray.length - 1; i > 0; i--) {
        for (var j = i - 1; j >= 0; j--) {
          if (dataArray[i].state == dataArray[j].state) {
            if (dataArray[j].totalCases <= dataArray[i].totalCases / 2) {
              const date1 = new Date(dataArray[j].date);
              const date2 = new Date(dataArray[i].date);
              const diffTime = Math.abs(date2 - date1);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              dataArray[i].nrDiasDobraCasos = diffDays;
              break;
            }
          }
        }
        if (!dataArray[i].nrDiasDobraCasos) {
          dataArray[i].nrDiasDobraCasos = 0;
        }
        for (var j = i - 1; j >= 0; j--) {
          if (dataArray[i].state == dataArray[j].state) {
            if (dataArray[j].deaths <= dataArray[i].deaths / 2) {
              const date1 = new Date(dataArray[j].date);
              const date2 = new Date(dataArray[i].date);
              const diffTime = Math.abs(date2 - date1);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              dataArray[i].nrDiasDobraMortes = diffDays;
              break;
            }
          }
        }
        if (!dataArray[i].nrDiasDobraMortes) {
          dataArray[i].nrDiasDobraMortes = 0;
        }
      }

      const fields = Object.keys(dataArray[0]);
      const opts = { fields };
      const parser = new Parser(opts);
      const result = parser.parse(dataArray);

      fs.writeFileSync(output, result);
      console.log("Preparo do CSV dos Estados FINALIZADO!");
    });
};

const modify_csv_cidade = (file, coords, centroid, output) => {
  console.log("Preparo do CSV dos Municipios iniciado.");
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (
        !data.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA") &&
        data.city !== "TOTAL"
      ) {
        dataArray.push(data);
      }
    })
    .on("end", function () {
      const gpsArray = [];
      fs.createReadStream(coords)
        .pipe(csv())
        .on("data", function (data) {
          if (!data.id.includes("CASO SEM LOCALIZAÇÃO DEFINIDA")) {
            gpsArray.push(data);
          }
        })
        .on("end", function () {
          const centroidArray = [];
          fs.createReadStream(centroid)
            .pipe(csv())
            .on("data", function (data) {
              centroidArray.push(data);
            })
            .on("end", function () {
              dataArray.forEach((d) => {
                centroidArray.forEach((c) => {
                  if (+d.ibgeID == +c.ibgeID) {
                    d.centroid_lat = c.centroid_lat;
                    d.centroid_long = c.centroid_long;
                  }
                });
              });

              dataArray.forEach((d) => {
                gpsArray.forEach((g) => {
                  if (+d.ibgeID == +g.ibgeID) {
                    d.lat = g.lat;
                    d.lon = g.lon;
                  }
                });
              });

              const negativoCases = {};
              const negativoDeaths = {};
              for (var i = 0; i < dataArray.length; i++) {
                if (dataArray[i].ibgeID in negativoCases) {
                  dataArray[i].newCases =
                    +dataArray[i].newCases - negativoCases[dataArray[i].ibgeID];
                  negativoCases[dataArray[i].ibgeID] = 0;
                  delete negativoCases[dataArray[i].ibgeID];
                }

                if (dataArray[i].newCases < 0) {
                  if (!(dataArray[i].ibgeID in negativoCases)) {
                    negativoCases[dataArray[i].ibgeID] = 0;
                  }
                  negativoCases[dataArray[i].ibgeID] =
                    +negativoCases[dataArray[i].ibgeID] - dataArray[i].newCases;
                  dataArray[i].newCases = 0;
                }

                if (dataArray[i].ibgeID in negativoDeaths) {
                  dataArray[i].newDeaths =
                    +dataArray[i].newDeaths -
                    negativoDeaths[dataArray[i].ibgeID];
                  negativoDeaths[dataArray[i].ibgeID] = 0;
                  delete negativoDeaths[dataArray[i].ibgeID];
                }

                if (dataArray[i].newDeaths < 0) {
                  if (!(dataArray[i].ibgeID in negativoDeaths)) {
                    negativoDeaths[dataArray[i].ibgeID] = 0;
                  }
                  negativoDeaths[dataArray[i].ibgeID] =
                    +negativoDeaths[dataArray[i].ibgeID] -
                    dataArray[i].newDeaths;
                  dataArray[i].newDeaths = 0;
                }
              }

              const last7Cases = {};
              const last7Deaths = {};
              const average = (list) =>
                list.reduce((prev, curr) => +prev + +curr) / list.length;

              for (var i = 0; i < dataArray.length; i++) {
                if (!(dataArray[i].ibgeID in last7Cases)) {
                  last7Cases[dataArray[i].ibgeID] = [];
                }
                last7Cases[dataArray[i].ibgeID].push(dataArray[i].newCases);
                if (last7Cases[dataArray[i].ibgeID].length > 7) {
                  last7Cases[dataArray[i].ibgeID].shift();
                }

                if (last7Cases[dataArray[i].ibgeID].length < 7) {
                  dataArray[i].meanCases = +dataArray[i].newCases;
                } else {
                  dataArray[i].meanCases = average(
                    last7Cases[dataArray[i].ibgeID]
                  );
                }

                if (!(dataArray[i].ibgeID in last7Deaths)) {
                  last7Deaths[dataArray[i].ibgeID] = [];
                }
                last7Deaths[dataArray[i].ibgeID].push(dataArray[i].newDeaths);
                if (last7Deaths[dataArray[i].ibgeID].length > 7) {
                  last7Deaths[dataArray[i].ibgeID].shift();
                }

                if (last7Deaths[dataArray[i].ibgeID].length < 7) {
                  dataArray[i].meanDeaths = +dataArray[i].newDeaths;
                } else {
                  dataArray[i].meanDeaths = average(
                    last7Deaths[dataArray[i].ibgeID]
                  );
                }
              }

              dataArray[0].nrDiasDobraCasos = 0;
              dataArray[0].nrDiasDobraMortes = 0;
              for (var i = dataArray.length - 1; i > 0; i--) {
                for (var j = i - 1; j >= 0; j--) {
                  if (+dataArray[i].ibgeID == +dataArray[j].ibgeID) {
                    if (
                      dataArray[j].totalCases <=
                      dataArray[i].totalCases / 2
                    ) {
                      const date1 = new Date(dataArray[j].date);
                      const date2 = new Date(dataArray[i].date);
                      const diffTime = Math.abs(date2 - date1);
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );
                      dataArray[i].nrDiasDobraCasos = diffDays;
                      break;
                    }
                  }
                }
                if (!dataArray[i].nrDiasDobraCasos) {
                  dataArray[i].nrDiasDobraCasos = 0;
                }
                for (var j = i - 1; j >= 0; j--) {
                  if (+dataArray[i].ibgeID == +dataArray[j].ibgeID) {
                    if (dataArray[j].deaths <= dataArray[i].deaths / 2) {
                      const date1 = new Date(dataArray[j].date);
                      const date2 = new Date(dataArray[i].date);
                      const diffTime = Math.abs(date2 - date1);
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );
                      dataArray[i].nrDiasDobraMortes = diffDays;
                      break;
                    }
                  }
                }
                if (!dataArray[i].nrDiasDobraMortes) {
                  dataArray[i].nrDiasDobraMortes = 0;
                }
              }
              const fields = Object.keys(dataArray[0]);
              const opts = { fields };
              const parser = new Parser(opts);
              const result = parser.parse(dataArray);

              fs.writeFileSync(output, result);
              console.log("Preparo do CSV dos Municipios FINALIZADO!");
            });
        });
    });
};

module.exports = {
  download: download,
  modify_csv_cidade: modify_csv_cidade,
  modify_csv_estado: modify_csv_estado,
  csv_brasil: csv_brasil,
  csv_brasil_semana: csv_brasil_semana,
};
