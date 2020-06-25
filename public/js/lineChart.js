class LineChart {
    constructor(options) {
        this.options = {}
        this.setOptions(options)
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    getOptions() {
        return this.options
    }

    create2() {
        var id = 'id' + (new Date()).getTime();
        var data = this.getOptions().data
        var container = $(`#${this.getOptions().containerId}`)
        container.empty()
        var width = (this.getOptions().width) ? this.getOptions().width : +container.width()
        var height = (this.getOptions().height) ? this.getOptions().height : +container.height()
        container.append($('<canvas></canvas>')
            .attr('id', id)
            .attr('width', width)
            .attr('height', height)
        )
        var yValues = data.split('|')
        var dataSize = yValues.length
        var xMax = yValues.length - 1
        var yMax = yValues.reduce((acc, val) => {
            acc = (acc === undefined || +val > +acc) ? +val : +acc
            return acc;
        })
        var c = document.getElementById(id)
        var ctx = c.getContext("2d")
        ctx.beginPath()
        for (var x = 0; x < dataSize; x++) {
            var px = ((x * (width)) / xMax) + 1
            var py = ((+yValues[x] * (height)) / yMax) + 1
            if (x == 0) {
                ctx.moveTo(px, py)
                continue
            }
            ctx.lineTo(px, py)
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = this.getOptions().color;
        ctx.stroke()
    }

    create() {
        var data = this.getOptions().data
        var container = $(`#${this.getOptions().containerId}`)
        container.empty()
        var width = (this.getOptions().width) ? this.getOptions().width : +container.width()
        var height = (this.getOptions().height) ? this.getOptions().height : +container.height()

        var yValues = data.split('|')
        var dataSize = yValues.length
        var xMax = yValues.length - 1
        var yMax = yValues.reduce((acc, val) => {
            acc = (acc === undefined || +val > +acc) ? +val : +acc
            return acc;
        })
        var points = []
        for (var x = 0; x < dataSize; x++) {
            var px = ((x * (width - 30)) / xMax) + 1
            var py = ((+yValues[x] * (height - 10)) / yMax) + 1
            points.push(px)
            points.push(py)
        }
        return `<svg height="${height}" width="${width}">
            <polyline points="${points.join(',')}"
                style="fill:none;stroke:${this.getOptions().color};stroke-width:3" />
        </svg>`
    }


}