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
                    var feat = e.layer
                    this.options.map.setBounds([
                        [feat.properties.ymin, feat.properties.xmin],
                        [feat.properties.ymax, feat.properties.xmax]
                    ])
                    this.highlightFeature(feat)
                    this.showPopupThemeLayer(e)
                    this.options.map.triggerChangeLocation(feat)
                })
        }
        this.lastData = this.getJsonData()
    }

    getJsonData() {
        if (this.options.id == 0) {
            return this.options.map.getDataSource().getStateChoroplethData()
        }
        return this.options.map.getDataSource().getCityChoroplethData()
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

    showPopupThemeLayer(e) {
        var props = e.layer.properties
        var featId = (props.CD_GEOCUF) ? props.CD_GEOCUF : props.CD_GEOCMU
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

    mFormatter(num) {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + ' mil' : Math.sign(num) * Math.abs(num)
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
        return `
        <div class="grid-container-popup">
            <div class="header-popup">
                <div><b>${(props.NM_ESTADO) ? props.NM_ESTADO : props.NM_MUNICIP}</b></div>
            </div>
            <div id="linechart-popup" class="linechart-popup">
                <span>Tendência de casos dos últimos 14 dias</span>
                <div>${lineChart.create()}</div>
            </div>
            <div class="row1-popup">
                <div><b>Nº de casos: </b></div>
            </div>
            <div class="value1-popup">
                <div class="text-center">${(data) ? this.mFormatter(data.totalCases) : 'sem dados'}</div>
            </div>
            <div class="row2-popup">
                <div><b>Casos por 100 mil hab.: </b></div>
            </div>
            <div class="value2-popup">
                <div class="text-center">${(data) ? Math.floor(data.totalCases_per_100k_inhabitants) : 'sem dados'}</div>
            </div>
            <div class="row3-popup">
                <div><b>Nº de óbitos: </b></div>
            </div>
            <div class="value3-popup">
                <div class="text-center">${(data) ? this.mFormatter(data.deaths) : 'sem dados'}</div>
            </div>
            <div class="row4-popup">
                <div><b>Óbitos por 100 mil hab.:</b></div>
            </div>
            <div class="value4-popup">
                <div class="text-center">${(data) ? Math.floor(data.deaths_per_100k_inhabitants) : 'sem dados'}</div>
            </div>
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
    }
}