class ChoroplethTendencyLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.vectorTiles = []
        this.limits = []
        this.scenes = []
        this.rangeData = null
        this.create()
    }

    startAnimation() {
        this.updateAnimation()
    }

    stopAnimation() {
        this.updateAnimation()
    }

    updateAnimation() {
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        var jsonData = this.getDataset()
        if (jsonData.length < 1) { return }
        var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers
        if (mapLayers.length < 1) { return }
        var mainLayer = mapLayers.find((l) => l.main)
        this.lastData = jsonData

        if (processKey !== this.currentProcessKey) return

        this.currentPane = (this.currentPane === 'fill1') ? 'fill2' : 'fill1'
        if (this.currentPane == 'fill1') {
            this.options.map.getMap().getPane('fill2').style.zIndex = 2045
            this.options.map.getMap().getPane('fill1').style.zIndex = 2030
        }
        var layer = this.createVectorGrid(
            mainLayer,
            this.options.attributeName,
            false,
        )
        this.options.map.getFeatureGroup().addLayer(layer)
        this.mainVectorTile = layer
        this.scenes.push(layer)
        setTimeout(() => {
            if (this.scenes.length > 1) {
                var l = this.scenes.shift()
                this.options.map.getFeatureGroup().removeLayer(l)
            }
        }, 1500)
    }

    remove() {
        this.currentProcessKey = ""
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
            this.currentLegend = null
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.layers = []
        for (var i = this.limits.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.limits[i])
        }
        this.limits = []
        for (var i = this.scenes.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.scenes[i])
        }
        this.scenes = []
        this.rangeData = null
    }

    loadPanels() {
        if (!this.options.map.getMap().getPane('limitpane')) {
            this.options.map.getMap().createPane('limitpane')
            this.options.map.getMap().getPane('limitpane').style.zIndex = 2050
        }
        if (!this.options.map.getMap().getPane('fill1')) {
            this.options.map.getMap().createPane('fill1')
            this.options.map.getMap().getPane('fill1').style.zIndex = 2045
        }
        if (!this.options.map.getMap().getPane('fill2')) {
            this.options.map.getMap().createPane('fill2')
            this.options.map.getMap().getPane('fill2').style.zIndex = 2030
        }
    }

    create() {
        this.loadTimeInterval()
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        var jsonData = this.getDataset()
        if (jsonData.length < 1) { return }
        var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers
        this.lastData = jsonData
        if (mapLayers.length < 1) { return }
        if (processKey !== this.currentProcessKey) return
        this.loadPanels()
        this.loadLimits(mapLayers)
        for (var i = mapLayers.length; i--;) {
            this.idField = mapLayers[i].idField
            var loadOtherStyle = (mapLayers[i].main) ? false : true
            this.currentPane = 'fill1'
            var layer = this.createVectorGrid(
                mapLayers[i],
                this.options.attributeName,
                loadOtherStyle,
            )
            this.options.map.getFeatureGroup().addLayer(layer)
            this.vectorTiles.push(layer)
            if (mapLayers[i].main) {
                this.mainVectorTile = layer
                this.scenes.push(layer)
            }
        }
        if (!this.currentLegend) this.createLegend()
    }

    loadLimits(mapLayers) {
        for (var i = mapLayers.length; i--;) {
            var idField = mapLayers[i].idField
            var layer = L.vectorGrid.protobuf(
                mapLayers[i].url, {
                pane: 'limitpane',
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": {
                        weight: (this.options.layerId == 0) ? 0.5 : (mapLayers[i].main) ? 0.1 : 0.5,
                        opacity: 1,
                        color: 'black'
                    }
                },
                interactive: true,
                getFeatureId: (feature) => {
                    return feature.properties[idField]
                }
            }
            )
            this.options.map.getFeatureGroup().addLayer(layer)
            this.limits.push(layer)
        }
    }

    createVectorGrid(mapLayer, attrLabel, loadDefaultStyle) {
        var layer = L.vectorGrid.protobuf(
            mapLayer.url, {
            rendererFactory: L.canvas.tile,
            pane: this.currentPane,
            vectorTileLayerStyles: {
                "data": (feat) => {
                    if (loadDefaultStyle) return mapLayer.style
                    var idx = this.lastData.ids.indexOf(feat[mapLayer.idField])
                    if (idx >= 0) {
                        feat.tendency = this.lastData.data[idx][attrLabel]
                        return this.getStyle(feat.tendency)
                    }
                    return this.getStyle()
                }
            },
            interactive: true,
            getFeatureId: (feature) => {
                return feature.properties[mapLayer.idField]
            }
        }
        )
        return layer
    }

    getStyle(tendencyValue) {
        var color
        if (!tendencyValue) {
            color = this.getColor()
        } else {
            color = this.getColor(tendencyValue)
        }
        return {
            weight: 0,
            opacity: 0,
            color: 'white',
            dashArray: '2',
            fill: true,
            fillOpacity: 1,
            fillColor: color
        }
    }

    getColor(tendencyValue) {
        var found
        if (!tendencyValue) {
            found = this.getOptions().mapValues.find(element => element.default)
        } else {
            found = this.getOptions().mapValues.find((element) => {
                return (
                    element.value.toLowerCase().replace(/ /g, '')
                    ==
                    tendencyValue.toLowerCase().replace(/ /g, '')
                )
            })
        }
        return found.color
    }

    showPopup(e) {
        L.popup({
            pane: 'popup',
            closeButton: false
        })
            .setLatLng(
                this.options.map.getMap().layerPointToLatLng(e.layerPoint)
            )
            .setContent(this.getPopupContent(e))
            .openOn(this.options.map.getMap());
    }

    getAttributeName() {
        return this.options.attributeNameSecondary
    }

    getLimiteValue() {
        return (this.getAttributeName() === 'deaths') ? 10 : 100
    }

    getLegendContent() {
        var tag = (this.getAttributeName() === 'deaths') ? 'óbitos' : 'casos'
        return `<div class="grid-choropleth-tendency-legend">
            <div class="y">
                <div>Como o número de novos ${tag} mudou nas últimas duas semanas
                </div>
            </div>
            <div class="a" style="width:110px; height:15px; background-color: none;">
                <div style="width:80px; height:10px; background-color: ${this.getColor('Diminuindo')};">
                </div>
            </div>
            <div class="b" style="width:110px; height:15px; background-color: none;">
                <div style="width:80px; height:10px; background-color: ${this.getColor('Aproximadamente o mesmo')};">
                </div>
            </div>
            <div class="c" style="width:80px; height:15px; background-color: none;">
                <div style="width:80px; height:10px; background-color: ${this.getColor('Crescendo 1')};">
                </div>
            </div>
            <div class="d" style="width:80px; height:15px; background-color: none;">
                <div style="width:80px; height:10px; background-color: ${this.getColor('Crescendo 2')};">
                </div>
            </div>
            <div class="e" style="width:110px; height:15px; background-color: none;">
                <div style="width:80px; height:10px; background-color: ${this.getColor('Crescendo 3')};">
                </div>
            </div>
            <div class="f" style="width:30px; height:15px; background-color: none;">
                <div style="width:80px; height:10px; background-color: ${this.getColor('Sem ou poucos casos')};">
                </div>
            </div>
            <div class="g text-center" style="width:80px;">
                <div>Diminuindo</div>
            </div>
            <div class="h text-center" style="width:80px; height:15px; background-color: none;">
                <div>Aprox. o mesmo</div>
            </div>
            <div class="j text-center" style="width:100px; height:15px; background-color: none;">
                <div>Crescendo <span class="material-icons">
                arrow_right_alt
                </span></div>
            </div>
            <div class="m text-center" style="width:80px; height:15px; background-color: none;">
                <div>Sem ou poucos casos</div>
            </div>
        </div>`
    }

    createLegend() {
        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = (map) => {
            var div = L.DomUtil.create('div', '')
            div.innerHTML = this.getLegendContent()
            return div;
        }
        legend.addTo(this.options.map.getMap());
        this.currentLegend = legend
    }
}