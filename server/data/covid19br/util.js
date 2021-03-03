var HttpsProxyAgent = require('https-proxy-agent');
var url = require('url');
const https = require("https");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const epi = require("./epidemiological-week");
const gunzip = require('gunzip-file')

const centroide_regiao = {
  Sudeste: [-46.388371766, -19.772750807599998],
  Sul: [-52.8368404615, -28.133689489600002],
  "Centro-Oeste": [-53.770157066, -15.70869986395],
  Nordeste: [-41.774017855500006, -9.6965501243],
  Norte: [-59.843560357, -4.210929523099999],
};

const centroide_sapi = {
  "Subárea de Uruguaiana": [-56.216524268499995, -29.86198892635],
  "Subárea de Curitiba": [-48.940353771, -25.2165291457],
  "Subárea de Cruz Alta": [-52.9869266145, -28.061558283300002],
  "Subárea de Cascavel": [-52.70053074965, -24.55801220175],
  "Subárea de Ponta Grossa": [-50.363856212, -24.88686601825],
  "Subárea de Florianópolis": [-51.09759413615, -27.65545385525],
  "Subárea de Bagé": [-54.61908440495, -30.997590611249997],
  "Subárea de Pelotas": [-51.71784407045, -30.653584850999998],
  "Subárea de Santa Maria": [-53.664214672499995, -29.6236634728],
  "Subárea de Santiago": [-55.1459490654, -28.37737602875],
};

const centroide_api = {
  "Área Oeste do RS": [-54.6053580925, -28.9089720818],
  "Área Leste do RS": [-52.99074199945, -30.653584850999998],
  "Área de SC e PR": [-51.32162136865, -25.935863894249998],
};

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

