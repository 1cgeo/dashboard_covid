class Status {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  numberWithPoint(x) {
    if(x === 'Sem dados'){
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
    this.setTotalCases(this.numberWithPoint(this.reduceValue(data, "newCases")));
    this.setRecuperadosCases(this.numberWithPoint(this.reduceValue(data, "recovered")));
    this.setTotalDeaths(this.numberWithPoint(this.reduceValue(data, "newDeaths")));
  }

  reduceValue(data, field) {
    if (data[data.length - 1][field] === "Sem dados") {
      return "Sem dados";
    }
    var total = 0;
    for (var i = data.length; i--; ) {
      total += +data[i][field];
    }
    return total;
  }

  clean() {
    $("#cases-values").text("Sem dados");
    $("#recuperados-values").text("Sem dados");
    $("#deaths-values").text("Sem dados");
  }

  setLocationName(locationName) {
    $("#tag-location").text(locationName);
  }

  setTotalCases(total) {
    $("#cases-values").text(total);
  }

  setRecuperadosCases(total) {
    $("#recuperados-values").text(total);
  }

  setTotalDeaths(total) {
    $("#deaths-values").text(total);
  }
}
