class Status {
    constructor(dataSource) {
        this.dataSource = dataSource
    }

    loadData(data, locationName) {
        this.setLocationName(locationName)
        if (data.length < 1) {
            this.clean()
            return
        }
        this.setTotalCases(this.reduceValue(data, 'newCases'))
        this.setTotalDeaths(this.reduceValue(data, 'newDeaths'))
    }

    reduceValue(data, field) {
        var total = 0
        for (var i = data.length; i--;) {
            total += +data[i][field]
        }
        return total
    }

    clean() {
        $("#cases-values").text('Sem dados')
        $("#deaths-values").text('Sem dados')
    }

    setLocationName(locationName) {
        $("#tag-location").text(
            locationName
        )
    }

    setTotalCases(total) {
        $("#cases-values").text(total)
    }

    setTotalDeaths(total) {
        $("#deaths-values").text(total)
    }
}