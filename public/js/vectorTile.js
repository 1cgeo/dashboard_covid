class VectorTileLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.vectorTiles = []
        this.mainVectorTile = null
        this.create()
    }

    getLayers() {
        return this.vectorTiles
    }

    remove() {
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }

    }

    reload() {
        this.remove()
        this.create()
    }

    getThemeLayer(themeLayerId) {
        var found = this.options.themeLayers.find((elem) => {
            return elem.id == themeLayerId
        })
        if (!found) return
        found.layerId = this.options.id
        found.idField = this.idField
        return found
    }

    create() {
        var mapLayers = this.options.mapLayers
        if (mapLayers.length < 1) { return }
        for (var i = mapLayers.length; i--;) {
            var idField = mapLayers[i].idField
            var layer = L.vectorGrid.protobuf(
                mapLayers[i].url, {
                    rendererFactory: L.canvas.tile,
                    vectorTileLayerStyles: {
                        "data": mapLayers[i].style
                    },
                    interactive: true,
                    getFeatureId: (function(feature) {
                        return feature.properties[idField]
                    }).bind(this)
                }
            )
            this.options.map.getFeatureGroup().addLayer(layer, true)
            this.vectorTiles.push(layer)
            if (mapLayers[i].main) {
                this.mainVectorTile = layer
                this.idField = idField
            }
        }
    }
}