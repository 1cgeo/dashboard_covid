class Status {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  numberWithPoint(x) {
    if (x === 'Sem dados') {
      return x
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }


  loadData(data, locationName) {
    this.setLocationName(locationName);
    if (data.length < 1) {
      this.clean();
      return;
    }
    var totalCases = this.reduceValue(data, "newCases")
    var totalDeaths = this.reduceValue(data, "newDeaths")
    var lastdata = data[data.length - 1]
    this.setTotalCases(this.numberWithPoint(totalCases));
    this.setRecuperadosCases(this.numberWithPoint(this.reduceValue(data, "recovered")));
    this.setTotalDeaths(this.numberWithPoint(totalDeaths));
    this.setLethality(`${((totalDeaths / totalCases) * 100).toFixed(1)} %`)
    var suffix = (lastdata.week)? 'última semana' : 'último dia'
    this.setLastCases(this.numberWithPoint(lastdata.newCases), suffix)
    this.setLastDeaths(this.numberWithPoint(lastdata.newDeaths), suffix)
    this.setLastRecovered(this.numberWithPoint(lastdata.recovered), suffix)

  }

  reduceValue(data, field) {
    if (data[data.length - 1][field] === "Sem dados") {
      return "Sem dados";
    }
    var total = 0;
    for (var i = data.length; i--;) {
      total += +data[i][field];
    }
    return total;
  }

  clean() {
    this.setTotalCases("Sem dados")
    this.setRecuperadosCases("Sem dados")
    this.setTotalDeaths("Sem dados")
    this.setLethality("Sem dados")
    this.setLastCases("Sem dados")
    this.setLastDeaths("Sem dados")
    this.setLastRecovered("Sem dados")
  }

  setLocationName(locationName) {
    $("#tag-location").text(locationName);
  }

  setTotalCases(total) {
    $("#cases-values").text(total);
  }

  setLethality(total) {
    $("#lethality-values").text(total);
  }

  setRecuperadosCases(total) {
    $("#recuperados-values").text(total);
  }

  setTotalDeaths(total) {
    $("#deaths-values").text(total);
  }

  setLastCases(total, suffix) {
    $("#last-cases-values").text(total)
    $("#last-cases-tag").text(suffix);
  }

  setLastDeaths(total, suffix) {
    $("#last-deaths-values").text(total);
    $("#last-deaths-tag").text(suffix);
  }

  setLastRecovered(total, suffix) {
    $("#last-recovered-values").text(total);
    $("#last-recovered-tag").text(suffix);
  }
}
