
class Factories {

    createLayer(type, options) {
        var layer
        if (type === "heat") {
            layer = new HeatLayer(options)
        } else if (type === "choropleth") {
            layer = new ChoroplethLayer(options)
        } else if (type === "circles") {
            layer = new CirclesLayer(options)
        } else if (type === "vectorTile") {
            layer = new VectorTileLayer(options)
        }
        return layer;
    }

    createMap(type, dataSource, options) {
        var layer
        if (type === "covidMap") {
            layer = new CovidMap(dataSource, options)
        }
        return layer;
    }
}

class Signal {
    constructor() {
        this.events = {}
    }

    createEvent(eventName) {
        this.events[eventName] = []
    }

    connect(event, listener) {
        if (this.events[event]) {
            this.events[event].push(listener)
        }
    }

    trigger(eventName, value) {
        if (this.events[eventName]) {
            for (var i = this.events[eventName].length; i--;) {
                this.events[eventName][i](value)
            }
        }
    }
}

class CovidMap {
    constructor(dataSource, newOptions) {
        this.options = {}
        this.events = new Signal()
        this.events.createEvent('changeLocation')
        this.currentMapLayers = []
        this.currentThemeLayers = []
        this.dataSource = dataSource
        this.setOptions(newOptions)
        this.map = this.create(this.options)
        //this.setBounds(this.options.bounds)
        this.connectEvents()
        this.featureGroup = this.createFeatureGroup()
        this.layerButtons = this.createLayersButtons(
            this.dataSource.getMapLayerNames(),
            this.loadMapData.bind(this)
        )
        this.loadMapData(0)
    }

    on(eventName, listener) {
        this.events.connect(eventName, listener)
    }

