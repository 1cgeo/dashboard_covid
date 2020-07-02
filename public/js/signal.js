class Signal {
    constructor() {
        this.events = {}
    }

    createEvent(eventName) {
        this.events[eventName] = []
    }

    connect(event, listener) {
        if (this.events[event]) {
            this.events[event].push(listener)
        }
    }

    trigger(eventName, value) {
        if (this.events[eventName]) {
            for (var i = this.events[eventName].length; i--;) {
                this.events[eventName][i](value)
            }
        }
    }
}