class CirclesLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.layers = []
        this.rangeData = null
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
        this.rangeData = null
    }

    startAnimation() {
        this.updateAnimation()
    }

    stopAnimation() {
        this.updateAnimation()
    }

    updateAnimation() {
        this.layer.clearLayers()
        this.circlesData.ids = []
        this.circlesData.features = []
        this.layer.addData(this.getDataset())
        this.updatePropSymbols()
    }

    getCircleStyle() {
        return this.options.cicleStyle
    }

    create() {
        this.loadTimeInterval()
        setTimeout(() => {
            this.loadVectorTile()
        }, 1)
        setTimeout(() => {
            this.loadGeoJson()
            this.updatePropSymbols()
        }, 1)
        if (!this.currentLegend) this.createLegend()
    }

    loadGeoJson() {
        this.layer = L.geoJson(
            this.getDataset(), {
                pointToLayer: (feature, latlng) => {
                    if (!latlng.lat || !latlng.lng) return
                    var circle = L.circleMarker(
                        latlng,
                        this.getCircleStyle()
                    )
                    circle.getCircleStyle = this.getCircleStyle.bind(this)
                    return circle
                }
            }
        ).addTo(this.options.map.getFeatureGroup())
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
                    weight: 1,
                    opacity: 1,
                    color: '#cfcfcf',
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

    updatePropSymbols() {
        var attributeName = this.options.attributeName
        this.layer.eachLayer((layer) => {
            var radius = this.calcPropRadius(layer.feature.properties[attributeName])
            layer.setRadius(radius);
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
                $(legendCircle).append(`<span class='legendValue'>${mFormatter(value)}</span>`)
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