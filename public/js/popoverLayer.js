class PopoverLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.vectorTiles = []
        this.featureIds = []
        this.mainVectorTile = null
        this.receivedEvent = false
        this.create()
    }

    getLayers() {
        return this.vectorTiles
    }

    eventWasReceived() {
        return this.receivedEvent
    }

    remove() {
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }

    }

    reload() {
        this.remove()
        this.create()
    }

    create() {
        var mapLayers = this.options.mapLayers
        if (mapLayers.length < 1) { return }
        for (var i = mapLayers.length; i--;) {
            if (!mapLayers[i].main) continue
            var idField = mapLayers[i].idField
            var layer = L.vectorGrid.protobuf(
                mapLayers[i].url, {
                    pane: 'popover',
                    rendererFactory: L.canvas.tile,
                    vectorTileLayerStyles: {
                        "data": this.getDefaultStyle()
                    },
                    interactive: true,
                    getFeatureId: (feature) => {
                        return feature.properties[idField]
                    }
                }
            )
            this.options.map.getFeatureGroup().addLayer(layer, true)
            this.vectorTiles.push(layer)
            this.mainVectorTile = layer
            this.idField = idField
            this.mainVectorTile.on('mouseover', (e) => {
                    this.receivedEvent = true
                    this.highlightFeature(e.layer)
                })
                .on('mouseout', (e) => {
                    this.receivedEvent = false
                    this.resetHighlight(e.layer)
                        //this.options.map.getMap().closePopup()
                }).on('click', (e) => {
                    this.receivedEvent = true
                    var feat = e.layer
                    this.options.map.setBounds([
                        [feat.properties.ymin, feat.properties.xmin],
                        [feat.properties.ymax, feat.properties.xmax]
                    ])
                    this.highlightFeature(feat)
                    this.options.map.triggerChangeLocation(feat)
                })
        }
    }

    getDefaultStyle() {
        return {
            weight: 2,
            opacity: 0,
            color: 'white',
            dashArray: '3',
        }
    }

    highlightFeature(layer) {
        var featId = layer.properties[this.idField]
        this.featureIds.push(featId)
        this.mainVectorTile.setFeatureStyle(
            featId, {
                weight: 2,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            }
        )
    }

    resetHighlight(layer) {
        var featureIdsCopy = this.featureIds.slice()
        for (var i = featureIdsCopy.length; i--;) {
            this.mainVectorTile.setFeatureStyle(
                featureIdsCopy[i],
                this.getDefaultStyle()
            )
            this.featureIds.splice(i, 1)
        }
    }
}