class CovidTable {
    constructor(newOptions) {
        this.options = {}
        this.setOptions(newOptions)
        window.addEventListener("resize", () => {
            if(this.table) this.table.draw()
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

    create() {
        $(document).ready(() => {
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
                "autoWidth": false,
                "bLengthChange": false,
                "bInfo": false,
                "pageLength": 10,
                "responsive": true,
                "order": [[1, "desc"]],
                "sScrollX": "100%",
                'scrollX': 'true',
                'scrollCollapse': true,
                "bScrollCollapse": true,
                data: this.getOptions().dataset,
                columns: this.getOptions().columns
            });
        });
    }
}