    triggerChangeLocation(layerClicked) {
        this.events.trigger('changeLocation', layerClicked)
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    getCurrentLayerButtons() {
        return this.layerButtons
    }

    getCurrentThemeButtons() {
        return this.currentThemesButtons
    }

    getDataSource() {
        return this.dataSource
    }

    getMap() {
        return this.map
    }

    setBounds(bbox) {
        this.map.fitBounds(bbox)
    }


    handleMapClick(e) {
        var layerClicked
        if (this.getCurrentThemeLayer().getOptions().type === 'choropleth') {
            layerClicked = this.getCurrentThemeLayer().handleClick(e.layerPoint)
        } else if (this.getCurrentMapLayer()) {
            layerClicked = this.getCurrentMapLayer().handleClick(e.layerPoint)
        }
        this.triggerChangeLocation(layerClicked)
        if (!layerClicked) {
            this.setBounds(this.options.bounds)
        }
    }

    create(options) {
        return L.map(
            options.elementId, 
            { 
                minZoom: 3, 
                zoomControl: false,
                maxBounds:  [
                    [21.453068633086783, -10.378190147253468],
                    [ -49.49667452747044, -142.9172526472535]
                ], 
            }
        ).fitBounds(
            [
                [21.453068633086783, -10.378190147253468],
                [ -49.49667452747044, -142.9172526472535]
            ]
        )
    }

    connectEvents() {
        this.map.on('click', this.handleMapClick.bind(this))
    }

    createFeatureGroup() {
        return L.featureGroup().addTo(this.map)
    }

    getFeatureGroup() {
        return this.featureGroup
    }

    createLayersButtons(buttons, cb) {
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
        layersButtons.addTo(this.map)
        buttons.forEach(function (elem, idx) {
            $(`#${elem.name.concat(idx)}`).on('click', function () { cb(elem.id); });
        })
        return layersButtons
    }

    createThemesButtons(themes, cb) {
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
                    .attr("value", elem.id)
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
        themesButtons.addTo(this.map);
        $("input[name='theme']").change(function (e) { cb($(this).val()) })
        return themesButtons
    }

    reloadMapData() {
        //this.loadVectorTile(this.getCurrentMapLayer().getOptions())
        //this.loadThemeLayer(this.getCurrentThemeLayer().getOptions().id)
        if(this.getCurrentThemeLayer().getOptions().type == 'choropleth'){
            this.getCurrentThemeLayer().reload()
            return
        }
        this.getCurrentThemeLayer().reload()
        this.getCurrentMapLayer().reload()
        
    }

    loadMapData(layerId) {
        if (this.getCurrentThemeButtons()) {
            this.map.removeControl(this.getCurrentThemeButtons())
        }
        var layerOptions = this.dataSource.getMapLayer(layerId)
        this.currentThemesButtons = this.createThemesButtons(
            layerOptions.themeLayers,
            this.loadThemeLayer.bind(this)
        )
        this.loadVectorTile(layerOptions)
        this.loadThemeLayer(layerOptions.themeLayers[0].id)
    }

    loadThemeLayer(themeLayerId) {
        var themeOptions = this.getCurrentMapLayer().getThemeLayer(themeLayerId)
        if (!themeOptions) return
        if (this.getCurrentThemeLayer()) this.getCurrentThemeLayer().remove()
        themeOptions.map = this
        var factories = new Factories()
        this.currentThemeLayer = factories.createLayer(themeOptions.type, themeOptions)
    }

    getCurrentMapLayer() {
        return this.currentMapLayer
    }

    getCurrentThemeLayer() {
        return this.currentThemeLayer
    }

    loadVectorTile(layerOptions) {
        if (!layerOptions) return
        if (this.getCurrentMapLayer()) this.getCurrentMapLayer().remove()
        layerOptions.map = this
        var factories = new Factories()
        this.currentMapLayer = factories.createLayer('vectorTile', layerOptions)
    }
}



class Layer {
    constructor(newOptions) {
        this.options = {}
        this.setOptions(newOptions)
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    getOptions() {
        return this.options
    }

    getLayer() {
        return this.layer
    }

    update(options) {
        this.setOptions(options)
        this.create()
    }

    handleClick() {

    }

    getIdField() {
        return this.options.idField
    }

    getUnique(arr, comp) {
        var listedId = [];
        var unique = [];
        for (var i = arr.length; i--;) {
            if (listedId.includes(arr[i][comp])) continue
            listedId.push(arr[i][comp])
            unique.push(arr[i])
        }
        return unique
    }

    getReduce(arr, id, comp) {
        var listedId = [];
        var reduced = [];
        for (var i = arr.length; i--;) {
            var idx = listedId.indexOf(arr[i][id])
            if (idx < 0) {
                listedId.push(arr[i][id])
                reduced.push(arr[i])
            } else {
                reduced[idx][comp] = +reduced[idx][comp] + +arr[i][comp]
            }
        }
        return reduced
    }

    getUniqueGeojsonFeatures(features, comp) {
        var listedId = [];
        var unique = [];
        for (var i = features.length; i--;) {
            if (listedId.includes(features[i].properties[comp])) continue
            listedId.push(features[i].properties[comp])
            unique.push(features[i])
        }
        return unique
    }

    getReduceGeojsonFeatures(features, id, comp) {
        var listedId = [];
        var reduced = [];
        for (var i = features.length; i--;) {
            var idx = listedId.indexOf(features[i].properties[id])
            if (idx < 0) {
                listedId.push(features[i].properties[id])
                reduced.push(features[i])
            } else {
                reduced[idx][comp] = +reduced[idx][comp] + +features[i].properties[comp]
            }
        }
        return reduced
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
        return reduced
    }


}

class CirclesLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.isActive = false
        this.create()
    }

    remove() {
        this.isActive = false
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        if (this.layer) {
            this.options.map.getFeatureGroup().removeLayer(this.layer)
        }
    }

    reload(){
        this.remove()
        this.create()
    }