const pop_estadual = {
  53: 3015268,
  43: 11377239,
  32: 4018650,
  51: 3484466,
  24: 3506853,
  16: 845731,
  29: 14873064,
  11: 1777225,
  22: 3273227,
  42: 7164788,
  50: 2778986,
  35: 45919049,
  23: 9132078,
  33: 17264943,
  27: 3337357,
  13: 4144597,
  31: 21168791,
  41: 11433957,
  52: 7018354,
  14: 605761,
  28: 2298696,
  12: 881935,
  15: 8602865,
  25: 4018127,
  21: 7075181,
  26: 9557071,
  17: 1572866,
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

const gunzipfile = (filepath, dest, cb) => {
  console.log(`Extração de ${filepath} iniciada.`)
  gunzip(filepath, dest, () => {
    console.log(`Extração de ${filepath} FINALIZADA!`)
    cb()
  })
}

const download = (endpoint, dest, cb) => {
  const file = fs.createWriteStream(dest);
  console.log(`Download de ${dest} iniciado.`);
  var options = url.parse(endpoint);
  process.env.http_proxy ? options.agent = new HttpsProxyAgent(process.env.http_proxy) : ''
  const request = https.get(options, function (response) {
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

const downloadzip = (url, dest, cb) => {
  var gzipfile = `${dest}.gz`
  download(
    url,
    gzipfile,
    (err, data) => {
      gunzipfile(gzipfile, dest, cb)
    }
  );
};

const calcSemana = (date) => { //deprecated
  return epi.calculate(date).week;
};

const fixsemana = (semana) => {
  if (semana > 100) {
    return semana - 47
  } else {
    return semana
  }
};

const csv_brasil = (file, output) => {
  console.log("Preparo do CSV do Brasil iniciado.");
  const dataArray = [];
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (data) {
      if (data.state == "TOTAL") {
        data.totalRecovered = data.recovered > 0 ? +data.recovered : 0;
        data.totalVaccinated = data.vaccinated > 0 ? +data.vaccinated : 0;
        dataArray.push(data);
      }
    })
    .on("end", function () {
      dataArray[0].recovered = +dataArray[0].totalRecovered;
      for (var i = dataArray.length - 1; i >= 1; i--) {
        dataArray[i].recovered =
          +dataArray[i].recovered - dataArray[i - 1].recovered;
      }
      dataArray[0].vaccinated = +dataArray[0].totalVaccinated;
      for (var i = dataArray.length - 1; i >= 1; i--) {
        dataArray[i].vaccinated =
          +dataArray[i].vaccinated - dataArray[i - 1].vaccinated;
      }

      for (var i = 0; i < dataArray.length; i++) {
        if (i < 6) {
          dataArray[i].meanCases = +dataArray[i].newCases;
          dataArray[i].meanDeaths = +dataArray[i].newDeaths;
          dataArray[i].meanRecovered = +dataArray[i].recovered;
          dataArray[i].meanVaccinated = +dataArray[i].vaccinated;
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

          dataArray[i].meanVaccinated =
            (+dataArray[i].vaccinated +
              +dataArray[i - 1].vaccinated +
              +dataArray[i - 2].vaccinated +
              +dataArray[i - 3].vaccinated +
              +dataArray[i - 4].vaccinated +
              +dataArray[i - 5].vaccinated +
              +dataArray[i - 6].vaccinated) /
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
      let semana = fixsemana(d.epi_week);
      if (!(semana in data)) {
        data[semana] = {};
        data[semana].semana = semana;
        data[semana].epi_week = semana;
        data[semana].dias_semana = 0;
        data[semana].nome = "Brasil";
        data[semana].newDeaths = 0;
        data[semana].newCases = 0;
        data[semana].recovered = 0;
        data[semana].vaccinated = 0;
        data[semana].totalRecovered = 0;
        data[semana].totalVaccinated = 0;
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
      data[semana].vaccinated_per_100k_inhabitants = +d.vaccinated_per_100k_inhabitants;
      data[semana].deaths_by_totalCases = +d.deaths_by_totalCases;
      data[semana].recovered += +d.recovered;
      data[semana].totalRecovered = +d.totalRecovered;

      data[semana].vaccinated += +d.vaccinated;
      data[semana].totalVaccinated = +d.totalVaccinated;
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

const modify_csv_estado_semana = (file, output) => {
  console.log("Preparo do CSV dos Estados por Semana iniciado.");
  const data = {};
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (d) {
      let semana = fixsemana(d.epi_week);
      let id = `${semana}_${d.state}`;
      if (!(id in data)) {
        data[id] = {};
        data[id].semana = semana;
        data[id].epi_week = semana;
        data[id].dias_semana = 0;
        data[id].state = d.state;
        data[id].nome = d.nome;
        data[id].regiao = d.regiao;
        data[id].newDeaths = 0;
        data[id].newCases = 0;
        data[id].recovered = 0;
        data[id].totalRecovered = 0;
        data[id].vaccinated = 0;
        data[id].totalVaccinated = 0;
        data[id].CD_GEOCUF = d.CD_GEOCUF;
        data[id].CENTROID_X = d.CENTROID_X;
        data[id].CENTROID_Y = d.CENTROID_Y;
      }

      data[id].dias_semana += 1;
      data[id].newDeaths += +d.newDeaths;
      data[id].deaths = +d.deaths;
      data[id].newCases += +d.newCases;
      data[id].totalCases = +d.totalCases;
      data[id].deaths_per_100k_inhabitants = +d.deaths_per_100k_inhabitants;
      data[
        id
      ].totalCases_per_100k_inhabitants = +d.totalCases_per_100k_inhabitants;
      data[id].vaccinated_per_100k_inhabitants = +d.vaccinated_per_100k_inhabitants;
      data[id].deaths_by_totalCases = +d.deaths_by_totalCases;
      data[id].recovered += +d.recovered;
      data[id].totalRecovered = +d.totalRecovered;

      data[id].vaccinated += +d.vaccinated;
      data[id].totalVaccinated = +d.totalVaccinated;

      data[id].nrDiasDobraCasos = d.nrDiasDobraCasos;
      data[id].nrDiasDobraMortes = d.nrDiasDobraMortes;
      data[id].tendencia_casos = d.tendencia_casos;
      data[id].last14AvgCases = d.last14AvgCases;
      data[id].tendencia_obitos = d.tendencia_obitos;
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
      console.log("Preparo do CSV dos Estados por Semana FINALIZADO!");
    });
};

const agrupa_semana = (file, output) => {
  console.log(`Agrupando dados por semana ${output}`);
  const data = {};
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (d) {
      let semana = fixsemana(d.epi_week);
      let id = `${semana}_${d.nome}`;
      if (!(id in data)) {
        data[id] = {};
        data[id].semana = semana;
        data[id].epi_week = semana;
        data[id].dias_semana = 0;
        data[id].nome = d.nome;
        data[id].newDeaths = 0;
        data[id].newCases = 0;
        data[id].recovered = 0;
        data[id].vaccinated = 0;
        data[id].totalVaccinated = 0;
        data[id].CENTROID_X = d.CENTROID_X;
        data[id].CENTROID_Y = d.CENTROID_Y;
      }

      data[id].dias_semana += 1;
      data[id].newDeaths += +d.newDeaths;
      data[id].deaths = +d.deaths;
      data[id].newCases += +d.newCases;
      data[id].totalCases = +d.totalCases;
      data[id].deaths_per_100k_inhabitants = +d.deaths_per_100k_inhabitants;
      data[
        id
      ].totalCases_per_100k_inhabitants = +d.totalCases_per_100k_inhabitants;

      data[id].vaccinated_per_100k_inhabitants = +d.vaccinated_per_100k_inhabitants;

      data[id].deaths_by_totalCases = +d.deaths_by_totalCases;
      data[id].recovered += +d.recovered;
      data[id].totalRecovered = +d.totalRecovered;

      data[id].vaccinated += +d.vaccinated;
      data[id].totalVaccinated = +d.totalVaccinated;

      data[id].nrDiasDobraCasos = d.nrDiasDobraCasos;
      data[id].nrDiasDobraMortes = d.nrDiasDobraMortes;
      data[id].tendencia_casos = d.tendencia_casos;
      data[id].last14AvgCases = d.last14AvgCases;
      data[id].tendencia_obitos = d.tendencia_obitos;
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
    });
};

const agrupa_area_geografica = (file, output, chave, centroide) => {
  console.log(`Agrupando dados por área geográfica ${output}`);
  const data = {};
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (d) {
      if (chave in d && d[chave]) {
        let id = `${d.date}_${d[chave]}`;
        if (!(id in data)) {
          data[id] = {};
          data[id].nome = d[chave];
          data[id].date = d.date;
          data[id].newDeaths = 0;
          data[id].semana = fixsemana(d.epi_week);
          data[id].epi_week = fixsemana(d.epi_week);
          data[id].deaths = 0;
          data[id].newCases = 0;
          data[id].totalCases = 0;
          data[id].recovered = 0;
          data[id].totalRecovered = 0;
          data[id].vaccinated = 0;
          data[id].totalVaccinated = 0;
          data[id].pop_100k = 0;
          data[id].CENTROID_X = centroide[d[chave]][0];
          data[id].CENTROID_Y = centroide[d[chave]][1];
        }

        data[id].newDeaths += +d.newDeaths;
        data[id].deaths += +d.deaths;
        data[id].newCases += +d.newCases;
        data[id].totalCases += +d.totalCases;
        data[id].pop_100k += +d.populacao / 100000;
        data[id].recovered += +d.recovered;
        data[id].totalRecovered += +d.totalRecovered;

        data[id].vaccinated += +d.vaccinated;
        data[id].totalVaccinated += +d.totalVaccinated;
      }
    })
    .on("end", function () {
      const dataArray = [];
      for (var key in data) {
        if (data[key].totalCases > 0) {
          data[key].deaths_by_totalCases =
            Math.round((10 * data[key].deaths) / data[key].totalCases) / 10;
        } else {
          data[key].deaths_by_totalCases = 0;
        }

        data[key].totalCases_per_100k_inhabitants = Math.round(
          data[key].totalCases / data[key].pop_100k
        );
        data[key].deaths_per_100k_inhabitants = Math.round(
          data[key].deaths / data[key].pop_100k
        );
        data[key].vaccinated_per_100k_inhabitants = Math.round(
          data[key].vaccinated / data[key].pop_100k
        );


        dataArray.push(data[key]);
      }
      const last7Cases = {};
      const last7Deaths = {};
      const last7Recovered = {};
      const last7Vaccinated = {};

      const last14AvgCases = {};
      const last14AvgDeaths = {};

      const average = (list) =>
        Math.round(list.reduce((prev, curr) => +prev + +curr) / list.length);

      for (var i = 0; i < dataArray.length; i++) {
        if (!(dataArray[i].nome in last7Cases)) {
          last7Cases[dataArray[i].nome] = [];
        }
        last7Cases[dataArray[i].nome].push(dataArray[i].newCases);
        if (last7Cases[dataArray[i].nome].length > 7) {
          last7Cases[dataArray[i].nome].shift();
        }

        if (last7Cases[dataArray[i].nome].length < 7) {
          dataArray[i].meanCases = +dataArray[i].newCases;
        } else {
          dataArray[i].meanCases = average(last7Cases[dataArray[i].nome]);
        }

        if (!(dataArray[i].nome in last14AvgCases)) {
          last14AvgCases[dataArray[i].nome] = [];
        }
        last14AvgCases[dataArray[i].nome].push(dataArray[i].meanCases);
        if (last14AvgCases[dataArray[i].nome].length > 14) {
          last14AvgCases[dataArray[i].nome].shift();
        }
        if (dataArray[i].totalCases < 100) {
          dataArray[i].tendencia_casos = "Sem ou poucos casos";
          dataArray[i].last14AvgCases = "";
        } else if (last14AvgCases[dataArray[i].nome].length < 14) {
          dataArray[i].tendencia_casos = "Aproximadamente o mesmo";
          dataArray[i].last14AvgCases = "";
        } else {
          dataArray[i].last14AvgCases = last14AvgCases[dataArray[i].nome].join(
            "|"
          );
          const d1 = last14AvgCases[dataArray[i].nome][0];
          const d2 = last14AvgCases[dataArray[i].nome][13];
          if (d2 > d1 * 2.0) {
            dataArray[i].tendencia_casos = "Crescendo 3";
          } else if (d2 > d1 * 1.5) {
            dataArray[i].tendencia_casos = "Crescendo 2";
          } else if (d2 > d1 * 1.05) {
            dataArray[i].tendencia_casos = "Crescendo 1";
          } else if (d2 > d1 * 0.95) {
            dataArray[i].tendencia_casos = "Aproximadamente o mesmo";
          } else {
            dataArray[i].tendencia_casos = "Diminuindo";
          }
        }

        if (!(dataArray[i].nome in last7Deaths)) {
          last7Deaths[dataArray[i].nome] = [];
        }
        last7Deaths[dataArray[i].nome].push(dataArray[i].newDeaths);
        if (last7Deaths[dataArray[i].nome].length > 7) {
          last7Deaths[dataArray[i].nome].shift();
        }

        if (last7Deaths[dataArray[i].nome].length < 7) {
          dataArray[i].meanDeaths = +dataArray[i].newDeaths;
        } else {
          dataArray[i].meanDeaths = average(last7Deaths[dataArray[i].nome]);
        }

        if (!(dataArray[i].nome in last14AvgDeaths)) {
          last14AvgDeaths[dataArray[i].nome] = [];
        }
        last14AvgDeaths[dataArray[i].nome].push(dataArray[i].meanDeaths);
        if (last14AvgDeaths[dataArray[i].nome].length > 14) {
          last14AvgDeaths[dataArray[i].nome].shift();
        }
        if (dataArray[i].deaths < 10) {
          dataArray[i].tendencia_obitos = "Sem ou poucos casos";
        } else if (last14AvgDeaths[dataArray[i].nome].length < 14) {
          dataArray[i].tendencia_obitos = "Aproximadamente o mesmo";
        } else {
          const d1 = last14AvgDeaths[dataArray[i].nome][0];
          const d2 = last14AvgDeaths[dataArray[i].nome][13];
          if (d2 > d1 * 2.0) {
            dataArray[i].tendencia_obitos = "Crescendo 3";
          } else if (d2 > d1 * 1.5) {
            dataArray[i].tendencia_obitos = "Crescendo 2";
          } else if (d2 > d1 * 1.05) {
            dataArray[i].tendencia_obitos = "Crescendo 1";
          } else if (d2 > d1 * 0.95) {
            dataArray[i].tendencia_obitos = "Aproximadamente o mesmo";
          } else {
            dataArray[i].tendencia_obitos = "Diminuindo";
          }
        }

        if (!(dataArray[i].nome in last7Recovered)) {
          last7Recovered[dataArray[i].nome] = [];
        }
        last7Recovered[dataArray[i].nome].push(dataArray[i].recovered);
        if (last7Recovered[dataArray[i].nome].length > 7) {
          last7Recovered[dataArray[i].nome].shift();
        }

        if (last7Recovered[dataArray[i].nome].length < 7) {
          dataArray[i].meanRecovered = +dataArray[i].recovered;
        } else {
          dataArray[i].meanRecovered = average(
            last7Recovered[dataArray[i].nome]
          );
        }

        if (!(dataArray[i].nome in last7Vaccinated)) {
          last7Vaccinated[dataArray[i].nome] = [];
        }
        last7Vaccinated[dataArray[i].nome].push(dataArray[i].vaccinated);
        if (last7Vaccinated[dataArray[i].nome].length > 7) {
          last7Vaccinated[dataArray[i].nome].shift();
        }

        if (last7Vaccinated[dataArray[i].nome].length < 7) {
          dataArray[i].meanVaccinated = +dataArray[i].vaccinated;
        } else {
          dataArray[i].meanVaccinated = average(
            last7Vaccinated[dataArray[i].nome]
          );
        }

      }

      dataArray[0].nrDiasDobraCasos = 0;
      dataArray[0].nrDiasDobraMortes = 0;
      for (var i = dataArray.length - 1; i > 0; i--) {
        for (var j = i - 1; j >= 0; j--) {
          if (dataArray[i].nome == dataArray[j].nome) {
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
          if (dataArray[i].nome == dataArray[j].nome) {
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
      agrupa_semana(output, `${output.split(".")[0]}_semana.csv`);
    });
};

const modify_csv_estado = (file, nomes, output) => {
  console.log("Preparo do CSV dos Estados iniciado.");
  const dataArray = [];
  const nomeEstados = {};
  const regiaoEstados = {};
  fs.createReadStream(nomes)
    .pipe(csv())
    .on("data", function (data) {
      nomeEstados[data["SIGLA"].trim()] = data["NOME"].trim();
      regiaoEstados[data["SIGLA"].trim()] = data["REGIAO"].trim();
    })
    .on("end", function () {
      fs.createReadStream(file)
        .pipe(csv())
        .on("data", function (data) {
          if (data.state != "TOTAL") {
            data.CD_GEOCUF = STATES_MAP[data.state.toLowerCase()];
            data.nome = nomeEstados[data.state];
            data.regiao = regiaoEstados[data.state];
            data.CENTROID_X = +CENTROID[data.CD_GEOCUF][0];
            data.CENTROID_Y = +CENTROID[data.CD_GEOCUF][1];
            data.populacao = pop_estadual[data.CD_GEOCUF];
            data.totalRecovered = data.recovered > 0 ? +data.recovered : 0;
            data.totalVaccinated = data.vaccinated > 0 ? +data.vaccinated : 0;
            data.semana = fixsemana(data.epi_week)
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

          dataArray[0].vaccinated = dataArray[0].totalVaccinated;
          for (var i = dataArray.length - 1; i >= 1; i--) {
            let rec = 0;
            for (var j = i - 1; j >= 0; j--) {
              if (dataArray[i].state == dataArray[j].state) {
                rec = +dataArray[i].vaccinated - dataArray[j].vaccinated;
                break;
              }
            }
            dataArray[i].vaccinated = rec > 0 ? +rec : 0;
          }

          const last7Cases = {};
          const last7Deaths = {};
          const last7Recovered = {};
          const last7Vaccinated = {};

          const last14AvgCases = {};
          const last14AvgDeaths = {};

          const average = (list) =>
            Math.round(
              list.reduce((prev, curr) => +prev + +curr) / list.length
            );

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

            if (!(dataArray[i].state in last14AvgCases)) {
              last14AvgCases[dataArray[i].state] = [];
            }
            last14AvgCases[dataArray[i].state].push(dataArray[i].meanCases);
            if (last14AvgCases[dataArray[i].state].length > 14) {
              last14AvgCases[dataArray[i].state].shift();
            }
            if (dataArray[i].totalCases < 100) {
              dataArray[i].tendencia_casos = "Sem ou poucos casos";
              dataArray[i].last14AvgCases = "";
            } else if (last14AvgCases[dataArray[i].state].length < 14) {
              dataArray[i].tendencia_casos = "Aproximadamente o mesmo";
              dataArray[i].last14AvgCases = "";
            } else {
              dataArray[i].last14AvgCases = last14AvgCases[
                dataArray[i].state
              ].join("|");
              const d1 = last14AvgCases[dataArray[i].state][0];
              const d2 = last14AvgCases[dataArray[i].state][13];
              if (d2 > d1 * 2.0) {
                dataArray[i].tendencia_casos = "Crescendo 3";
              } else if (d2 > d1 * 1.5) {
                dataArray[i].tendencia_casos = "Crescendo 2";
              } else if (d2 > d1 * 1.05) {
                dataArray[i].tendencia_casos = "Crescendo 1";
              } else if (d2 > d1 * 0.95) {
                dataArray[i].tendencia_casos = "Aproximadamente o mesmo";
              } else {
                dataArray[i].tendencia_casos = "Diminuindo";
              }
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
              dataArray[i].meanDeaths = average(
                last7Deaths[dataArray[i].state]
              );
            }

            if (!(dataArray[i].state in last14AvgDeaths)) {
              last14AvgDeaths[dataArray[i].state] = [];
            }
            last14AvgDeaths[dataArray[i].state].push(dataArray[i].meanDeaths);
            if (last14AvgDeaths[dataArray[i].state].length > 14) {
              last14AvgDeaths[dataArray[i].state].shift();
            }
            if (dataArray[i].deaths < 10) {
              dataArray[i].tendencia_obitos = "Sem ou poucos casos";
            } else if (last14AvgDeaths[dataArray[i].state].length < 14) {
              dataArray[i].tendencia_obitos = "Aproximadamente o mesmo";
            } else {
              const d1 = last14AvgDeaths[dataArray[i].state][0];
              const d2 = last14AvgDeaths[dataArray[i].state][13];
              if (d2 > d1 * 2.0) {
                dataArray[i].tendencia_obitos = "Crescendo 3";
              } else if (d2 > d1 * 1.5) {
                dataArray[i].tendencia_obitos = "Crescendo 2";
              } else if (d2 > d1 * 1.05) {
                dataArray[i].tendencia_obitos = "Crescendo 1";
              } else if (d2 > d1 * 0.95) {
                dataArray[i].tendencia_obitos = "Aproximadamente o mesmo";
              } else {
                dataArray[i].tendencia_obitos = "Diminuindo";
              }
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


            if (!(dataArray[i].state in last7Vaccinated)) {
              last7Vaccinated[dataArray[i].state] = [];
            }
            last7Vaccinated[dataArray[i].state].push(dataArray[i].vaccinated);
            if (last7Vaccinated[dataArray[i].state].length > 7) {
              last7Vaccinated[dataArray[i].state].shift();
            }

            if (last7Vaccinated[dataArray[i].state].length < 7) {
              dataArray[i].meanVaccinated = +dataArray[i].vaccinated;
            } else {
              dataArray[i].meanVaccinated = average(
                last7Vaccinated[dataArray[i].state]
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
          modify_csv_estado_semana(
            output,
            `${output.split(".")[0]}_semana.csv`
          );
          agrupa_area_geografica(
            output,
            `${output.split(".")[0]}_regiao.csv`,
            "regiao",
            centroide_regiao
          );
        });
    });
};

const modify_csv_cidade_semana = (file, output) => {
  console.log("Preparo do CSV dos Municipios por Semana iniciado.");
  const data = {};
  fs.createReadStream(file)
    .pipe(csv())
    .on("data", function (d) {
      let semana = fixsemana(d.epi_week);
      let id = `${semana}_${d.city}`;
      if (!(id in data)) {
        data[id] = {};
        data[id].semana = semana;
        data[id].epi_week = semana;
        data[id].dias_semana = 0;
        data[id].country = d.country;
        data[id].state = d.state;
        data[id].city = d.city;
        data[id].ibgeID = d.ibgeID;
        data[id].api = d.api;
        data[id].sapi = d.sapi;
        data[id].newDeaths = 0;
        data[id].newCases = 0;
      }

      data[id].dias_semana += 1;
      data[id].newDeaths += +d.newDeaths;
      data[id].deaths = +d.deaths;
      data[id].newCases += +d.newCases;
      data[id].totalCases = +d.totalCases;
      data[id].deaths_per_100k_inhabitants = +d.deaths_per_100k_inhabitants;
      data[
        id
      ].totalCases_per_100k_inhabitants = +d.totalCases_per_100k_inhabitants;

      data[id].vaccinated_per_100k_inhabitants = +d.vaccinated_per_100k_inhabitants;

      data[id].deaths_by_totalCases = +d.deaths_by_totalCases;

      data[id].centroid_lat = d.centroid_lat;
      data[id].centroid_long = d.centroid_long;
      data[id].lat = d.lat;
      data[id].lon = d.lon;
      data[id].tendencia_casos = d.tendencia_casos;
      data[id].last14AvgCases = d.last14AvgCases;
      data[id].tendencia_obitos = d.tendencia_obitos;
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
      console.log("Preparo do CSV dos Municipios por Semana FINALIZADO!");
    });
};

const modify_csv_cidade = (file, info, areas, output) => {
  console.log("Preparo do CSV dos Municipios iniciado.");
  const dataArray = [];
  const api = {};
  const sapi = {};
  fs.createReadStream(areas)
    .pipe(csv())
    .on("data", function (data) {
      api[data["CD_GEOCMU"]] = data["API"];
      sapi[data["CD_GEOCMU"]] = data["SAPI"];
    })
    .on("end", function () {
      fs.createReadStream(file)
        .pipe(csv())
        .on("data", function (data) {
          if (
            !data.city.includes("CASO SEM LOCALIZAÇÃO DEFINIDA") &&
            data.city !== "TOTAL"
          ) {
            if (data["ibgeID"] in api) {
              data.api = api[data["ibgeID"]];
            } else {
              data.api = "";
            }
            if (data["ibgeID"] in sapi) {
              data.sapi = sapi[data["ibgeID"]];
            } else {
              data.sapi = "";
            }
            dataArray.push(data);
          }
        })
        .on("end", function () {
          const gps = {};
          const centroid = {};
          const populacao = {};
          fs.createReadStream(info)
            .pipe(csv())
            .on("data", function (data) {
              gps[data.ibgeID] = {
                centroid_long: data.centroid_long,
                centroid_lat: data.centroid_lat,
              };
              centroid[data.ibgeID] = {
                lat: data.lat,
                lon: data.lon,
              };
              populacao[data.ibgeID] = data.populacao;
            })
            .on("end", function () {
              dataArray.forEach((d) => {
                d.centroid_lat = +gps[d.ibgeID].centroid_lat;
                d.centroid_long = +gps[d.ibgeID].centroid_long;
                d.lat = +centroid[d.ibgeID].lat;
                d.lon = +centroid[d.ibgeID].lon;
                d.populacao = +populacao[d.ibgeID];
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
              console.log("Cidades: casos negativos corrigidos");

              const last7Cases = {};
              const last7Deaths = {};
              const last14AvgCases = {};
              const last14AvgDeaths = {};
              const average = (list) =>
                Math.round(
                  list.reduce((prev, curr) => +prev + +curr) / list.length
                );

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

                if (!(dataArray[i].ibgeID in last14AvgCases)) {
                  last14AvgCases[dataArray[i].ibgeID] = [];
                }
                last14AvgCases[dataArray[i].ibgeID].push(
                  dataArray[i].meanCases
                );
                if (last14AvgCases[dataArray[i].ibgeID].length > 14) {
                  last14AvgCases[dataArray[i].ibgeID].shift();
                }
                if (dataArray[i].totalCases < 100) {
                  dataArray[i].tendencia_casos = "Sem ou poucos casos";
                  dataArray[i].last14AvgCases = "";
                } else if (last14AvgCases[dataArray[i].ibgeID].length < 14) {
                  dataArray[i].tendencia_casos = "Aproximadamente o mesmo";
                  dataArray[i].last14AvgCases = "";
                } else {
                  dataArray[i].last14AvgCases = last14AvgCases[
                    dataArray[i].ibgeID
                  ].join("|");
                  const d1 = last14AvgCases[dataArray[i].ibgeID][0];
                  const d2 = last14AvgCases[dataArray[i].ibgeID][13];
                  if (d2 > d1 * 2.0) {
                    dataArray[i].tendencia_casos = "Crescendo 3";
                  } else if (d2 > d1 * 1.5) {
                    dataArray[i].tendencia_casos = "Crescendo 2";
                  } else if (d2 > d1 * 1.05) {
                    dataArray[i].tendencia_casos = "Crescendo 1";
                  } else if (d2 > d1 * 0.95) {
                    dataArray[i].tendencia_casos = "Aproximadamente o mesmo";
                  } else {
                    dataArray[i].tendencia_casos = "Diminuindo";
                  }
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

                if (!(dataArray[i].ibgeID in last14AvgDeaths)) {
                  last14AvgDeaths[dataArray[i].ibgeID] = [];
                }
                last14AvgDeaths[dataArray[i].ibgeID].push(
                  dataArray[i].meanDeaths
                );
                if (last14AvgDeaths[dataArray[i].ibgeID].length > 14) {
                  last14AvgDeaths[dataArray[i].ibgeID].shift();
                }
                if (dataArray[i].deaths < 10) {
                  dataArray[i].tendencia_obitos = "Sem ou poucos casos";
                } else if (last14AvgDeaths[dataArray[i].ibgeID].length < 14) {
                  dataArray[i].tendencia_obitos = "Aproximadamente o mesmo";
                } else {
                  const d1 = last14AvgDeaths[dataArray[i].ibgeID][0];
                  const d2 = last14AvgDeaths[dataArray[i].ibgeID][13];
                  if (d2 > d1 * 2.0) {
                    dataArray[i].tendencia_obitos = "Crescendo 3";
                  } else if (d2 > d1 * 1.5) {
                    dataArray[i].tendencia_obitos = "Crescendo 2";
                  } else if (d2 > d1 * 1.05) {
                    dataArray[i].tendencia_obitos = "Crescendo 1";
                  } else if (d2 > d1 * 0.95) {
                    dataArray[i].tendencia_obitos = "Aproximadamente o mesmo";
                  } else {
                    dataArray[i].tendencia_obitos = "Diminuindo";
                  }
                }
              }
              console.log(
                "Cidades: média ultimos 7 dias de obitos/casos adicionado"
              );

              //const filterWeek = dataArray[dataArray.length - 1].epi_week - 10;
              const filterWeek = 40;
              const dataArrayFiltered = [];

              dataArray.forEach((d) => {
                if (d.epi_week > filterWeek) {
                  dataArrayFiltered.push(d);
                }
              });

              var fields = Object.keys(dataArrayFiltered[0]);
              var opts = { fields };
              var parser = new Parser(opts);
              var result = parser.parse(dataArrayFiltered);

              fs.writeFileSync(output, result);


              console.log("Preparo do CSV dos Municipios FINALIZADO!");
              modify_csv_cidade_semana(
                output,
                `${output.split(".")[0]}_semana.csv`
              );
              agrupa_area_geografica(
                output,
                `${output.split(".")[0]}_area.csv`,
                "api",
                centroide_api
              );
              agrupa_area_geografica(
                output,
                `${output.split(".")[0]}_subarea.csv`,
                "sapi",
                centroide_sapi
              );
            });
        });
    });
};

module.exports = {
  download: download,
  downloadzip: downloadzip,
  modify_csv_cidade: modify_csv_cidade,
  modify_csv_estado: modify_csv_estado,
  csv_brasil: csv_brasil,
};
