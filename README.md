# Painel de Acompanhamento da COVID-19 no Brasil

O painel de acompanhamento do avanço da COVID-19 no Brasil tem por objetivo espacializar os dados municipais e estaduais referentes aos casos existentes e óbitos associados à COVID-19 no Brasil, fornecendo subsídios para auxiliar no processo de tomada de decisão dos diversos escalões do Exército Brasileiro. O painel possui as seguintes funcionalidades:

- Mapas de calor de concentração de casos confirmados e óbitos, mapa de número de casos, óbitos e recuperados, mapa de taxa de crescimento de casos, mapa de tendência de casos e óbitos;

- Análises podem ser realizadas nos níveis estaduais, municipais, por região do Brasil (Sul, Sudeste, Norte, etc.), por áreas e subáreas (atualmente somente na região Sul do Brasil).

- Gráfico diários e semanais dos casos confirmados e óbitos. Para dados no nível estadual e de região também é apresentada a informação de recuperados;

- Gráficos comparativos de casos confirmados por 100.000 hab, óbitos por 100.000 hab, taxa de letalidade por estado. Tais informações também são apresentadas de forma tabular;

- Possibilidade de exportar os gráficos para relatórios e apresentações; e

- Possibilidade de verificar os mapas, gráficos e tabelas para qualquer data, inclusive permitindo uma animação da evolução dos casos.

O painel utiliza dados diários compilados pela equipe do pesquisador [Wesley Cota](https://github.com/wcota/covid19br) considerando as seguintes fontes: Ministério da Saúde, dados do Brasil.IO e dados das prefeituras.

---

## Pré-requisitos:

- [Node.js](https://nodejs.org/en/) versão 12 ou superior
- npm (em geral instalado junto ao Node.js)
- [nodemon](https://www.npmjs.com/package/nodemon)

---

## Instalação:

1. Clonar o repositório.
2. Executar `npm install`
3. Executar `npm run download`

Caso tenha problemas em executar o download diretamente (devido a proxy por exemplo) os seguintes passos devem ser executados como alternativa ao passo 3:

3a. Realizar o download do [CSV nível Estadual](https://github.com/wcota/covid19br/blob/master/cases-brazil-states.csv) e do [CSV nível Municipal](https://github.com/wcota/covid19br/blob/master/cases-brazil-cities-time.csv.gz). Deve ser mantido o nome dos arquivos: *cases-brazil-states.csv* e *cases-brazil-cities-time.csv* (este arquivo estará zipado)

3b. Inserir ambos os arquivos na pasta /server/data/covid19br

3c. Executar `npm run preparar`

Uma vez o **passo 3** concluído basta executar o comando `npm run start`.

> Diaramente o passo 3 deve ser realizado de forma a garantir que os dados estejam atualizados. Após atualizar é necessário reiniciar o serviço.
