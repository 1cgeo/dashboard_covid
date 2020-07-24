class PopoverLayer extends Layer {
    constructor(newOptions) {
        super(newOptions)
        this.vectorTiles = []
        this.featureIds = []
        this.lastData = null
        this.mainVectorTile = null
        this.receivedEvent = false
        this.create()
    }

    getDataset(){
        return this.options.popoverLayer.datasetCallback()
    }

    getLayers() {
        return this.vectorTiles
    }

    eventWasReceived() {
        return this.receivedEvent
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
            this.mainVectorTile.on('mousemove', (e) => {
                this.receivedEvent = true
                this.highlightFeature(e.layer)
                this.showPopupThemeLayer(e)
            })
                .on('mouseout', (e) => {
                    this.receivedEvent = false
                    this.resetHighlight(e.layer)
                    //this.options.map.getMap().closePopup()
                }).on('click', (e) => {
                    this.receivedEvent = true
                    this.clickFeature(e)

                })
        }
        this.setJsonData()
    }

    clickFeatureFromLatlng(latlng) {
        var tileSize = { x: 256, y: 256 }
        var pixelPoint = this.options.map.getMap().project(
            latlng,
            this.options.map.getMap().getZoom()
        ).floor()
        var coords = pixelPoint.unscaleBy(tileSize).floor()
        coords.z = this.options.map.getMap().getZoom()
        var vectorTilePromise = this.mainVectorTile._getVectorTilePromise(coords);
        vectorTilePromise.then((vectorTile) => {
            for (var layerName in vectorTile.layers) {
                var layer = vectorTile.layers[layerName];
                for (var i in layer.features) {
                    var feat = layer.features[i].toGeoJSON(coords.x, coords.y, coords.z)
                    var check = gju.pointInPolygon(
                        { "type": "Point", "coordinates": [latlng.lng, latlng.lat] },
                        feat.geometry
                    )
                    if (!check) continue
                    this.zoomToFeature(feat)
                    this.highlightFeature(feat)
                    this.showPopupThemeLayer({
                        layer: feat,
                        latlng: latlng
                    })
                    /* this.clickFeature({
                        layer: geojson,
                        latlng: latlng
                    }) */
                    return
                }
            }
        })
    }

    clickFeature(e) {
        var layer = e.layer
        this.zoomToFeature(layer)
        this.highlightFeature(layer)
        this.showPopupThemeLayer(e)
        this.setCurrentFeatureProperties(layer.properties)
        this.options.map.triggerChangeLocation(layer)
    }

    getCurrentFeatureName(){
        var prop = this.getCurrentFeatureProperties()
        if(!prop){
            return null
        }
        return prop[this.getFieldTitle()]
    }

    setCurrentFeatureProperties(properties) {
        this.currentlayerProperties = properties
    }

    getCurrentFeatureProperties() {
        return this.currentlayerProperties
    }

    zoomToFeature(feat) {
        this.options.map.setBounds([
            [feat.properties.ymin, feat.properties.xmin],
            [feat.properties.ymax, feat.properties.xmax]
        ])
    }

    setJsonData() {
        this.lastData = this.getDataset()
    }

    getStatisticDataset(){
        return this.options.popoverLayer.statisticDataset()
    }

    getDefaultStyle() {
        return {
            weight: 2,
            opacity: 0,
            color: 'white',
            dashArray: '3',
        }
    }

    highlightFeature(layer) {
        var featId = layer.properties[this.idField]
        this.featureIds.push(featId)
        this.mainVectorTile.setFeatureStyle(
            featId, {
            weight: 2,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        }
        )
    }

    resetHighlight(layer) {
        var featureIdsCopy = this.featureIds.slice()
        for (var i = featureIdsCopy.length; i--;) {
            this.mainVectorTile.setFeatureStyle(
                featureIdsCopy[i],
                this.getDefaultStyle()
            )
            this.featureIds.splice(i, 1)
        }
    }

    getCurrentFeatureId(){
        return this.getCurrentFeatureProperties()[this.getFieldIdGeojson()]
    }

    getFieldIdGeojson(){
        return this.options.popoverLayer.fieldIdGeojson
    }

    getFieldIdDataset(){
        return this.options.popoverLayer.fieldIdDataset
    }

    getFieldTitle(){
        return this.options.popoverLayer.fieldTitle
    }

    showPopupThemeLayer(e) {
        var props = e.layer.properties
        var featId = props[this.getFieldIdGeojson()]
        var data = this.getFeatureData(featId)
        if (!data) return
        var content = this.getPopupContent(props, data)
        if (!content) return
        L.popup({ pane: 'popup' })
            .setLatLng(e.latlng)
            .setContent(content)
            .openOn(this.options.map.getMap())
    }

    getFeatureData(featId) {
        if (!this.lastData) return
        var idx = this.lastData.ids.indexOf(featId)
        if (idx >= 0) {
            return this.lastData.data[idx]
        }
    }

    getPopupContent(props, data) {
        var lineChart = new LineChart({
            width: 80,
            height: 30,
            data: data.last14AvgCases,
            containerId: "linechart-popup",
            color: this.options.map.getDataSource().getTendencyColor(
                data.tendencyCases
            )
        })
        var svgLine = lineChart.create()
        var popupContent
        popupContent = `<div class="grid-container-popup">
                <div class="header-popup">
                    <div><b>${props[this.getFieldTitle()]}</b></div>
                </div>
                <div id="linechart-popup" class="linechart-popup">
                ${svgLine ? `<span>Tendência de casos dos últimos 14 dias</span>
                <div>${svgLine}</div>` : ''}
                </div>
                ${(data && data.totalCases) ? `
                <div class="row1-popup">
                    <div><b>Nº de casos: </b></div>
                </div>
                <div class="value1-popup">
                    <div class="text-center">${(data) ? mFormatter(data.totalCases) : 'sem dados'}</div>
                </div>
                `: ``}
                ${(data && data.totalCases_per_100k_inhabitants)?`
                <div class="row2-popup">
                    <div><b>Casos por 100 mil hab.: </b></div>
                </div>
                <div class="value2-popup">
                    <div class="text-center">${(data) ? Math.floor(data.totalCases_per_100k_inhabitants) : 'sem dados'}</div>
                </div>
                `:``}
                ${(data && data.deaths)?`
                <div class="row3-popup">
                    <div><b>Nº de óbitos: </b></div>
                </div>
                <div class="value3-popup">
                    <div class="text-center">${(data) ? mFormatter(data.deaths) : 'sem dados'}</div>
                </div>
                `:``}
                ${(data && data.deaths_per_100k_inhabitants)? `
                <div class="row4-popup">
                    <div><b>Óbitos por 100 mil hab.:</b></div>
                </div>
                <div class="value4-popup">
                    <div class="text-center">${(data) ? Math.floor(data.deaths_per_100k_inhabitants) : 'sem dados'}</div>
                </div>
                `: ``}
                <div class="row5-popup">
                    <div><b>Letalidade: </b></div>
                </div>
                <div class="value5-popup">
                    <div class="text-center">${(data) ? `${((+data.deaths / +data.totalCases) * 100).toFixed(1)} %` : 'sem dados'}</div>
                </div>
                <div class="row6-popup">
                    <div><b>Dias para dobrar casos: </b></div>
                </div>
                <div class="value6-popup">
                    <div class="text-center">${(data) ? data.nrDiasDobraCasos : 'sem dados'}</div>
                </div>
                <div class="row7-popup">
                    <div><b>Dias para dobrar óbitos: </b></div>
                </div>
                <div class="value7-popup">
                    <div class="text-center">${(data) ? data.nrDiasDobraMortes : 'sem dados'}</div>
                </div>
            </div>`
        return popupContent
    }
}