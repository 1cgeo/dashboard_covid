class Status {
    constructor(dataSource) {
        this.dataSource = dataSource
        this.init()
    }

    init() {
        this.dataSource.getStatusData((data, locationName) => {
            this.setLocationName(locationName)
            if (data.length < 1) {
                this.clean()
                return
            }
            this.setTotalCases(data.reduce((acc, obj) => {
                if (!acc) {
                    return +obj.newCases
                }
                return (+acc + +obj.newCases)
            }))
            this.setTotalDeaths(data.reduce((acc, obj) => {
                if (!acc) {
                    return +obj.newDeaths
                }
                return (+acc + +obj.newDeaths)
            }))
        })
    }

    update() {
        this.init()
    }

    clean() {
        $("#cases-values").text('Sem dados')
        $("#deaths-values").text('Sem dados')
    }

    setLocationName(locationName) {
        $("#tag-location").text(
            (locationName.charAt(0).toUpperCase() + locationName.slice(1).toLowerCase())
        )
    }

    setTotalCases(total) {
        $("#cases-values").text(total)
    }

    setTotalDeaths(total) {
        $("#deaths-values").text(total)
    }
}