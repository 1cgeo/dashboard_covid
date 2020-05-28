class SliderDate {
    constructor(options) {
        this.months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        this.shortMonthsLabel = ["Jan.", "Fev.", "Mar.", "Abr.", "Maio", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."]
        this.options = {}
        this.setOptions(options)
        this.dateSlider = this.createSlider()
        this.elementIds = ["start-date", "end-date"]
        this.connectUpdateEvent((values, handle) => {
            var date = new Date(values[handle]), text
            if (handle === 0) {
                text = `Data inicial:    ${date.getDate()}/${this.months[date.getMonth()]}/${date.getFullYear()}`
            }else{
                text = `Data final:    ${date.getDate()}/${this.months[date.getMonth()]}/${date.getFullYear()}`
            }
            
            $(`#${this.elementIds[handle]}`).text(text)
        })
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    createSlider() {
        var dateSlider = document.getElementById("slider-date");
        noUiSlider.create(dateSlider, {
            range: {
                min: this.options.dataTimeInterval[0],
                max: this.options.dataTimeInterval[1]
            },
            //tooltips: [true, true],
            connect: true,
            step: 24 * 60 * 60 * 1000,
            start: this.options.dataTimeInterval,
            format: {
                from: Number,
                to: function (value) {
                    return new Date(value);
                }
            }
        })
        return dateSlider
    }

    timestamp(str) {
        return new Date(str).getTime();
    }

    connectEndChange(cb) {
        this.dateSlider.noUiSlider.on('end', cb)
    }

    disconnectEndChange(cb) {
        this.dateSlider.noUiSlider.off('end', cb)
    }

    connectUpdateEvent(cb) {
        this.dateSlider.noUiSlider.on('update', function (values, handle) {
            cb(values, handle)
        })
    }
}