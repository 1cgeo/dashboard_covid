class ChoroplethLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.vectorTiles = []
        this.create()
    }

    reload() {
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.create()
    }

    remove() {
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
            this.currentLegend = null
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.layers = []
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
                var currentDate = new Date(reduced[idx][dateField].replace('-', '/'))
                var date = new Date(data[i][dateField].replace('-', '/'))
                if (currentDate < date) {
                    reduced[idx] = data[i]
                }
            }
        }
        return {
            data: reduced,
            ids: listedId
        }
    }

    create() {
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            (jsonData) => {
                if (jsonData.length < 1) { return }
                var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers
                var mainLayer = mapLayers.find((l) => l.main)
                this.lastData = this.getLastData(jsonData, mainLayer.idField, 'date')
                if (mapLayers.length < 1) { return }
                if (processKey !== this.currentProcessKey) return
                for (var i = mapLayers.length; i--;) {
                    this.idField = mapLayers[i].idField
                    var loadOtherStyle = (mapLayers[i].main) ? false : true
                    var layer = this.createVectorGrid(
                        mapLayers[i],
                        this.options.attributeName,
                        this.options.attributeNameSecondary,
                        loadOtherStyle
                    )
                    this.options.map.getFeatureGroup().addLayer(layer)
                    this.vectorTiles.push(layer)
                    if (mapLayers[i].main) {
                        this.mainVectorTile = layer
                    }
                }
                if (!this.currentLegend) this.createLegend()
            }
        )
    }

    createVectorGrid(mapLayer, attrLabel1, attrLabel2, loadDefaultStyle) {
        var layer = L.vectorGrid.protobuf(
            mapLayer.url, {
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": (feat) => {
                        if (loadDefaultStyle) return mapLayer.style
                        var idx = this.lastData.ids.indexOf(feat[mapLayer.idField])
                        if (idx >= 0) {
                            feat.rate = +this.lastData.data[idx][attrLabel1]
                            feat[attrLabel2] = +this.lastData.data[idx][attrLabel2]
                            return this.getStyle(feat.rate, feat[attrLabel2])
                        }
                        feat.rate = 0
                        feat[attrLabel2] = 0
                        return this.getStyle(feat.rate, feat[attrLabel2])
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

    getFeatureData(featId) {
        if (!this.lastData) return
        var idx = this.lastData.ids.indexOf(featId)
        if (idx >= 0) {
            return this.lastData.data[idx]
        }
    }

    getPopupContent(e) {
        var props = e.layer.properties
        var featId = (props.CD_GEOCUF) ? props.CD_GEOCUF : props.CD_GEOCMU
        var data = this.getFeatureData(featId)
        if (!data) {
            return `
        <div class="grid-container-popup">
            <div class="header-popup">
                <div><b>${(props.NM_ESTADO)? props.NM_ESTADO: props.NM_MUNICIP }</b></div>
            </div>
            <div class="row1-popup">
                <div><b>Taxa de crescimento:</b></div>
            </div>
            <div class="value1-popup">
                <div>Sem dados</div>
            </div>
            <div class="row2-popup">
                <div><b>Número de ${(this.getAttributeName() === 'deaths')? 'óbitos' : 'casos'}:</b></div>
            </div>
            <div class="value2-popup">
                <div>Sem dados</div>
            </div>
        </div>`
        }
        return `
        <div class="grid-container-popup">
            <div class="header-popup">
                <div><b>${(props.NM_ESTADO)? props.NM_ESTADO: props.NM_MUNICIP }</b></div>
            </div>
            <div class="row1-popup">
                <div><b>Taxa de crescimento:</b></div>
            </div>
            <div class="value1-popup">
                <div>${data[this.options.attributeName]}</div>
            </div>
            <div class="row2-popup">
                <div><b>Número de ${(this.getAttributeName() === 'deaths')? 'óbitos' : 'casos'}:</b></div>
            </div>
            <div class="value2-popup">
                <div>${this.mFormatter((this.getAttributeName() === 'deaths')? +data.deaths: +data.totalCases)}</div>
            </div>
        </div>`
    }

    getStyle(attrLabel1, attrLabel2) {
        return {
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '2',
            fill: true,
            fillOpacity: 0.7,
            fillColor: this.getColor(attrLabel1, attrLabel2)
        };
    }

    getColor(attrLabel1, attrLabel2) {
        var colors = this.getHexColors()
        if (+attrLabel2 === 0) {
            return '#238b45'
        } else if (+attrLabel2 < this.getLimiteValue()) {
            return '#bae4b3'
        } else {
            return attrLabel1 < 7 ? colors[3] :
                attrLabel1 < 14 ? colors[2] :
                attrLabel1 < 30 ? colors[1] :
                colors[0];
        }
    }

    getAttributeName() {
        return this.options.attributeNameSecondary
    }

    getLimiteValue() {
        return (this.getAttributeName() === 'deaths') ? 10 : 100
    }

    getHexColors() {
        return (this.getAttributeName() === 'deaths') ? ['#f7f7f7', '#cccccc', '#969696', '#525252'] : ['#fee5d9', '#fcae91', '#fb6a4a', '#cb181d']
    }

    getLegendContent() {
        var colors = this.getHexColors()
        var tag = (this.getAttributeName() === 'deaths') ? 'Óbitos' : 'Casos'
        return `<div class="grid-choropleth-legend">
                <div class="y">
                    <div>${tag} atualmente dobrando a cada...</div>
                </div>
                <div class="a" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: ${colors[3]};">
                    </div>
                </div>
                <div class="b" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: ${colors[2]};">
                    </div>
                </div>
                <div class="c" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: ${colors[1]};">
                    </div>
                </div>
                <div class="d" style="width:80px; height:15px; background-color: none;">
                    <div style="width:60px; height:10px; background-color: ${colors[0]};">
                    </div>
                </div>
                <div class="e" style="width:70px; height:15px; background-color: none;">
                    <div style="width:40px; height:10px; background-color: #bae4b3;">
                    </div>
                </div>
                <div class="f" style="width:30px; height:15px; background-color: none;">
                    <div style="width:40px; height:10px; background-color: #238b45;">
                    </div>
                </div>
                <div class="h" style="width:50px;">
                    <div>7 dias</div>
                </div>
                <div class="i" style="width:50px; height:15px; background-color: none;">
                    <div>14 dias</div>
                </div>
                <div class="j" style="width:50px; height:15px; background-color: none;">
                    <div>30 dias</div>
                </div>
                <div class="l" style="width:90px; height:15px; background-color: none;">
                    <div> &lt; ${this.getLimiteValue()} ${tag.toLowerCase()}</div>
                </div>
                <div class="m" style="width:70px; height:15px; background-color: none;">
                    <div>Não reportados</div>
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