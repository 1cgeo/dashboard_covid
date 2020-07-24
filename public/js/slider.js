class SliderDate {
    constructor(options) {
        this.months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        this.shortMonthsLabel = ["Jan.", "Fev.", "Mar.", "Abr.", "Maio", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."]
        this.options = {}
        this.elementIds = ["start-date", "end-date"]
        this.playActive = false
        this.setOptions(options)
        this.createSlider()
        this.createEvents()
        this.connectPlayButton()
    }

    createEvents() {
        this.events = new Signal()
        this.events.createEvent('endChange')
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
                to: function (value) {
                    return new Date(value);
                }
            }
        })
        this.dateSlider = dateSlider
        this.connectSliderEvents()
    }

    reloadSliderOptions(newOptions) {
        this.dateSlider.noUiSlider.destroy()
        var dateSlider = document.getElementById("slider-date");
        noUiSlider.create(dateSlider, newOptions)
        this.dateSlider = dateSlider
        this.connectSliderEvents()
        /* setTimeout(() => {
            this.events.trigger('changeGroupData', newOptions.start.map(v => Math.floor(v)))
        }, 1000) */
    }

    /* updateSliderOtions(options) {
        this.dateSlider.noUiSlider.updateOptions(options)
    } */

    connectSliderEvents() {
        this.dateSlider.noUiSlider.on('end', (timeInterval) => {
            setTimeout(() => this.events.trigger('endChange', timeInterval.map(v => Math.floor(v))), 1000)
        })
        this.dateSlider.noUiSlider.on('update', (values, handle) => {
            this.setLabelSlider(values, handle)
        })
    }

    setLabelSlider(values, handle) {
        $(`#${this.elementIds[handle]}`).text(
            this.getLabelValue(values, handle)
        )
    }

    getLabelValue(values, handle) {
        if (this.options.dataSource.getCurrentGroupData() == 'day') {
            var date = new Date(values[handle]),
                text
            if (handle === 0) {
                text = `Data inicial:    ${date.getDate()}/${this.months[date.getMonth()]}/${date.getFullYear()}`
            } else {
                text = `Data final:    ${date.getDate()}/${this.months[date.getMonth()]}/${date.getFullYear()}`
            }
            return text
        }
        var week = Math.floor(values[handle]),
            text
        if (handle === 0) {
            text = `Semana inicial:    ${week}`
        } else {
            text = `Semana final:    ${week}`
        }
        return text
    }

    desable() {
        this.dateSlider.setAttribute('disabled', true)
    }

    enable() {
        this.dateSlider.removeAttribute('disabled')
    }

    on(eventName, listener) {
        this.events.connect(eventName, listener)
    }

    connectPlayButton() {
        $('.play-button').on('click', () => {
            if (!this.playActive) {
                this.playActive = true
                this.setPauseButtonStyle()
                $("#group-data-by").val() == 'week' ? this.playByWeek() : this.playByDay()
            } else {
                this.playActive = false
                this.setPlayButtonStyle()
                this.stop()
            }
        })
    }

    setPlayButtonStyle() {
        $('.play-button i').text('play_arrow')
    }

    setPauseButtonStyle() {
        $('.play-button i').text('stop')
    }

    async playByDay() {
        this.startAnimationCb()
        this.desable()
        var playTimeInterval = this.dateSlider.noUiSlider.get()
        var startDate = new Date(playTimeInterval[0])
        var currentDate = new Date(playTimeInterval[0])
        var endDate = new Date(playTimeInterval[1])
        //$('#end-date').addClass('active')
        while (currentDate < endDate) {
            if (!this.playActive) {
                //$('#current-date').text('')
                //$('#end-date').removeClass('active')
                this.dateSlider.noUiSlider.set([startDate, endDate])
                this.stopAnimationCb([startDate, endDate])
                return
            }
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate = (currentDate > endDate) ? endDate : currentDate
            this.dateSlider.noUiSlider.set([startDate, currentDate])
            this.updateAnimationCb([startDate, currentDate])
            await sleep(1000)
        }
        //$('#current-date').text('')
        //$('#end-date').removeClass('active')
        this.playActive = false
        this.setPlayButtonStyle()
        this.stop()
    }

    async playByWeek() {
        this.startAnimationCb()
        this.desable()
        var playTimeInterval = this.dateSlider.noUiSlider.get()
        var startWeek = +playTimeInterval[0]
        var endWeek = +playTimeInterval[1]
        var currentWeek = +playTimeInterval[0]
        while (currentWeek < endWeek) {
            if (!this.playActive) {
                this.dateSlider.noUiSlider.set([startWeek, endWeek])
                this.stopAnimationCb([startWeek, endWeek])
                return
            }
            currentWeek++
            currentWeek = (currentWeek > endWeek) ? endWeek : currentWeek
            this.dateSlider.noUiSlider.set([startWeek, currentWeek])
            this.updateAnimationCb([startWeek, currentWeek])
            await sleep(4000)
        }
        this.playActive = false
        this.setPlayButtonStyle()
        this.stop()
    }

    stop() {
        //this.stopAnimationCb(this.dateSlider.noUiSlider.get())
        this.enable()
        this.setPlayButtonStyle()
    }

    connectUpdateAnimation(cb) {
        this.updateAnimationCb = cb
        return this
    }

    connectStartAnimation(cb) {
        this.startAnimationCb = cb
        return this
    }

    connectStopAnimation(cb) {
        this.stopAnimationCb = cb
        return this
    }
}