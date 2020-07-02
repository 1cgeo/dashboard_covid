class CovidMap {
    constructor(dataSource, newOptions) {
        this.options = {
            bounds: [
                [5.878332109674327, -27.685546875000004],
                [-32.175612478499325, -76.11328125000001]
            ],
            maxBounds: [
                [36.2442, 33.8949],
                [-69.4729, -123.1214]
            ]
        }
        this.events = new Signal()
        this.events.createEvent('changeLocation')
        this.events.createEvent('changeLayer')
        this.currentMapLayers = []
        this.currentThemeLayers = []
        this.dataSource = dataSource
        this.setOptions(newOptions)
        this.map = this.create(this.options)
        this.featureGroup = this.createFeatureGroup()
        this.createPanels()
        this.createSearch()
        this.createControls()
        this.createSiderbar()
        this.connectEvents()
        this.createLayersButtons(
            this.dataSource.getMapLayerNames(),
            this.loadMapData.bind(this)
        )
        this.loadMapData(0)
    }

    createSearch() {
        var search = L.control({ position: 'topright' });
        search.onAdd = (map) => {
            var div = L.DomUtil.create('div', '')
            L.DomEvent
                .disableClickPropagation(div)
                .disableScrollPropagation(div);
            div.innerHTML = `<input id="locations" placeholder="Pesquisar"/>`
            return div;
        }
        search.addTo(this.getMap());
        $("#locations").easyAutocomplete({
            data: this.getDataSource().getCityChoroplethData().data
            /* this.getDataSource().getStateChoroplethData().data.concat(
                this.getDataSource().getCityChoroplethData().data
            ) */,
            getValue: "name",
            list: {
                match: {
                    enabled: true
                },
                onChooseEvent: () => {
                    var selectedData = $("#locations").getSelectedItemData()
                    if(this.getCurrentLayerOptions().id == 0){
                        this.loadMapData(1)
                        $("input[name='layer'][value='1']").prop('checked', true)
                    }
                    this.getCurrentPopoverLayer().clickFeatureFromLatlng(
                        { lat: selectedData.lat, lng: selectedData.lng }
                    )
                },
            }
        })
    }

    on(eventName, listener) {
        this.events.connect(eventName, listener)
    }

    triggerChangeLocation(layerClicked) {
        this.events.trigger('changeLocation', layerClicked)
    }

    triggerChangeLayer(layerId) {
        this.events.trigger('changeLayer', layerId)
    }

    setOptions(options) {
        for (var key in options) {
            this.options[key] = options[key]
        }
    }

    createControls() {
        L.control.zoom({
            position: 'topright'
        }).addTo(this.map)
    }

    connectEvents() {
        this.map.on('click', () => {
            this.closeSidebar()
            if (this.getCurrentPopoverLayer() && !this.getCurrentPopoverLayer().eventWasReceived()) {
                this.zoomToDefaultBounds()
                this.map.closePopup()
                this.map.setZoom(4)
                this.triggerChangeLocation()
            }
        })
        this.map.on('mousemove', () => {
            if (this.getCurrentPopoverLayer() && !this.getCurrentPopoverLayer().eventWasReceived()) {
                this.map.closePopup()
            }
        })
        this.map.on('movestart', () => {
            this.closeSidebar()
        })
    }

    closeSidebar() {
        if (!$('#sidebar').hasClass('collapsed')) {
            $('#sidebar').addClass('collapsed')
        }
    }

    createPanels() {
        this.map.createPane('popover');
        this.map.getPane('popover').style.zIndex = 2100;
        this.map.createPane('popup');
        this.map.getPane('popup').style.zIndex = 2110;
        this.map.createPane('heat');
        this.map.getPane('heat').style.zIndex = -1;
        this.map.createPane('vectortilepane');
        this.map.getPane('vectortilepane').style.zIndex = 2000;
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

    zoomToDefaultBounds() {
        this.map.fitBounds(this.options.bounds).setZoom(4)
    }

    create(options) {
        return L.map(
            options.elementId, {
            minZoom: 3,
            zoomControl: false,
            maxBounds: this.options.maxBounds,
        }
        ).fitBounds(this.options.bounds).setZoom(4)
    }

    createFeatureGroup() {
        return L.featureGroup().addTo(this.map)
    }

    getFeatureGroup() {
        return this.featureGroup
    }

    createSiderbar() {
        var sidebar = L.control.sidebar({
            container: 'sidebar',
            autopan: false,
            closeButton: true,
        })
            .addTo(this.map)
        this.sidebar = sidebar
    }

    getSidebar() {
        return this.sidebar
    }

    createLayersButtons(buttons, cb) {
        var id = 'panel-buttons'
        this.sidebar.removePanel(id);
        var buttonsDiv = $("<div></div>")
        buttons.forEach(function (elem, idx) {
            var div = $("<div></div>")
                .attr("class", "custom-control custom-radio")
            var input = $("<input></input>")
                .attr("id", elem.id)
                .attr("type", "radio")
                .attr("class", "custom-control-input")
                .attr("name", "layer")
                .attr("value", elem.id)
            idx == 0 ? input.attr("checked", true) : ""
            var label = $("<label></label>")
                .attr("for", elem.id)
                .attr("class", "custom-control-label")
                .text(elem.name)
            $(div).append($(input))
            $(div).append($(label))
            $(buttonsDiv).append(div)
        })
        this.getSidebar().addPanel({
            id: id,
            tab: '<i class="material-icons">layers</i>',
            pane: buttonsDiv.html(),
            title: 'Camadas'
        })
        $("input[name='layer']").change(function (e) { cb($(this).val()) })
    }

    createThemesButtons(themes, selectId, cb) {
        var id = 'panel-styles'
        this.sidebar.removePanel(id);
        var buttonsDiv = $("<div></div>")
        themes.forEach(function (elem, idx) {
            var div = $("<div></div>")
                .attr("class", "custom-control custom-radio")
            var input = $("<input></input>")
                .attr("id", elem.type.concat(idx))
                .attr("type", "radio")
                .attr("class", "custom-control-input")
                .attr("name", "theme")
                .attr("value", elem.id)
            elem.id == selectId ? input.attr("checked", true) : ""
            var label = $("<label></label>")
                .attr("for", elem.type.concat(idx))
                .attr("class", "custom-control-label")
                .text(elem.name)
            $(div).append($(input))
            $(div).append($(label))
            $(buttonsDiv).append(div)
        })
        var panelContent = {
            id: id,
            tab: '<i class="material-icons">palette</i>',
            pane: buttonsDiv.html(),
            title: 'Temas',
        };
        this.getSidebar().addPanel(panelContent)
        $("input[name='theme']").change(function (e) { cb($(this).val()) })
    }


    startAnimation() {
        this.getCurrentThemeLayer().startAnimation()
    }

    updateAnimation() {
        this.getCurrentThemeLayer().updateAnimation()
        this.getCurrentPopoverLayer().setJsonData()

    }

    stopAnimation() {
        this.getCurrentThemeLayer().stopAnimation()
    }

    setCurrentLayerOptions(layerOptions) {
        this.layerOptions = layerOptions
    }

    getCurrentLayerOptions() {
        return this.layerOptions
    }

    hasThemeId(layerOptions, themeid) {
        return layerOptions.themeLayers.find((elem) => +elem.id === +themeid)
    }

    loadMapData(layerId) {
        var themeId = 0
        var layerOptions = this.dataSource.getMapLayer(+layerId)
        if (this.getCurrentThemeLayer()) {
            themeId = this.getCurrentThemeLayer().getOptions().id
        }
        this.createThemesButtons(
            layerOptions.themeLayers,
            (this.hasThemeId(layerOptions, themeId)) ? themeId : 0,
            this.loadThemeLayer.bind(this)
        )
        this.loadPopoverLayer(layerOptions)
        this.setCurrentLayerOptions(layerOptions)
        this.loadThemeLayer(themeId)
        this.triggerChangeLayer(layerId)
    }

    loadThemeLayer(themeLayerId) {
        this.map.closePopup()
        var themeOptions = this.getCurrentLayerOptions().themeLayers.find((theme) => {
            return theme.id == themeLayerId
        })
        if (!themeOptions) {
            themeOptions = this.getCurrentLayerOptions().themeLayers.find((theme) => {
                return theme.id == 0
            })
        }
        themeOptions.layerId = this.getCurrentLayerOptions().id
        themeOptions.idField = this.getCurrentLayerOptions().idField
        if (this.getCurrentThemeLayer()) this.getCurrentThemeLayer().remove()
        themeOptions.map = this
        var factories = new Factories()
        this.currentThemeLayer = factories.createLayer(themeOptions.type, themeOptions)
    }

    getCurrentThemeLayer() {
        return this.currentThemeLayer
    }

    getCurrentPopoverLayer() {
        return this.currentPopoverLayer
    }

    loadPopoverLayer(layerOptions) {
        if (!layerOptions) return
        if (this.currentPopoverLayer) this.currentPopoverLayer.remove()
        layerOptions.map = this
        var factories = new Factories()
        this.currentPopoverLayer = factories.createLayer('popover', layerOptions)
    }
}