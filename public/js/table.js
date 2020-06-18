class CovidTable {
    constructor(newOptions) {
        this.options = {}
        this.setOptions(newOptions)
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

    getPageLength() {
        var query = window.matchMedia("(max-height: 700px)")
        if (query.matches) {
            return 4
        }
        return 13
    }

    reloadDataset(dataset){
        this.setOptions({dataset: dataset})
        this.create()
    }

    create() {
        $(document).ready(() => {
            if ($.fn.DataTable.isDataTable(`#${this.getOptions().elementId}`)) {
                $(`#${this.getOptions().elementId}`).DataTable().destroy();
            }
            $(`#${this.getOptions().elementId}`).empty()
            $(`#${this.getOptions().elementId}`).DataTable({
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
                "bLengthChange": false,
                "bInfo": false,
                "pageLength": this.getPageLength(),
                "responsive": true,
                data: this.getOptions().dataset,
                columns: this.getOptions().columns
            });
        });
    }
}