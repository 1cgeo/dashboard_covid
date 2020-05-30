class PopoverLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.vectorTiles = []
        this.currentFeatureId = null
        this.mainVectorTile = null
        this.create()
    }

    getLayers() {
        return this.vectorTiles
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
                this.highlightFeature(e)
            }).on('mouseout', (e) => {
                this.resetHighlight(e)
            })
        }
        //this.createLegend()
    }

    getDefaultStyle() {
        return {
            weight: 2,
            opacity: 0,
            color: 'white',
            dashArray: '3',
        }
    }

    highlightFeature(e) {
        this.resetHighlight()
        this.currentFeatureId = e.layer.properties[this.idField]
        var title = (e.layer.properties.NM_ESTADO) ? e.layer.properties.NM_ESTADO : e.layer.properties.NM_MUNICIP
        $("#info-title").text(title)
        this.mainVectorTile.setFeatureStyle(
            this.currentFeatureId, {
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            }
        )
    }

    resetHighlight(e) {
        //$("#info-title").text("")
        this.mainVectorTile.setFeatureStyle(
            this.currentFeatureId,
            this.getDefaultStyle()
        )
    }

    createLegend() {
        var info = L.control();
        info.onAdd = function(map) {
            this._div = L.DomUtil.create('div', 'info-popover');
            this.update();
            return this._div;
        };
        info.update = function(props) {
            this._div.innerHTML = `<div id="info-title"></div>`
        };

        info.addTo(this.options.map.getMap());
        this.currentLegend = info
    }

    handleClick(clickPoint) {
        var feat = this.getClickedFeature(clickPoint)
        if (!feat) return
        this.options.map.setBounds([
            [feat.properties.ymin, feat.properties.xmin],
            [feat.properties.ymax, feat.properties.xmax]
        ])
        return feat
    }

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