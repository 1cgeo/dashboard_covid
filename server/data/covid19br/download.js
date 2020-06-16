const path = require("path");
const {
  modify_csv_estado,
  csv_brasil,
  modify_csv_cidade,
  download,
} = require("./util");

download(
  "https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-states.csv",
  path.join(__dirname, "estados_original.csv"),
  function (err, data) {
    if (err) return console.error(err);
    modify_csv_estado(
      path.join(__dirname, "estados_original.csv"),
      path.join(__dirname, "nome_estados.csv"),
      path.join(__dirname, "estados.csv")
    );
    csv_brasil(
      path.join(__dirname, "estados_original.csv"),
      path.join(__dirname, "brasil.csv")
    );
  }
);

download(
  "https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-cities-time.csv",
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
          path.join(__dirname, "centroides_municipios.csv"),
          path.join(__dirname, "cidades.csv")
        );
      }
    );
  }
);
