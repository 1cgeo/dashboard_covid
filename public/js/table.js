class CovidTable {
    constructor(newOptions) {
        this.options = {}
        this.setOptions(newOptions)
        window.addEventListener("resize", () => {
            if (!this.table) return
            this.table.draw(false)
        })
        this.create()
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