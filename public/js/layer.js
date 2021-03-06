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

    getDataset(){
        return this.options.datasetCallback()
    }

    loadTimeInterval() {
        this.options.loadTimeIntervalCallback(this.options.layerId)
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


}