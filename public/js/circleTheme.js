class CirclesLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.currentProcessKey = ""
        this.create()
    }

    remove() {
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        if (this.layer) {
            this.options.map.getFeatureGroup().removeLayer(this.layer)
        }
    }

    reload() {
        this.remove()
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
        }
    }

    create() {
        var processKey = this.createUUID()
        this.currentProcessKey = processKey
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            ((jsonData, options) => {
                jsonData = this.processGeoJSON(
                    this.options.layerId,
                    this.options.attributeName,
                    jsonData
                )
                if (processKey !== this.currentProcessKey) return
                this.layer = L.geoJson(
                    jsonData, {
                        pointToLayer: (feature, longlat) => {
                            var circle = L.circleMarker(
                                longlat,
                                this.getCircleStyle()
                            )
                            circle.getCircleStyle = this.getCircleStyle.bind(this)
                            return circle
                        }
                    }
                ).addTo(this.options.map.getFeatureGroup())
                this.updatePropSymbols()
                this.createLegend()
                this.layer.on('mouseover', function(e) {});
            })

        )
    }

    handleMouseover(clickPoint) {
        return
        if (this.popup) this.popup._close()
        if (!this.layer) return
        for (var i = this.layer.getLayers().length; i--;) {
            if (!this.layer.getLayers()[i]._containsPoint(clickPoint)) continue
            this.popup = L.popup({
                    pane: 'popup',
                    closeOnClick: true,
                    autoClose: true
                })
                .setLatLng(this.options.map.getMap().layerPointToLatLng(clickPoint))
                .setContent(this.getPopupContent(this.layer.getLayers()[i]))
                .openOn(this.options.map.getMap())
        }
    }

    getPopupContent(layer) {
        var props = layer.feature.properties
        if (this.options.attributeName == 'totalCases') {
            return `<div class="popup">Local: ${props[this.options.attributeLabel]} <br> 
                Casos: ${this.mFormatter(props[this.options.attributeName])}</div>`
        } else {
            return `<div class="popup">Local: ${props[this.options.attributeLabel]} <br> 
                Óbitos: ${this.mFormatter(props[this.options.attributeName])}</div>`
        }
    }

    mFormatter(num) {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + ' mil' : Math.sign(num) * Math.abs(num)
    }

    updatePropSymbols() {
        var attributeName = this.options.attributeName
        this.layer.eachLayer((function(layer) {
            var radius = this.calcPropRadius(layer.feature.properties[attributeName])
            layer.setRadius(radius);
            //layer.bindPopup(this.getPopupContent(layer), { maxWidth: 700, offset: new L.Point(0, -radius) })
        }).bind(this));
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