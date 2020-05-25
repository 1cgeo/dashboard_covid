"use strict"

const createCovidMap = (options) => {
    var obj = new CovidMap()
    obj.initialize(options)
    return obj
}

var CovidMap = function (options) {

    this.options = {}

    this.initialize = function (options) {
        this.setOptions(this.options, options)
        this.map = this.createMap(this.options)
        this.featureGroup = L.featureGroup().addTo(this.map)
        this.featureGroup = this.createFeatureGroup(this.map)
        this.layersButtons = this.createLayersButtons(
            this.map,
            this.options.layers,
            this.loadMapLayer.bind(this)
        )
        this.loadMapLayer(0)
    }

    this.setOptions = function (options, newOptions) {
        for (var key in newOptions) {
            options[key] = newOptions[key]
        }
    }

    this.createMap = function (options) {
        var $this = this
        return L.map(options.divId, { minZoom: 1, zoomControl: false })
            .fitBounds(options.bounds).on('click', function (e) {
                var clickBounds = L.latLngBounds(e.latlng, e.latlng);
                var intersectingFeatures = [];
                for (var l in $this.map._layers) {
                    var overlay = $this.map._layers[l];
                    //console.log(overlay)
                    if (overlay._layers) {
                        for (var f in overlay._layers) {
                            var feature = overlay._layers[f];
                            var bounds;
                            if (feature.getBounds) bounds = feature.getBounds();
                            else if (feature._latlng) {
                                bounds = L.latLngBounds(feature._latlng, feature._latlng);
                            }
                            if (bounds && clickBounds.intersects(bounds)) {
                                intersectingFeatures.push(feature);
                            }
                        }
                    }
                }
                //console.log(intersectingFeatures)
                // if at least one feature found, show it
                /* if (intersectingFeatures.length) {
                    var html = "Found features: " + intersectingFeatures.length

                    $this.map.openPopup(html, e.latlng, {
                        offset: L.point(0, -24)
                    });
                } */
            })
    }

    this.createFeatureGroup = function (map) {
        return L.featureGroup().addTo(map)
    }

    this.createLayersButtons = function (map, buttons, cb) {
        var layersButtons = L.control({ position: 'topleft' })
        layersButtons.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'layersOptions')
            var buttonsDiv = $("<div></div>").attr("class", "mdl-button-group")
            buttons.forEach(function (elem, idx) {
                $(buttonsDiv).append(
                    $("<button></button>")
                        .attr("id", elem.name.concat(idx))
                        .attr("class", "states mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect")
                        .text(elem.name)
                )
            })
            $(this._div).append(buttonsDiv)
            return this._div;
        }
        layersButtons.addTo(map)
        buttons.forEach(function (elem, idx) {
            $(`#${elem.name.concat(idx)}`).on('click', function () { cb(idx); });
        })
        return layersButtons
    }

    this.getLayerThemes = function (layerIdx) {
        return this.options.layers[layerIdx].themes
    }

    this.loadMapLayer = function (layerIdx) {
        if (this.currentThemesButtons) {
            this.map.removeControl(this.currentThemesButtons)
        }
        this.currentThemesOptions = this.getLayerThemes(layerIdx)
        this.currentThemesButtons = this.createThemesButtons(
            this.currentThemesOptions,
            this.map,
            this.loadTheme.bind(this)
        )
        this.loadTheme(0)
        this.loadVectorTile(layerIdx)
    }

    this.createThemesButtons = function (themes, map, cb) {
        if (themes.length < 1) return
        var themesButtons = L.control({ position: 'topleft' });
        themesButtons.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'themesOptions');
            this.update();
            return this._div;
        };
        themesButtons.update = function (props) {
            var buttonsDiv = $("<div></div>")
            themes.forEach(function (elem, idx) {
                var label = $("<label></label>")
                    .attr("for", elem.type.concat(idx))
                    .attr("class", "mdl-radio mdl-js-radio")
                var input = $("<input></input>")
                    .attr("id", elem.type.concat(idx))
                    .attr("type", "radio")
                    .attr("class", "mdl-radio__button")
                    .attr("name", "theme")
                    .attr("value", idx)
                idx == 0 ? input.attr("checked", true) : ""
                var text = $("<span></span>")
                    .attr("class", "mdl-radio__label")
                    .text(elem.name)
                $(label).append($(input))
                $(label).append($(text))
                $(buttonsDiv).append(label)
            })
            $(this._div).append(buttonsDiv)
        };
        themesButtons.addTo(map);
        $("input[name='theme']").change(function (e) { cb($(this).val()) })
        return themesButtons
    }

    this.loadTheme = function (themeIdx) {
        var theme = Object.assign({}, this.currentThemesOptions[themeIdx])
        if (!theme) return
        if (this.currentTheme) {
            this.currentTheme.remove()
        }
        theme.layer = this.currentLayer
        theme.featureGroup = this.featureGroup
        theme.map = this.map
        this.currentTheme = createMapTheme(theme)
    }

    this.loadVectorTile = function (layerIdx) {
        var layerOption = Object.assign({}, this.options.layers[layerIdx])
        if (!layerOption) return
        if (this.currentLayer && this.currentLayer.getName() == layerOption.name) return
        if (this.currentLayer) {
            this.currentLayer.remove()
        }
        layerOption.map = this.map
        layerOption.featureGroup = this.featureGroup
        this.currentLayer = createVectorTileLayer(layerOption)
    }

    this.zoomToBBOX = function (bbox) { this.map.fitBounds(bbox) }

}


