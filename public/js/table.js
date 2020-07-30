class CovidTable {
    constructor(newOptions) {
        $.fn.dataTable.ext.errMode = 'none';
        this.options = {}
        this.setOptions(newOptions)
        window.addEventListener("resize", () => {
            if (!this.table) return
            this.table.draw(false)
        })
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    getOptions() {
        return this.options
    }

    getScrolly() {
        var query = window.matchMedia("(max-height: 700px)")
        if (query.matches) {
            return '40vh'
        }
        return '50vh'
    }

    reloadDataset(dataset) {
        this.setOptions({ dataset: dataset })
        this.create()
    }

    getColumnsDefs() {
        return [
            { "className": "dt-center", "targets": "_all" }
        ].concat(
            this.getOptions().columnDefs
        )
    }

    changeColumnName(colIdx, colName) {
        this.getOptions().columns[colIdx].title = colName
        this.create()
    }

    filterColumn(colIdx, value) {
        if (!this.table) return
        this.table.columns(colIdx).search(
            value,
            true
        ).draw()
    }

    updateDataset(layerOptions) {
    }

    changeLayer(layerOptions) {
    }

    changeLocation(featureClicked, layerOptions) {
    }

    getColumnName(colIdx) {
        return this.getOptions().columns[colIdx].title
    }

    create() {
        if ($.fn.DataTable.isDataTable(`#${this.getOptions().elementId}`)) {
            $(`#${this.getOptions().elementId}`).DataTable().destroy();
        }
        $(`#${this.getOptions().elementId}`).empty()
        this.table = $(`#${this.getOptions().elementId}`).DataTable({
            language: {
                search: "Pesquisar:",
                "oPaginate": {
                    "sNext": "Próximo",
                    "sPrevious": "Anterior",
                    "sFirst": "Primeiro",
                    "sLast": "Último"
                },
                "sZeroRecords": "Nenhum registro encontrado"
            },
            "drawCallback": this.getOptions().drawCallback,
            "autoWidth": false,
            "bLengthChange": false,
            "bInfo": false,
            "pageLength": 10,
            "responsive": true,
            "order": [[2, "desc"]],
            "sScrollX": "100%",
            'scrollX': 'true',
            'scrollCollapse': true,
            "bScrollCollapse": true,
            scroller: {
                rowHeight: 10
            },
            data: this.getOptions().dataset,
            "columnDefs": this.getColumnsDefs(),
            columns: this.getOptions().columns
        });
    }
}



class CovidTableState extends CovidTable {
    constructor(newOptions) {
        var optionsDefault = {
            "drawCallback": function (settings) {
                var api = this.api()
                var rowIds = api.rows({ page: 'current' }).indexes()
                for (var i = rowIds.length; i--;) {
                    var containerId = `linechart-container-${rowIds[i]}`
                    var lineChart = new LineChart({
                        width: 90,
                        height: 40,
                        data: api.row(rowIds[i]).data().last14AvgCases,
                        containerId: containerId,
                        color: dataSource.getTendencyColor(
                            api.row(rowIds[i]).data().tendencyCases
                        )
                    })
                    $(`#${containerId}`).append(lineChart.create())
                }
            },
            "columnDefs": [
                {
                    "render": function (data, type, row, meta) {
                        return ``
                    },
                    "targets": 7
                },
                {
                    "render": function (data, type, row, meta) {
                        return `${data} %`
                    },
                    "targets": 6
                },
                {
                    "targets": 7,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        $(td).attr('id', `linechart-container-${row}`)
                    }
                },
                {
                    "render": function (data, type, row, meta) {
                        return numberWithPoint(Math.floor(data))
                    },
                    "targets": [2, 3, 4, 5]
                },
                { type: 'formatted-num', targets: [2, 3, 4, 5] }
            ],
            columns: [
                { title: "id", visible: false, data: "id", },
                { title: "Estados", data: "name" },
                { title: "Casos confirmados", data: "totalCases" },
                { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                { title: "Óbitos", data: "deaths" },
                { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                { title: "Letalidade", data: "fatalityRate" },
                {
                    title: "Tendência de casos dos últimos 14 dias",
                    sortable: false,
                    data: "last14AvgCases",
                    "width": "12%"
                }
            ]
        }
        super(Object.assign(optionsDefault, newOptions))
        this.updateDataset()
    }

    updateDataset() {
        this.setOptions({dataset: this.getOptions().dataSource.getStateChoroplethData().data})
        this.create()
    }

    changeLocation(featureClicked) {
        if (!featureClicked) {
            if (this.getColumnName(1) == 'Municípios') {
                this.changeColumnName(1, 'Estados')
                this.reloadDataset(
                    this.getOptions().dataSource.getStateChoroplethData().data
                )
            }
            this.filterColumn(0, '')
        }
        else {
            this.changeColumnName(1, 'Municípios')
            this.reloadDataset(
                this.getOptions().dataSource.getCityChoroplethData().data
            )
            this.filterColumn(0, `^${featureClicked.properties.CD_GEOCUF}`)
        }
    }
}


class CovidTableCity extends CovidTable {
    constructor(newOptions) {
        var optionsDefault = {
            "drawCallback": function (settings) {
                var api = this.api()
                var rowIds = api.rows({ page: 'current' }).indexes()
                for (var i = rowIds.length; i--;) {
                    var containerId = `linechart-container-${rowIds[i]}`
                    var lineChart = new LineChart({
                        width: 90,
                        height: 40,
                        data: api.row(rowIds[i]).data().last14AvgCases,
                        containerId: containerId,
                        color: dataSource.getTendencyColor(
                            api.row(rowIds[i]).data().tendencyCases
                        )
                    })
                    $(`#${containerId}`).append(lineChart.create())
                }
            },
            "columnDefs": [
                {
                    "render": function (data, type, row, meta) {
                        return ``
                    },
                    "targets": 7
                },
                {
                    "render": function (data, type, row, meta) {
                        return `${data} %`
                    },
                    "targets": 6
                },
                {
                    "targets": 7,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        $(td).attr('id', `linechart-container-${row}`)
                    }
                },
                {
                    "render": function (data, type, row, meta) {
                        return numberWithPoint(Math.floor(data))
                    },
                    "targets": [2, 3, 4, 5]
                },
                { type: 'formatted-num', targets: [2, 3, 4, 5] }
            ],
            columns: [
                { title: "id", visible: false, data: "id", },
                { title: "Municípios", data: "name" },
                { title: "Casos confirmados", data: "totalCases" },
                { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                { title: "Óbitos", data: "deaths" },
                { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                { title: "Letalidade", data: "fatalityRate" },
                {
                    title: "Tendência de casos dos últimos 14 dias",
                    sortable: false,
                    data: "last14AvgCases",
                    "width": "12%"
                }
            ]
        }
        super(Object.assign(optionsDefault, newOptions))
        this.updateDataset()
    }

    updateDataset() {
        this.setOptions({dataset: this.getOptions().dataSource.getCityChoroplethData().data})
        this.create()
    }

    changeLocation(featureClicked) {
        if (!featureClicked) {
            this.filterColumn(0, '')
        }
        else {
            this.filterColumn(0, `^${featureClicked.properties.CD_GEOCMU.slice(0, 2)}`)
        }
    }
}

class CovidTableRegions extends CovidTable {
    constructor(newOptions) {
        var optionsDefault = {
            "drawCallback": function (settings) {
                var api = this.api()
                var rowIds = api.rows({ page: 'current' }).indexes()
                for (var i = rowIds.length; i--;) {
                    var containerId = `linechart-container-${rowIds[i]}`
                    var lineChart = new LineChart({
                        width: 90,
                        height: 40,
                        data: api.row(rowIds[i]).data().last14AvgCases,
                        containerId: containerId,
                        color: dataSource.getTendencyColor(
                            api.row(rowIds[i]).data().tendencyCases
                        )
                    })
                    $(`#${containerId}`).append(lineChart.create())
                }
            },
            "columnDefs": [
                {
                    "render": function (data, type, row, meta) {
                        return ``
                    },
                    "targets": 7
                },
                {
                    "render": function (data, type, row, meta) {
                        return `${data} %`
                    },
                    "targets": 6
                },
                {
                    "targets": 7,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        $(td).attr('id', `linechart-container-${row}`)
                    }
                },
                {
                    "render": function (data, type, row, meta) {
                        return numberWithPoint(Math.floor(data))
                    },
                    "targets": [2, 3, 4, 5]
                },
                { type: 'formatted-num', targets: [2, 3, 4, 5] }
            ],
            columns: [
                { title: "id", visible: false, data: "name", },
                { title: "Regiões", data: "name" },
                { title: "Casos confirmados", data: "totalCases" },
                { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                { title: "Óbitos", data: "deaths" },
                { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                { title: "Letalidade", data: "fatalityRate" },
                {
                    title: "Tendência de casos dos últimos 14 dias",
                    sortable: false,
                    data: "last14AvgCases",
                    "width": "12%"
                }
            ]
        }
        super(Object.assign(optionsDefault, newOptions))
        this.updateDataset()
    }

    updateDataset() {
        this.setOptions({dataset: this.getOptions().dataSource.getRegionsChoroplethData().data})
        this.create()
    }

    changeLocation(featureClicked) {
        if (!featureClicked) {
            if (this.getColumnName(1) == 'Estados') {
                this.changeColumnName(1, 'Regiões')
                this.setOptions({
                    columns: [
                        { title: "id", visible: false, data: "name", },
                        { title: "Regiões", data: "name" },
                        { title: "Casos confirmados", data: "totalCases" },
                        { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                        { title: "Óbitos", data: "deaths" },
                        { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                        { title: "Letalidade", data: "fatalityRate" },
                        {
                            title: "Tendência de casos dos últimos 14 dias",
                            sortable: false,
                            data: "last14AvgCases",
                            "width": "12%"
                        }
                    ]
                })
                this.reloadDataset(
                    this.getOptions().dataSource.getRegionsChoroplethData().data
                )
            }
            this.filterColumn(0, '')
        }
        else {
            this.changeColumnName(1, 'Estados')
            this.setOptions({
                columns: [
                    { title: "id", visible: false, data: "region", },
                    { title: "Estados", data: "name" },
                    { title: "Casos confirmados", data: "totalCases" },
                    { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                    { title: "Óbitos", data: "deaths" },
                    { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                    { title: "Letalidade", data: "fatalityRate" },
                    {
                        title: "Tendência de casos dos últimos 14 dias",
                        sortable: false,
                        data: "last14AvgCases",
                        "width": "12%"
                    }
                ]
            })
            this.reloadDataset(
                this.getOptions().dataSource.getStateChoroplethData().data
            )
            this.filterColumn(0, `^${featureClicked.properties.REGIAO}`)
        }
    }
}


class CovidTableAPI extends CovidTable {
    constructor(newOptions) {
        var optionsDefault = {
            "drawCallback": function (settings) {
                var api = this.api()
                var rowIds = api.rows({ page: 'current' }).indexes()
                for (var i = rowIds.length; i--;) {
                    var containerId = `linechart-container-${rowIds[i]}`
                    var lineChart = new LineChart({
                        width: 90,
                        height: 40,
                        data: api.row(rowIds[i]).data().last14AvgCases,
                        containerId: containerId,
                        color: dataSource.getTendencyColor(
                            api.row(rowIds[i]).data().tendencyCases
                        )
                    })
                    $(`#${containerId}`).append(lineChart.create())
                }
            },
            "columnDefs": [
                {
                    "render": function (data, type, row, meta) {
                        return ``
                    },
                    "targets": 7
                },
                {
                    "render": function (data, type, row, meta) {
                        return `${data} %`
                    },
                    "targets": 6
                },
                {
                    "targets": 7,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        $(td).attr('id', `linechart-container-${row}`)
                    }
                },
                {
                    "render": function (data, type, row, meta) {
                        return numberWithPoint(Math.floor(data))
                    },
                    "targets": [2, 3, 4, 5]
                },
                { type: 'formatted-num', targets: [2, 3, 4, 5] }
            ],
            columns: [
                { title: "id", visible: false, data: "name", },
                { title: "API", data: "name" },
                { title: "Casos confirmados", data: "totalCases" },
                { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                { title: "Óbitos", data: "deaths" },
                { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                { title: "Letalidade", data: "fatalityRate" },
                {
                    title: "Tendência de casos dos últimos 14 dias",
                    sortable: false,
                    data: "last14AvgCases",
                    "width": "12%"
                }
            ]
        }
        super(Object.assign(optionsDefault, newOptions))
        this.updateDataset()
    }

    updateDataset() {
        this.setOptions({dataset: this.getOptions().dataSource.getAPIChoroplethData().data})
        this.create()
    }

    changeLocation(featureClicked) {
        if (!featureClicked) {
            if (this.getColumnName(1) == 'Municípios') {
                this.changeColumnName(1, 'API')
                this.setOptions({
                    columns: [
                        { title: "id", visible: false, data: "name", },
                        { title: "API", data: "name" },
                        { title: "Casos confirmados", data: "totalCases" },
                        { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                        { title: "Óbitos", data: "deaths" },
                        { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                        { title: "Letalidade", data: "fatalityRate" },
                        {
                            title: "Tendência de casos dos últimos 14 dias",
                            sortable: false,
                            data: "last14AvgCases",
                            "width": "12%"
                        }
                    ]
                })
                this.reloadDataset(
                    this.getOptions().dataSource.getAPIChoroplethData().data
                )
            }
            this.filterColumn(0, '')
        }
        else {
            this.changeColumnName(1, 'Municípios')
            this.setOptions({
                columns: [
                    { title: "id", visible: false, data: "api", },
                    { title: "Municípios", data: "name" },
                    { title: "Casos confirmados", data: "totalCases" },
                    { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                    { title: "Óbitos", data: "deaths" },
                    { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                    { title: "Letalidade", data: "fatalityRate" },
                    {
                        title: "Tendência de casos dos últimos 14 dias",
                        sortable: false,
                        data: "last14AvgCases",
                        "width": "12%"
                    }
                ]
            })
            this.reloadDataset(
                this.getOptions().dataSource.getCityChoroplethData().data
            )
            this.filterColumn(0, `^${featureClicked.properties.nome}`)
        }
    }
}


class CovidTableSAPI extends CovidTable {
    constructor(newOptions) {
        var optionsDefault = {
            "drawCallback": function (settings) {
                var api = this.api()
                var rowIds = api.rows({ page: 'current' }).indexes()
                for (var i = rowIds.length; i--;) {
                    var containerId = `linechart-container-${rowIds[i]}`
                    var lineChart = new LineChart({
                        width: 90,
                        height: 40,
                        data: api.row(rowIds[i]).data().last14AvgCases,
                        containerId: containerId,
                        color: dataSource.getTendencyColor(
                            api.row(rowIds[i]).data().tendencyCases
                        )
                    })
                    $(`#${containerId}`).append(lineChart.create())
                }
            },
            "columnDefs": [
                {
                    "render": function (data, type, row, meta) {
                        return ``
                    },
                    "targets": 7
                },
                {
                    "render": function (data, type, row, meta) {
                        return `${data} %`
                    },
                    "targets": 6
                },
                {
                    "targets": 7,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        $(td).attr('id', `linechart-container-${row}`)
                    }
                },
                {
                    "render": function (data, type, row, meta) {
                        return numberWithPoint(Math.floor(data))
                    },
                    "targets": [2, 3, 4, 5]
                },
                { type: 'formatted-num', targets: [2, 3, 4, 5] }
            ],
            columns: [
                { title: "id", visible: false, data: "name", },
                { title: "SAPI", data: "name" },
                { title: "Casos confirmados", data: "totalCases" },
                { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                { title: "Óbitos", data: "deaths" },
                { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                { title: "Letalidade", data: "fatalityRate" },
                {
                    title: "Tendência de casos dos últimos 14 dias",
                    sortable: false,
                    data: "last14AvgCases",
                    "width": "12%"
                }
            ]
        }
        super(Object.assign(optionsDefault, newOptions))
        this.updateDataset()
    }

    updateDataset() {
        this.setOptions({dataset: this.getOptions().dataSource.getSAPIChoroplethData().data})
        this.create()
    }

    changeLocation(featureClicked) {
        if (!featureClicked) {
            if (this.getColumnName(1) == 'Municípios') {
                this.changeColumnName(1, 'SAPI')
                this.setOptions({
                    columns: [
                        { title: "id", visible: false, data: "name", },
                        { title: "SAPI", data: "name" },
                        { title: "Casos confirmados", data: "totalCases" },
                        { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                        { title: "Óbitos", data: "deaths" },
                        { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                        { title: "Letalidade", data: "fatalityRate" },
                        {
                            title: "Tendência de casos dos últimos 14 dias",
                            sortable: false,
                            data: "last14AvgCases",
                            "width": "12%"
                        }
                    ]
                })
                this.reloadDataset(
                    this.getOptions().dataSource.getSAPIChoroplethData().data
                )
            }
            this.filterColumn(0, '')
        }
        else {
            this.changeColumnName(1, 'Municípios')
            this.setOptions({
                columns: [
                    { title: "id", visible: false, data: "sapi", },
                    { title: "Municípios", data: "name" },
                    { title: "Casos confirmados", data: "totalCases" },
                    { title: "Casos a cada 100.000 hab.", data: "totalCases_per_100k_inhabitants" },
                    { title: "Óbitos", data: "deaths" },
                    { title: "Óbitos a cada 100.000 hab.", data: "deaths_per_100k_inhabitants" },
                    { title: "Letalidade", data: "fatalityRate" },
                    {
                        title: "Tendência de casos dos últimos 14 dias",
                        sortable: false,
                        data: "last14AvgCases",
                        "width": "12%"
                    }
                ]
            })
            this.reloadDataset(
                this.getOptions().dataSource.getCityChoroplethData().data
            )
            this.filterColumn(0, `^${featureClicked.properties.nome}`)
        }
    }
}