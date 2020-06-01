class CirclesLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.layers = []
        this.circlesData = {
            ids: [],
            features: []
        }
        this.create()
    }

    remove() {
        this.currentProcessKey = ""
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
            this.currentLegend = null
        }
        if (this.layer) {
            this.options.map.getFeatureGroup().removeLayer(this.layer)
        }
        for (var i = this.layers.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.layers[i])
        }
        this.layers = []
        this.circlesData.ids = []
        this.circlesData.features = []
    }

    reload() {
        for (var i = this.layers.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.layers[i])
        }
        this.layers = []
        if (this.layer) {
            this.options.map.getFeatureGroup().removeLayer(this.layer)
        }
        this.circlesData.ids = []
        this.circlesData.features = []
        this.create()
    }

    processGeoJSON(layerId, attributeName, jsonData) {
        if (layerId === 0 && attributeName == 'totalCases') {
            jsonData.features = this.getUniqueGeojsonFeatures(jsonData.features, "state")
        } else if (layerId === 0 && attributeName == 'deaths') {
            jsonData.features = this.getReduceGeojsonFeatures(jsonData.features, "state", "deaths")
        } else if (layerId === 1 && attributeName == 'totalCases') {
            jsonData.features = this.getUniqueGeojsonFeatures(jsonData.features, "city")
        } else if (layerId === 1 && attributeName == 'deaths') {
            jsonData.features = this.getReduceGeojsonFeatures(jsonData.features, "city", "deaths")
        }
        return jsonData
    }

    getCircleStyle() {
        return {
            fillColor: (this.options.attributeName == 'deaths') ? '#555555' : '#CF1111',
            color: (this.options.attributeName == 'deaths') ? '#555555' : "#cf1111",
            weight: 1,
            fillOpacity: 0.3,
            opacity: 0.3
                /* pane: 'popover' */
        }
    }

    create() {
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            (jsonData, options) => {
                jsonData = this.processGeoJSON(
                    this.options.layerId,
                    this.options.attributeName,
                    jsonData
                )
                if (processKey !== this.currentProcessKey) return
                this.layer = L.geoJson(
                    jsonData, {
                        pointToLayer: (feature, latlng) => {
                            if (!latlng.lat || !latlng.lng) return
                            var circle = L.circleMarker(
                                latlng,
                                this.getCircleStyle()
                            )
                            circle.getCircleStyle = this.getCircleStyle.bind(this)
                            this.circlesData.ids.push(feature.properties.ibgeID)
                            this.circlesData.features.push(circle)
                            return circle
                        }
                    }
                ).addTo(this.options.map.getFeatureGroup())
                this.updatePropSymbols()
                if (!this.currentLegend) this.createLegend()
                this.loadVectorTile()
            }

        )
    }

    loadVectorTile() {
        var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers
        if (mapLayers.length < 1) { return }
        for (var i = mapLayers.length; i--;) {
            this.idField = mapLayers[i].idField
            var isMain = mapLayers[i].main
            var layer = this.createVectorGrid(
                mapLayers[i],
                (!isMain) ? mapLayers[i].style : {
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fill: true,
                    fillOpacity: 0.2,
                    fillColor: "#cfcfcf"
                }
            )
            if (isMain) {
                this.mainVectorTile = layer
            }
            this.options.map.getFeatureGroup().addLayer(layer)
            this.layers.push(layer)
        }
    }

    createVectorGrid(mapLayer, style) {
        var layer = L.vectorGrid.protobuf(
            mapLayer.url, {
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

    getPopupContent(e) {
        var props = e.layer.properties
        var featId = (props.CD_GEOCUF) ? props.CD_GEOCUF : props.CD_GEOCMU
        var idx = this.circlesData.ids.indexOf(featId)
        if (idx < 0) return
        var circle = this.circlesData.features[idx]
        if (!circle._containsPoint(e.layerPoint)) return
        var props = e.layer.properties
        return `
            <div class="grid-container-popup">
                <div class="header-popup">
                    <div><b>${(props.NM_ESTADO)? props.NM_ESTADO: props.NM_MUNICIP }</b></div>
                </div>
                <div class="row2-popup">
                    <div><b>Número de ${(this.options.attributeName === 'deaths')? 'óbitos': 'casos'}:</b></div>
                </div>
                <div class="value2-popup">
                    <div>${this.mFormatter(+circle.feature.properties[this.options.attributeName])}</div>
                </div>
            </div>`
    }

    updatePropSymbols() {
        var attributeName = this.options.attributeName
        this.layer.eachLayer((layer) => {
            var radius = this.calcPropRadius(layer.feature.properties[attributeName])
            layer.setRadius(radius);
            layer.bindPopup(this.getPopupContent.bind(this), { pane: 'popup', offset: new L.Point(0, -radius) })
        })
    }

    calcPropRadius(attributeValue) {
        var area = +attributeValue * this.options.scaleFactor;
        return Math.sqrt(area / Math.PI) * 2;
    }

    createLegend() {
        var currentLegend = L.control({ position: "bottomright" });
        currentLegend.onAdd = (function() {
            var legendContainer = L.DomUtil.create("div", "legend2");
            var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
            var lastRadius = 0;
            L.DomEvent.addListener(legendContainer, "mousedown", function(e) {
                L.DomEvent.stopPropagation(e);
            });
            //$(legendContainer).append(`<h4 id="legendTitle">${this.options.name}</h4>`)
            this.options.scaleLenged.forEach((function(value) {
                var legendCircle = L.DomUtil.create("div", "legendCircle");
                $(legendCircle).attr('height', 300)
                var currentRadius = this.calcPropRadius(value);
                var margin = -currentRadius - lastRadius - 2;
                $(legendCircle).attr("style", `
                border: 1px solid ${this.getCircleStyle().color};
                background: ${this.getCircleStyle().color+'4D'};
                width: ${(currentRadius * 2)}px;
                height: ${(currentRadius * 2)}px; 
                margin-left:${margin}px`);
                $(legendCircle).append(`<span class='legendValue'>${this.mFormatter(value)}</span>`)
                $(symbolsContainer).append(legendCircle);
                lastRadius = currentRadius;
            }).bind(this))
            $(legendContainer).append(symbolsContainer);
            return legendContainer;
        }).bind(this);
        currentLegend.addTo(this.options.map.getMap());
        this.currentLegend = currentLegend
    }
}