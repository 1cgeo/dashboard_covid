const path = require("path");
const { modify_csv_estado, csv_brasil, modify_csv_cidade } = require("./util");

modify_csv_estado(
  path.join(__dirname, "cases-brazil-states.csv"),
  path.join(__dirname, "nome_estados.csv"),
  path.join(__dirname, "estados.csv")
);
csv_brasil(
  path.join(__dirname, "cases-brazil-states.csv"),
  path.join(__dirname, "brasil.csv")
);

modify_csv_cidade(
  path.join(__dirname, "cases-brazil-cities-time.csv"),
  path.join(__dirname, "gps_cities.csv"),
  path.join(__dirname, "centroides_municipios.csv"),
  path.join(__dirname, "area_subarea.csv"),
  path.join(__dirname, "cidades.csv")
);
