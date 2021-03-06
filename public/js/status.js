class Status {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  loadData(data, locationName) {
    this.setLocationName(locationName);
    if (data.length < 1) {
      this.clean();
      return;
    }
    var lastdata = data[data.length - 1]
    var totalCases = lastdata.totalCases
    var totalDeaths = lastdata.deaths
    this.setTotalCases(numberWithPoint(totalCases));
    if (lastdata.totalRecovered) {
      this.setRecuperadosCases(numberWithPoint(lastdata.totalRecovered))
    }
    this.setTotalDeaths(numberWithPoint(totalDeaths));
    this.setLethality(`${((totalDeaths / totalCases) * 100).toFixed(1)} %`)
    var suffix = (lastdata.week) ? 'última semana' : 'último dia'
    this.setLastCases(numberWithPoint(lastdata.newCases), suffix)
    this.setLastDeaths(numberWithPoint(lastdata.newDeaths), suffix)
    this.setLastRecovered(numberWithPoint(lastdata.recovered), suffix)

    isNaN(parseInt(lastdata.totalVaccinated)) ? '' : this.setTotalVaccinated(numberWithPoint(lastdata.totalVaccinated), suffix)
    isNaN(parseInt(lastdata.vaccinated)) ? '' : this.setLastVaccinated(numberWithPoint(lastdata.vaccinated), suffix)

    isNaN(parseInt(lastdata.totalVaccinatedSecond)) ? '' : this.setTotalVaccinatedSecond(numberWithPoint(lastdata.totalVaccinatedSecond), suffix)
    
    isNaN(parseInt(lastdata.vaccinated_second)) ? '' : this.setLastVaccinatedSecond(numberWithPoint(lastdata.vaccinated_second), suffix)
  }

  /* reduceValue(data, field) {
    if (data[data.length - 1][field] === "Sem dados") {
      return "Sem dados";
    }
    var total = 0;
    for (var i = data.length; i--;) {
      total += +data[i][field];
    }
    return total;
  } */

  clean() {
    this.setTotalCases("Sem dados")
    this.setRecuperadosCases("Sem dados")
    this.setTotalDeaths("Sem dados")
    this.setTotalVaccinated("Sem dados")
    this.setLethality("Sem dados")
    this.setLastCases("Sem dados")
    this.setLastDeaths("Sem dados")
    this.setLastRecovered("Sem dados")
    this.setLastVaccinated("Sem dados")
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

  setTotalVaccinated(total) {
    $("#vaccinated-values").text(total);
  }

  setLastVaccinated(total, suffix) {
    $("#last-vaccinated-values").text(total);
    $("#last-vaccinated-tag").text(suffix);
  }

  setTotalVaccinatedSecond(total) {
    $("#vaccinatedSecond-values").text(total);
  }

  setLastVaccinatedSecond(total, suffix) {
    $("#last-vaccinatedSecond-values").text(total);
    $("#last-vaccinatedSecond-tag").text(suffix);
  }
}