const createMapTheme = (options) => {
    switch (options.type) {
        case "circlemap":
            var obj = new CirclesTheme()
            break
        case "heatmap":
            var obj = new HeatTheme()
            break
        case "choroplethmap":
            var obj = new ChoroplethTheme()
            break
        default:
            return
    }
    obj.initialize(options)
    return obj
}

var CirclesTheme = function () {

    this.options = {}

    this.isActive = false

    this.initialize = function (options) {
        this.setOptions(options)
        this.create()
    }

    this.setOptions = function (options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    this.update = function (options) {
        this.clean()
        this.setOptions(options)
        this.create()
    }

    this.remove = function (group, map) {
        this.isActive = false
        if (this.currentLegend) {
            this.options.map.removeControl(this.currentLegend)
        }
        if (this.layerTheme) {
            this.options.featureGroup.removeLayer(this.layerTheme)
        }
    }

    this.getType = function () { return "circlemap" }

    this.create = function () {
        this.isActive = true
        var $this = this
        httpGetAsync(this.options.urlData, function (data) {
            if (!data || !$this.isActive) return
            $this.layerTheme = L.geoJson(
                JSON.parse(data),
                {
                    pointToLayer: function (feature, longlat) {
                        return L.circleMarker(longlat, {
                            fillColor: "#708598",
                            color: "#537898",
                            weight: 1,
                            fillOpacity: 0.6
                        }).on({
                            mouseover: function (e) {
                                this.openPopup();
                                this.setStyle({ color: "yellow" });
                            },
                            mouseout: function (e) {
                                this.closePopup();
                                this.setStyle({ color: "#537898" });

                            }
                        })
                    }
                }
            ).addTo($this.options.featureGroup)
            $this.updatePropSymbols()
            $this.createLegend()
        })
    }

    this.updatePropSymbols = function () {
        var attributeName = this.options.attributeName
        var $this = this
        this.layerTheme.eachLayer(function (layer) {
            var radius = $this.calcPropRadius(layer.feature.properties[attributeName])
            layer.setRadius(radius);
            layer.bindPopup($this.getPopupContent(layer), { offset: new L.Point(0, -radius) });
        });
    }

    this.getPopupContent = function (layer) {
        var props = layer.feature.properties
        return `${props.city ? props.city : props.state} ${props[this.options.attributeName]}`
    }

    this.calcPropRadius = function (attributeValue) {
        var area = +attributeValue * this.options.scaleFactor;
        return Math.sqrt(area / Math.PI) * 2;
    }

    this.createLegend = function () {
        /* var $this = this
        $this.currentLegend = L.control({ position: "bottomright" });
        $this.currentLegend.onAdd = function () {
            var legendContainer = L.DomUtil.create("div", "legend2");
            var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
            var lastRadius = 0;
            L.DomEvent.addListener(legendContainer, "mousedown", function (e) {
                L.DomEvent.stopPropagation(e);
            });
            $(legendContainer).append(`<h4 id="legendTitle">${$this.options.name}</h4>`)
            $this.options.scaleLenged.forEach(function (value) {
                var legendCircle = L.DomUtil.create("div", "legendCircle");
                var currentRadius = $this.calcPropRadius(value);
                var margin = -currentRadius - lastRadius - 2;
                $(legendCircle).attr("style", `width: ${(currentRadius * 2)}px; height: ${(currentRadius * 2)}px; margin-left:${margin}px`);
                $(legendCircle).append(`<span class='legendValue'>${value}</span>`)
                $(symbolsContainer).append(legendCircle);
                lastRadius = currentRadius;
            })
            $(legendContainer).append(symbolsContainer);
            return legendContainer;
        };
        $this.currentLegend.addTo(this.options.map); */
    }

}

var ChoroplethTheme = function () {

    this.options = {}

    this.isActive = false

    this.initialize = function (options) {
        this.setOptions(options)
        this.create()
    }

    this.setOptions = function (options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    this.remove = function () {
        this.isActive = false
        this.options.featureGroup.removeLayer(this.layerTheme.getLayerMap())
        this.options.featureGroup.addLayer(this.options.layer.getLayerMap())
    }

    this.getType = function () { return "choroplethmap" }

    this.update = function (options) {
        this.clean()
        this.setOptions(options)
        this.create()
    }

    this.create = function () {
        this.isActive = true
        var $this = this
        httpGetAsync(this.options.urlData, (geoJsonString) => {
            if (!geoJsonString || !$this.isActive) return
            var geojson = JSON.parse(geoJsonString)
            $this.options.featureGroup.removeLayer($this.options.layer.getLayerMap())
            $this.layerTheme = createVectorTileLayer({
                urlVectorTile: $this.options.layer.getUrlVectorTile(),
                map: $this.options.map,
                featureGroup: $this.options.featureGroup,
                getDefaultStyle: function (feat) {
                    var found = geojson.find((element) => {
                        return element[$this.options.layer.getIdField()] === feat[$this.options.layer.getIdField()]
                    });
                    return $this.getStyle(found ? found[$this.options.attributeName] : 0)
                }
            })
        })
    }

    this.getStyle = function (value) {
        return {
            weight: 1,
            opacity: 1,
            color: 'black',
            dashArray: '2',
            fill: true,
            fillOpacity: 0.7,
            fillColor: this.getColor(value)
        };
    }

    this.getColor = function (d) {
        return d < 2 ? '#800026' :
            d < 4 ? '#BD0026' :
                d < 6 ? '#E31A1C' :
                    d < 8 ? '#FC4E2A' :
                        d < 10 ? '#FD8D3C' :
                            d < 12 ? '#FEB24C' :
                                d < 1 ? '#FED976' :
                                    '#FFEDA0';
    }

    this.getPopupContent = function (layer) { }

    this.createLegend = function () {
        /* legend = L.control({ position: 'bottomright' });
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                labels = [],
                from, to;

            for (var i = 0; i < grades.length; i++) {
                from = grades[i];
                to = grades[i + 1];

                labels.push(
                    '<i style="background:' + getColor(from + 1) + '"></i> ' +
                    from + (to ? '&ndash;' + to : '+'));
            }
            div.innerHTML = labels.join('<br>');
            return div;
        };
        legend.addTo(map); */
    }
}



var HeatTheme = function () {

    this.options = {}
    this.isActive = false

    this.initialize = function (options) {
        this.setOptions(options)
        this.create()
    }

    this.setOptions = function (options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    this.remove = function () {
        this.isActive = false
        this.options.featureGroup.removeLayer(this.layerTheme)
    }

    this.getType = function () { return "heatmap" }

    this.update = function (options) {
        this.clean()
        this.setOptions(options)
        this.create()
    }

    this.create = function () {
        this.isActive = true
        var $this = this
        httpGetAsync(this.options.urlData, function (data) {
            if (!data || !$this.isActive) { return }
            var jsonData = JSON.parse(data)
            var locations = []
            for (var i = jsonData.length; i--;) {
                if (jsonData[i].latlong.length < 2) {
                    continue
                }
                locations.push(jsonData[i].latlong.concat(jsonData[i][$this.options.attributeName]))
            }
            $this.layerTheme = L.heatLayer(locations, {
                interactive: true,
                radius: 25,
                blur: 15,
                gradient: {
                    0.3: 'gray',
                    0.6: 'purple',
                    0.8: 'yellow',
                    0.95: 'lime',
                    1.0: 'red'
                },
                minOpacity: 0.5
            }).addTo($this.options.featureGroup)
            $this.createLegend()
        })
    }

    this.getPopupContent = function (layer) { }

    this.createLegend = function () { }
}


function httpGetAsync(theUrl, cb) {
    var xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            cb(xmlHttp.responseText)
    }
    xmlHttp.open("GET", theUrl, true)
    xmlHttp.send(null)
}


const createVectorTileLayer = (options) => {
    var obj = new VectorTileLayer()
    obj.initialize(options)
    return obj
}

var VectorTileLayer = function () {

    this.options = {
        getDefaultStyle: function (feat) {
            return {
                weight: 1,
                opacity: 0.7,
                color: 'white',
                fill: true,
                fillOpacity: 0.7,
                fillColor: "#cfcfcf"
            };
        }
    }

    this.currentLoopKey = ""

    this.initialize = function (options) {
        this.setOptions(options)
        this.create()
    }

    this.getName = function () { return this.options.name }

    this.setOptions = function (options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    this.remove = function () {
        this.options.featureGroup.removeLayer(this.layer)
    }

    this.getUrlVectorTile = function () {
        return this.options.urlVectorTile
    }

    this.getLayerMap = function () {
        return this.layer
    }

    this.create = function () {
        var idField = this.options.idField
        this.layer = L.vectorGrid.protobuf(
            this.options.urlVectorTile,
            {
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": this.options.getDefaultStyle
                },
                interactive: true,
                getFeatureId: function (feature) {
                    return feature.properties[idField]
                }
            }
        )
        this.options.featureGroup.addLayer(this.layer)
    }

    this.setFeatureStyle = function (id, styleOptions) { this.layer.setFeatureStyle(id, styleOptions) }

    this.getAllLayers = function () {
        var allFeatures = []
        for (var tileKey in this.layer._vectorTiles) {
            var tile = this.layer._vectorTiles[tileKey]
            var features = tile._features
            for (var key in features) {
                if (key && features[key]) {
                    allFeatures.push(features[key])
                }
            }
        }
        return allFeatures
    }

    this.getIdField = function () { return this.options.idField }
}