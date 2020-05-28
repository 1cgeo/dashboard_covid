

class Status {
    constructor(dataSource) {
        this.dataSource = dataSource
        this.init()
    }

    init() {
        this.dataSource.getStatusData((data, locationName) => {
            this.setLocationName(locationName)
            if(data.length < 1){
                this.clean()
                return
            }
            var lastData = this.getLastData(data, "date")
            this.setTotalCases(lastData)
            this.setTotalDeaths(lastData)
        })
    }

    update(){
        this.init()
    }

    clean(){
        $("#cases-values").text('Sem dados')
        $("#deaths-values").text('Sem dados')
    }

    setLocationName(locationName) {
        $("#location").text(locationName)
    }

    setTotalCases(lastData) {
        $("#cases-values").text(lastData.totalCases)
    }

    setTotalDeaths(lastData) {
        $("#deaths-values").text(lastData.deaths)
    }

    getLastData(data, dateField) {
        var lastData
        for (var i = data.length; i--;) {
            if (!lastData) {
                lastData = data[i]
                continue
            }
            var currentDate = new Date(lastData[dateField].replace('-', '/'))
            var date = new Date(data[i][dateField].replace('-', '/'))
            if (currentDate < date) {
                lastData = data[i]
            }
        }
        return lastData
    }
}