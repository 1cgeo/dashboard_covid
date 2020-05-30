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
        }
        //this.options.map.getFeatureGroup().removeLayer(this.layer)
        for (var i = this.layers.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.layers[i])
        }
        this.layers = []
        this.options.map.getCurrentMapLayer().getLayers().forEach(((mapLayer) => {
            this.options.map.getFeatureGroup().addLayer(mapLayer)
        }).bind(this))
    }

    reload() {
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
                    if (jsonData[i].latlong.length < 2) {
                        continue
                    }
                    locations.push(jsonData[i].latlong.concat(jsonData[i][this.options.attributeName]))
                }
                if (processKey !== this.currentProcessKey) return
                var layer = L.heatLayer(locations, {
                    pane: 'heatpane',
                    interactive: true,
                    radius: 25,
                    blur: 15,
                    gradient: this.getGradientStyle(),
                    minOpacity: 0.5
                })
                this.loadVectorTile()
                this.options.map.getFeatureGroup().addLayer(layer, true)
                this.layers.push(layer)
                this.createLegend()
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
        this.options.map.getCurrentMapLayer().getLayers().forEach((mapLayer) => {
            this.options.map.getFeatureGroup().removeLayer(mapLayer)
        })
        var mapLayers = this.options.map.getCurrentMapLayer().getOptions().mapLayers
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
                weight: 0.5,
                opacity: 0.7,
                color: 'black'
            }
        }
        return {
            weight: 1,
            opacity: 0.7,
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
            var div = L.DomUtil.create('div', 'info legend'),
                labels = []
            var gradient = this.getGradientStyle()
            var gradientKeys = Object.keys(gradient).map(v => +v).sort().reverse()
            for (var key of gradientKeys) {
                labels.push(
                    `<i style="background: ${gradient[key]}"></i> &lt; ${100*+key}%`
                )
            }
            div.innerHTML = labels.join('<br>');
            return div;
        }).bind(this);
        legend.addTo(this.options.map.getMap());
        this.currentLegend = legend
    }

}