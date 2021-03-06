const path = require("path");
const {
  modify_csv_estado,
  csv_brasil,
  modify_csv_cidade,
  download,
  downloadzip
} = require("./util");

download(
  "https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-states.csv",
  path.join(__dirname, "cases-brazil-states.csv"),
  function (err, data) {
    if (err) return console.error(err);
    modify_csv_estado(
      path.join(__dirname, "cases-brazil-states.csv"),
      path.join(__dirname, "nome_estados.csv"),
      path.join(__dirname, "estados.csv")
    );
    csv_brasil(
      path.join(__dirname, "cases-brazil-states.csv"),
      path.join(__dirname, "brasil.csv")
    );
  }
);

downloadzip(
  "https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-cities-time.csv.gz",
  path.join(__dirname, "cases-brazil-cities-time.csv"),
  function (err, data) {
    if (err) return console.error(err);

    modify_csv_cidade(
      path.join(__dirname, "cases-brazil-cities-time.csv"),
      path.join(__dirname, "dados_municipios.csv"),
      path.join(__dirname, "area_subarea.csv"),
      path.join(__dirname, "cidades.csv")
    );
  }
);
