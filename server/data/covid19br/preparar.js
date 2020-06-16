const path = require("path");
const { modify_csv_estado, csv_brasil, modify_csv_cidade } = require("./util");

modify_csv_estado(
  path.join(__dirname, "estados_original.csv"),
  path.join(__dirname, "nome_estados.csv"),
  path.join(__dirname, "estados.csv")
);
csv_brasil(
  path.join(__dirname, "estados_original.csv"),
  path.join(__dirname, "brasil.csv")
);

modify_csv_cidade(
  path.join(__dirname, "cidades_original.csv"),
  path.join(__dirname, "coords_cidade_original.csv"),
  path.join(__dirname, "centroides_municipios.csv"),
  path.join(__dirname, "cidades.csv")
);
