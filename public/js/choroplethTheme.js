class ChoroplethLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.vectorTiles = []
        this.create()
    }

    reload() {
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.create()
    }

    remove() {
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.layers = []
        this.options.map.getCurrentMapLayer().getLayers().forEach(((mapLayer) => {
            this.options.map.getFeatureGroup().addLayer(mapLayer)
        }).bind(this))
    }

    create() {
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            (jsonData) => {
                if (jsonData.length < 1) { return }
                var lastData = this.getLastData(jsonData, this.options.idField, 'date')
                this.options.map.getCurrentMapLayer().getLayers().forEach((mapLayer) => {
                    this.options.map.getFeatureGroup().removeLayer(mapLayer)
                })
                var mapLayers = this.options.map.getCurrentMapLayer().getOptions().mapLayers
                if (mapLayers.length < 1) { return }
                if (processKey !== this.currentProcessKey) return
                for (var i = mapLayers.length; i--;) {
                    this.idField = mapLayers[i].idField
                    var loadOtherStyle = (mapLayers[i].main) ? false : true
                    var layer = this.createVectorGrid(
                        mapLayers[i],
                        lastData,
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
                this.createLegend()
            }
        )
    }



    createVectorGrid(mapLayer, lastData, attrLabel1, attrLabel2, loadDefaultStyle) {
        var layer = L.vectorGrid.protobuf(
            mapLayer.url, {
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": (feat) => {
                        if (loadDefaultStyle) return mapLayer.style
                        for (var i = lastData.length; i--;) {
                            if (lastData[i][mapLayer.idField] === feat[mapLayer.idField]) {
                                feat.rate = lastData[i][attrLabel1]
                                feat.cases = lastData[i][attrLabel2]
                                return this.getStyle(
                                    lastData[i][attrLabel1],
                                    lastData[i][attrLabel2]
                                )
                            }
                        }
                        return this.getStyle(0, 0)
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
        if (+attrLabel1 == 0) {
            if (+attrLabel2 < 100) {
                return '#f2f2f2'
            }
            return '#e6e6e6'
        } else {
            return attrLabel1 < 7 ? '#ce0a05' :
                attrLabel1 < 14 ? '#FF6E0B' :
                attrLabel1 < 30 ? '#ffae43' :
                '#f2df91';
        }
    }

    createLegend() {
        var legend = L.control({ position: 'bottomleft' });
        legend.onAdd = (map) => {
            var div = L.DomUtil.create('div', '')
            div.innerHTML = `
            <div class="grid-choropleth-legend">
                <div class="y">
                    <div>Casos atualmente dobrando a cada...</div>
                </div>
                <div class="a" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: #ce0a05;">
                    </div>
                </div>
                <div class="b" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: #ff6e0b;">
                    </div>
                </div>
                <div class="c" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: #ffae43;">
                    </div>
                </div>
                <div class="d" style="width:80px; height:15px; background-color: none;">
                    <div style="width:60px; height:10px; background-color: #f2df91;">
                    </div>
                </div>
                <div class="e" style="width:70px; height:15px; background-color: none;">
                    <div style="width:40px; height:10px; background-color: #e6e6e6;">
                    </div>
                </div>
                <div class="f" style="width:30px; height:15px; background-color: none;">
                    <div style="width:40px; height:10px; background-color: #f2f2f2;">
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
                    <div> &lt; 100 casos</div>
                </div>
                <div class="m" style="width:70px; height:15px; background-color: none;">
                    <div>Sem casos reportados</div>
                </div>
            </div>
            `;
            return div;
        }
        legend.addTo(this.options.map.getMap());
        this.currentLegend = legend
    }


    handleMouseover(clickPoint) {
        return
        /*  if (this.popup) this.popup._close()
         if (!this.mainVectorTile) return
         var layer = this.getClickedFeature(clickPoint)
         if (!layer) return
         this.popup = L.popup({
                 pane: 'popup',
                 closeOnClick: true,
                 autoClose: true
             })
             .setLatLng(this.options.map.getMap().layerPointToLatLng(clickPoint))
             .setContent(this.getPopupContent(layer))
             .openOn(this.options.map.getMap()) */
    }

    getPopupContent(layer) {}

    getClickedFeature(clickPoint) {
        for (var tkey in this.mainVectorTile._vectorTiles) {
            var tile = this.mainVectorTile._vectorTiles[tkey]
            if (!tile._layers) continue
            for (var fkey in tile._layers) {
                var feat = tile._layers[fkey]
                if (!feat._containsPoint(clickPoint.subtract(tile.getOffset()))) continue
                return feat
            }
        }
    }

}