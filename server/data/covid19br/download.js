const https = require("https");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

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
  const request = https
    .get(url, function (response) {
      response.pipe(file);
      file.on("finish", function () {
        file.close(cb); // close() is async, call cb after close completes.
      });
    })
    .on("error", function (err) {
      // Handle errors
      fs.unlink(dest); // Delete the file async. (But we don't check the result)
      if (cb) cb(err.message);
    });
};

const csv_brasil = (file, output) => {
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (data.state == "TOTAL") {
        dataArray.push(data);
      }
    })
    .on("end", function () {
      const fields = Object.keys(dataArray[0]);
      const opts = { fields };
      const parser = new Parser(opts);
      const result = parser.parse(dataArray);

      fs.writeFileSync(output, result);
    });
};

const modify_csv_estado = (file, output) => {
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (data.state != "TOTAL") {
        data.CD_GEOCUF = STATES_MAP[data.state.toLowerCase()];
        data.CENTROID_X = CENTROID[data.CD_GEOCUF][0];
        data.CENTROID_Y = CENTROID[data.CD_GEOCUF][1];
        dataArray.push(data);
      }
    })
    .on("end", function () {
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
    });
};

const modify_csv_cidade = (file, coords, output) => {
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (!data.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA")) {
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
          dataArray.forEach((d) => {
            gpsArray.forEach((g) => {
              if (+d.ibgeID == +g.ibgeID) {
                d.lat = g.lat;
                d.lon = g.lon;
              }
            });
          });

          dataArray[0].nrDiasDobraCasos = 0;
          dataArray[0].nrDiasDobraMortes = 0;
          for (var i = dataArray.length - 1; i > 0; i--) {
            for (var j = i - 1; j >= 0; j--) {
              if (+dataArray[i].ibgeID == +dataArray[j].ibgeID) {
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
              if (+dataArray[i].ibgeID == +dataArray[j].ibgeID) {
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
        });
    });
};

download(
  "https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-states.csv",
  path.join(__dirname, "estados_original.csv"),
  function (err, data) {
    if (err) return console.error(err);
    modify_csv_estado(
      path.join(__dirname, "estados_original.csv"),
      path.join(__dirname, "estados.csv")
    );
    csv_brasil(
      path.join(__dirname, "estados_original.csv"),
      path.join(__dirname, "brasil.csv")
    );
  }
);

download(
  "https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-cities.csv",
  path.join(__dirname, "cidades_original.csv"),
  function (err, data) {
    if (err) return console.error(err);
    download(
      "https://raw.githubusercontent.com/wcota/covid19br/master/gps_cities.csv",
      path.join(__dirname, "coords_cidade_original.csv"),
      function (err, data) {
        if (err) return console.error(err);
        modify_csv_cidade(
          path.join(__dirname, "cidades_original.csv"),
          path.join(__dirname, "coords_cidade_original.csv"),
          path.join(__dirname, "cidades.csv")
        );
      }
    );
  }
);
