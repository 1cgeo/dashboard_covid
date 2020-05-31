class HeatLayer extends Layer {

    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.layers = []
        this.create()
    }

    remove() {
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
            this.currentLegend = null
        }
        for (var i = this.layers.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.layers[i])
        }
        this.layers = []
    }

    reload() {
        for (var i = this.layers.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.layers[i])
        }
        this.layers = []
        this.remove()
        this.create()
    }

    create() {
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            (jsonData) => {
                if (jsonData.length < 1) { return }
                if (this.options.attributeName == "totalCases") {
                    jsonData = this.getUnique(jsonData, "ibgeID")
                } else {
                    jsonData = this.getReduce(jsonData, "ibgeID", "deaths")
                }
                var locations = []
                for (var i = jsonData.length; i--;) {
                    if (!jsonData[i].latlong[0] || !jsonData[i].latlong[1]) {
                        continue
                    }
                    locations.push(jsonData[i].latlong.concat(jsonData[i][this.options.attributeName]))
                }
                if (processKey !== this.currentProcessKey) return
                var layer = L.heatLayer(locations, {
                    interactive: true,
                    radius: 25,
                    blur: 15,
                    gradient: this.getGradientStyle(),
                    minOpacity: 0.5
                })
                this.loadVectorTile()
                this.options.map.getFeatureGroup().addLayer(layer, true)
                this.layers.push(layer)
                if (!this.currentLegend) this.createLegend()
            }
        )
    }

    getGradientStyle() {
        return {
            0.3: 'gray',
            0.6: 'purple',
            0.8: 'yellow',
            0.95: 'lime',
            1.0: 'red'
        }
    }

    loadVectorTile() {
        var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers
        if (mapLayers.length < 1) { return }
        for (var i = mapLayers.length; i--;) {
            this.idField = mapLayers[i].idField
            var isMain = mapLayers[i].main
            var layer = this.createVectorGrid(
                mapLayers[i],
                this.getVectorTileStyle(isMain)
            )
            if (isMain) {
                this.mainVectorTile = layer
            }
            this.options.map.getFeatureGroup().addLayer(layer)
            this.layers.push(layer)
        }
    }

    getVectorTileStyle(isMain) {
        if (isMain) {
            return {
                weight: 0.2,
                opacity: 0.7,
                color: 'black'
            }
        }
        return {
            weight: 1,
            opacity: 0.3,
            color: 'black'
        }
    }

    createVectorGrid(mapLayer, style) {
        var layer = L.vectorGrid.protobuf(
            mapLayer.url, {
                pane: 'vectortilepane',
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": style
                },
                interactive: true,
                getFeatureId: (feature) => {
                    return feature.properties[mapLayer.idField]
                }
            }
        )
        return layer
    }

    createLegend() {
        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = (function(map) {
            var div = L.DomUtil.create('div')
            div.innerHTML = `
            <div class="container-gradient">
            <div class="gradient-value"></div>
            <div class="gradient-text1"><b>Alta</b></div>
            <div class="gradient-text2"><b>Média</b></div>
            <div class="gradient-text3"><b>Baixa</b></div>
        </div>`
            return div;
        }).bind(this);
        legend.addTo(this.options.map.getMap());
        this.currentLegend = legend
    }

}