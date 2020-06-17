class Layer {
    constructor(newOptions) {
        this.options = {}
        this.setOptions(newOptions)
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    getOptions() {
        return this.options
    }

    getLayer() {
        return this.layer
    }

    update(options) {
        this.setOptions(options)
        this.create()
    }

    handleClick() {

    }

    getIdField() {
        return this.options.idField
    }

    getUnique(arr, comp) {
        var listedId = [];
        var unique = [];
        for (var i = arr.length; i--;) {
            if (listedId.includes(arr[i][comp])) continue
            listedId.push(arr[i][comp])
            unique.push(arr[i])
        }
        return unique
    }

    mFormatter(num) {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + ' mil' : Math.sign(num) * Math.abs(num)
    }

    getReduce(arr, id, comp) {
        var listedId = [];
        var reduced = [];
        for (var i = arr.length; i--;) {
            var idx = listedId.indexOf(arr[i][id])
            if (idx < 0) {
                listedId.push(arr[i][id])
                reduced.push(arr[i])
            } else {
                reduced[idx][comp] = +reduced[idx][comp] + +arr[i][comp]
            }
        }
        return reduced
    }

    getUniqueGeojsonFeatures(features, comp) {
        var listedId = [];
        var unique = [];
        for (var i = features.length; i--;) {
            if (listedId.includes(features[i].properties[comp])) continue
            listedId.push(features[i].properties[comp])
            unique.push(features[i])
        }
        return unique
    }

    getPopupContent(e) {

    }

    getReduceGeojsonFeatures(features, id, comp) {
        var listedId = [];
        var reduced = [];
        for (var i = features.length; i--;) {
            if (+features[i].properties[comp] === 0) continue
            var idx = listedId.indexOf(features[i].properties[id])
            if (idx < 0) {
                listedId.push(features[i].properties[id])
                reduced.push(features[i])
            } else {
                reduced[idx].properties[comp] = +reduced[idx].properties[comp] + +features[i].properties[comp]
            }
        }
        return reduced
    }

    createUUID() {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    getLastData(data, id, dateField) {
        var listedId = [];
        var reduced = [];
        for (var i = data.length; i--;) {
            var idx = listedId.indexOf(data[i][id])
            if (idx < 0) {
                listedId.push(data[i][id])
                reduced.push(data[i])
            } else {
                var currentDate = new Date(reduced[idx][dateField].replace(/\-/g, '/'))
                var date = new Date(data[i][dateField].replace(/\-/g, '/'))
                if (currentDate < date) {
                    reduced[idx] = data[i]
                }
            }
        }
        return reduced
    }


}