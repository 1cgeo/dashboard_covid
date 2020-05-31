class SliderDate {
    constructor(options) {
        this.months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        this.shortMonthsLabel = ["Jan.", "Fev.", "Mar.", "Abr.", "Maio", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."]
        this.options = {}
        this.setOptions(options)
        this.dateSlider = this.createSlider()
        this.elementIds = ["start-date", "end-date"]
        this.connectPlayButton()
        this.connectUpdateEvent((values, handle) => {
            var date = new Date(values[handle]),
                text
            if (handle === 0) {
                text = `Data inicial:    ${date.getDate()}/${this.months[date.getMonth()]}/${date.getFullYear()}`
            } else {
                text = `Data final:    ${date.getDate()}/${this.months[date.getMonth()]}/${date.getFullYear()}`
            }

            $(`#${this.elementIds[handle]}`).text(text)
        })
        this.playActive = false
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
            behaviour: 'drag',
            connect: true,
            step: 24 * 60 * 60 * 1000,
            start: this.options.dataTimeInterval,
            format: {
                from: Number,
                to: function(value) {
                    return new Date(value);
                }
            }
        })
        return dateSlider
    }

    desable() {
        this.dateSlider.setAttribute('disabled', true)
    }

    enable() {
        this.dateSlider.removeAttribute('disabled')
    }

    connectEndChange(cb) {
        this.dateSlider.noUiSlider.on('end', cb)
    }

    disconnectEndChange(cb) {
        this.dateSlider.noUiSlider.off('end', cb)
    }

    connectUpdateEvent(cb) {
        this.dateSlider.noUiSlider.on('update', function(values, handle) {
            cb(values, handle)
        })
    }

    connectPlayButton() {
        $('.play-button').on('click', () => {
            if (!this.playActive) {
                this.playActive = true
                this.setPauseButtonStyle()
                this.play()
            } else {
                this.playActive = false
                this.setPlayButtonStyle()
                this.stop()
            }
        })
    }

    setPlayButtonStyle() {
        $('.play-button i').text('play_arrow')
        $('#start-date').removeClass('active')
    }

    setPauseButtonStyle() {
        $('.play-button i').text('stop')
        $('#start-date').addClass('active')
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async play() {
        if (!this.playCallback) {
            this.setPlayButtonStyle()
            return
        }
        this.desable()
        var playTimeInterval = this.dateSlider.noUiSlider.get()
        var startDate = new Date(playTimeInterval[0])
        var currentDate = new Date(playTimeInterval[0])
        var endDate = new Date(playTimeInterval[1])
        while (currentDate < endDate) {
            if (!this.playActive) {
                return
            }
            currentDate.setDate(currentDate.getDate() + 1)
            this.dateSlider.noUiSlider.set([currentDate, endDate])
            this.playCallback([startDate, currentDate])
            await this.sleep(2000)
        }
    }

    stop() {
        this.playCallback(this.dateSlider.noUiSlider.get())
        this.enable()
        this.setPlayButtonStyle()
    }

    connectPlay(cb) {
        this.playCallback = cb
    }
}