    create() {
        this.isActive = true
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            ((jsonData, options) => {
                if (this.options.layerId === 0 && this.options.attributeName == 'totalCases') {
                    jsonData.features = this.getUniqueGeojsonFeatures(jsonData.features, "state")
                } else if (this.options.layerId === 0 && this.options.attributeName == 'deaths') {
                    jsonData.features = this.getReduceGeojsonFeatures(jsonData.features, "state", "deaths")
                } else if (this.options.layerId === 1 && this.options.attributeName == 'totalCases') {
                    jsonData.features = this.getUniqueGeojsonFeatures(jsonData.features, "city")
                } else if (this.options.layerId === 1 && this.options.attributeName == 'deaths') {
                    jsonData.features = this.getReduceGeojsonFeatures(jsonData.features, "city", "deaths")
                }
                this.layer = L.geoJson(
                    jsonData,
                    {
                        pointToLayer: (function (feature, longlat) {
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
                        }).bind(this)
                    }
                ).addTo(this.options.map.getFeatureGroup())
                this.updatePropSymbols()
                this.createLegend()
                this.layer.on('mouseover', function (e) { e.layer.openPopup(); });
            })

        )
    }

    handleMapClick(clickPoint) {
        /* for (var i = this.layer.getLayers().length; i--;) {
            if (!this.layer.getLayers()[i]._containsPoint(clickPoint)) continue
            return this.layer.getLayers()[i]
        } */
    }

    mFormatter(num) {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + ' mil' : Math.sign(num) * Math.abs(num)
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

    updatePropSymbols() {
        var attributeName = this.options.attributeName
        this.layer.eachLayer((function (layer) {
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
        var currentLegend = L.control({ position: "bottomleft" });
        currentLegend.onAdd = (function () {
            var legendContainer = L.DomUtil.create("div", "legend2");
            var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
            var lastRadius = 0;
            L.DomEvent.addListener(legendContainer, "mousedown", function (e) {
                L.DomEvent.stopPropagation(e);
            });
            //$(legendContainer).append(`<h4 id="legendTitle">${this.options.name}</h4>`)
            this.options.scaleLenged.forEach((function (value) {
                var legendCircle = L.DomUtil.create("div", "legendCircle");
                $(legendCircle).attr('height', 300)
                var currentRadius = this.calcPropRadius(value);
                var margin = -currentRadius - lastRadius - 2;
                $(legendCircle).attr("style", `width: ${(currentRadius * 2)}px; height: ${(currentRadius * 2)}px; margin-left:${margin}px`);
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

class ChoroplethLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.isActive = false
        this.vectorTiles = []
        this.create()
    }

    reload(){
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.create()
    }

    remove() {
        this.isActive = false
        if (this.currentLegend) {
            this.options.map.getMap().removeControl(this.currentLegend)
        }
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }
        this.options.map.getCurrentMapLayer().getLayers().forEach(((mapLayer) => {
            this.options.map.getFeatureGroup().addLayer(mapLayer)
        }).bind(this))
    }

    create() {
        this.isActive = true
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            (function (jsonData) {
                if (jsonData.length < 1 || !this.isActive) { return }
                var lastData = this.getLastData(jsonData, this.options.idField, 'date')
                this.options.map.getCurrentMapLayer().getLayers().forEach((mapLayer) => {
                    this.options.map.getFeatureGroup().removeLayer(mapLayer)
                })
                var mapLayers = this.options.map.getCurrentMapLayer().getOptions().mapLayers
                if (mapLayers.length < 1) { return }
                for (var i = mapLayers.length; i--;) {
                    this.idField = mapLayers[i].idField
                    var loadOtherStyle = (mapLayers[i].main) ? false : true
                    var layer = this.createVectorGrid(
                        mapLayers[i],
                        lastData,
                        this.options.attributeName,
                        loadOtherStyle
                    )
                    this.options.map.getFeatureGroup().addLayer(layer)
                    this.vectorTiles.push(layer)
                    if (mapLayers[i].main) {
                        this.mainVectorTile = layer
                    }
                }
                //this.createLegend()
            }).bind(this)
        )
    }

    createVectorGrid(mapLayer, lastData, attributeName, loadDefaultStyle) {
        var layer = L.vectorGrid.protobuf(
            mapLayer.url,
            {
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    "data": (function (feat) {
                        if (loadDefaultStyle) return mapLayer.style
                        for (var i = lastData.length; i--;) {
                            if (lastData[i][mapLayer.idField] === feat[mapLayer.idField]) {
                                return this.getStyle(lastData[i][attributeName])
                            }
                        }
                        return this.getStyle(0)
                    }).bind(this)
                },
                interactive: true,
                getFeatureId: (function (feature) {
                    return feature.properties[mapLayer.idField]
                }).bind(this)
            }
        )
        return layer
    }

    getStyle(value) {
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

    getColor(d) {
        return d < 1 ? '#FFEDA0' :
            d > 30 ? '#FED976' :
                d > 25 ? '#FEB24C' :
                    d > 20 ? '#FD8D3C' :
                        d > 15 ? '#FD8D3C' :
                            d > 10 ? '#FC4E2A' :
                                d > 5 ? '#E31A1C' :
                                    d > 1 ? '#BD0026' :
                                        '#800026';
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
        var vectorTiles = this.mainVectorTile._vectorTiles
        for (var tkey in vectorTiles) {
            var tile = vectorTiles[tkey]
            if (!tile._layers) continue
            for (var fkey in tile._layers) {
                var layer = tile._layers[fkey]
                if (!layer._containsPoint(clickPoint.subtract(tile.getOffset()))) continue
                return layer
            }
        }
    }

    getPopupContent(layer) { }

    createLegend() {
        var legend = L.control({ position: 'bottomleft' });
        legend.onAdd = (function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                labels = [],
                from, to;
            for (var i = 0; i < grades.length; i++) {
                from = grades[i];
                to = grades[i + 1];
                labels.push(
                    '<i style="background:' + this.getColor(from + 1) + '"></i> ' +
                    from + (to ? '&ndash;' + to : '+'));
            }
            div.innerHTML = labels.join('<br>');
            return div;
        }).bind(this);
        legend.addTo(this.options.map.getMap());
        this.currentLegend = legend
    }

}

class HeatLayer extends Layer {

    constructor(newOptions) {
        super(newOptions)
        this.isActive = false
        this.create()
    }

    remove() {
        this.isActive = false
        this.options.map.getFeatureGroup().removeLayer(this.layer)
    }

    reload() {
        this.options.map.getFeatureGroup().removeLayer(this.layer)
        this.create()
    }

    create() {
        this.isActive = true
        this.options.map.getDataSource().getThemeData(
            this.options.layerId,
            this.options.type,
            (function (jsonData) {
                if (jsonData.length < 1 || !this.isActive) { return }
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
                this.layer = L.heatLayer(locations, {
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
                }).addTo(this.options.map.getFeatureGroup())
                this.createLegend()
            }).bind(this)
        )
    }

    getClickedFeature(clickPoint) { }

    getPopupContent(layer) { }

    createLegend() { }

}

class VectorTileLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.vectorTiles = []
        this.mainVectorTile = null
        this.create()
    }

    getLayers() {
        return this.vectorTiles
    }

    remove() {
        for (var i = this.vectorTiles.length; i--;) {
            this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i])
        }

    }

    reload(){
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
            var idField = mapLayers[i].idField
            var layer = L.vectorGrid.protobuf(
                mapLayers[i].url,
                {
                    rendererFactory: L.canvas.tile,
                    vectorTileLayerStyles: {
                        "data": mapLayers[i].style
                    },
                    interactive: true,
                    getFeatureId: (function (feature) {
                        return feature.properties[idField]
                    }).bind(this)
                }
            )
            this.options.map.getFeatureGroup().addLayer(layer)
            this.vectorTiles.push(layer)
            if (mapLayers[i].main) {
                this.mainVectorTile = layer
                this.idField = idField
            }
        }
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