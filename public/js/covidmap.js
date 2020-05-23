"use strict"

const createCovidMap = (options) => {
    var obj = new CovidMap()
    obj.initialize(options)
    return obj
}

var CovidMap = function (options) {

    this.options = {}

    this.initialize = function (options) {
        this.setOptions(options)
        this.createMap()
        this.createLayersOptions(this.options.layers, this.loadMapLayer.bind(this))
        this.loadMapLayer(0)
    }

    this.loadMapLayer = function (layerIdx) {
        this.createThemesOptions(this.options.layers[layerIdx].themes, this.loadTheme.bind(this))
        this.loadTheme(0)
        this.loadVectorTile(layerIdx)
    }

    this.createMap = function () {
        this.map = L.map(this.options.divId, { minZoom: 1, zoomControl: false })
            .fitBounds(this.options.bounds);
    }

    this.setOptions = function (options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    this.createLayersOptions = function (buttons, cb) {
        this.groupButtonsLayers = L.control({ position: 'topleft' })
        this.groupButtonsLayers.onAdd = function (map) {
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
        this.groupButtonsLayers.addTo(this.map)
        buttons.forEach(function (elem, idx) {
            $(`#${elem.name.concat(idx)}`).on('click', function () { cb(idx); });
        })
    }

    this.loadVectorTile = function (layerIdx) {
        var layerOption = this.options.layers[layerIdx]
        if (!layerOption) return
        if (this.currentLayer && this.currentLayer.getName() == layerOption.name) return
        layerOption.map = this.map
        if (!this.currentLayer) {
            this.currentLayer = createVectorTileLayer(layerOption)
            return
        }
        this.currentLayer.clean()
        this.currentLayer = createVectorTileLayer(layerOption)
    }

    this.createThemesOptions = function (themes, cb) {
        if (themes.length < 1) return
        if (this.themesButtons) {
            this.map.removeControl(this.themesButtons)
        }
        this.themesOptions = themes
        this.themesButtons = L.control({ position: 'topleft' });
        this.themesButtons.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'themesOptions');
            this.update();
            return this._div;
        };
        this.themesButtons.update = function (props) {
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
        this.themesButtons.addTo(this.map);
        $("input[name='theme']").change(function (e) { cb($(this).val()) });
    }

    this.loadTheme = function (themeIdx) {
        var theme = this.themesOptions[themeIdx]
        if (!theme) return
        theme.map = this.map
        theme.layer = this.currentLayer
        if (!this.currentTheme) {
            this.currentTheme = createMapTheme(theme)
            return
        }
        this.currentTheme.clean()
        this.currentTheme = createMapTheme(theme)
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

    this.clean = function () {
        this.isActive = false
        if (this.currentLegend) {
            this.options.map.removeControl(this.currentLegend)
        }
        if (this.layerTheme) {
            this.options.map.removeLayer(this.layerTheme)
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
            ).addTo($this.options.map)
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

    this.clean = function () {
        this.isActive = false
        this.options.layer.resetDefaultStyle()
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
            var data = $this.options.layer.getAllLayers()
            for (var i = data.length; i--;) {
                var id = $this.options.layer.getIdField()
                var found = geojson.find(element => element[id] == data[i].feature.properties[id])
                if(!found){
                    $this.options.layer.setFeatureStyle(
                        data[i].feature.properties[id],
                        $this.getStyle(0)
                    )
                    continue
                }
                $this.options.layer.setFeatureStyle(
                    found[id],
                    $this.getStyle(+found[$this.options.attributeName])
                )
            }
        })
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

    this.getStyle = function (value) {
        return {
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '2',
            fill: true,
            fillOpacity: 0.7,
            fillColor: this.getColor(value)
        };
    }

    this.getColor = function (d) {
        return d > 1000 ? '#800026' :
            d > 500 ? '#BD0026' :
                d > 200 ? '#E31A1C' :
                    d > 100 ? '#FC4E2A' :
                        d > 50 ? '#FD8D3C' :
                            d > 20 ? '#FEB24C' :
                                d > 10 ? '#FED976' :
                                    '#FFEDA0';
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

    this.clean = function () {
        this.isActive = false
        if (!this.layerTheme) return
        this.options.map.removeLayer(this.layerTheme)
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
            }).addTo($this.options.map)
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

    this.options = {}

    this.initialize = function (options) {
        this.setOptions(options)
        this.createLayer()
    }

    this.getName = function () { return this.options.name }

    this.clean = function () { this.options.map.removeLayer(this.layer) }

    this.setOptions = function (options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    this.createLayer = function () {
        var idField = this.options.idField
        this.layer = L.vectorGrid.protobuf(
            this.options.urlVectorTile,
            {
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": (feature) => {
                        return this.getDefaultStyle()
                    }
                },
                interactive: true,
                getFeatureId: function (feature) {
                    return feature.properties[idField]
                }
            }
        )
        this.options.map.addLayer(this.layer)
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

    this.resetDefaultStyle = function () {
        var data = this.getAllLayers()
        for (var key in data) {
            this.layer.setFeatureStyle(
                data[key].feature.properties[this.getIdField()],
                this.getDefaultStyle()
            )
        }
    }

    this.getDefaultStyle = function () {
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