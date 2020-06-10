class CovidMap {
    constructor(dataSource, newOptions) {
        this.options = {
            bounds: [
                [6.577303118123887, 2.3735230318848815],
                [-34.957995310867915, -104.94093009311513]
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
        this.createControls()
        this.createSiderbar()
        this.connectEvents()
        this.createLayersButtons(
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
        this.setBounds(this.options.bounds)
    }

    create(options) {
        return L.map(
            options.elementId, {
                minZoom: 3,
                zoomControl: false,
                //maxBounds: this.options.bounds,
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
        buttons.forEach(function(elem, idx) {
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
        $("input[name='layer']").change(function(e) { cb($(this).val()) })
    }

    createThemesButtons(themes, select, cb) {
        var id = 'panel-styles'
        this.sidebar.removePanel(id);
        var buttonsDiv = $("<div></div>")
        themes.forEach(function(elem, idx) {
            var div = $("<div></div>")
                .attr("class", "custom-control custom-radio")
            var input = $("<input></input>")
                .attr("id", elem.type.concat(idx))
                .attr("type", "radio")
                .attr("class", "custom-control-input")
                .attr("name", "theme")
                .attr("value", elem.id)
            idx == select ? input.attr("checked", true) : ""
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
        $("input[name='theme']").change(function(e) { cb($(this).val()) })
    }


    startAnimation() {
        this.getCurrentThemeLayer().startAnimation()
    }

    updateAnimation() {
        this.getCurrentThemeLayer().updateAnimation()

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

    loadMapData(layerId) {
        this.triggerChangeLayer(layerId)
        var themeId = 0
        var layerOptions = this.dataSource.getMapLayer(+layerId)
        if (this.getCurrentThemeLayer()) {
            themeId = this.getCurrentThemeLayer().getOptions().id
        }
        this.createThemesButtons(
            layerOptions.themeLayers,
            themeId,
            this.loadThemeLayer.bind(this)
        )
        setTimeout(() => {
            this.loadPopoverLayer(layerOptions)
        }, 1)
        this.setCurrentLayerOptions(layerOptions)
        this.loadThemeLayer(themeId)
    }

    loadThemeLayer(themeLayerId) {
        this.map.closePopup()
        var themeOptions = this.getCurrentLayerOptions().themeLayers.find((theme) => {
            return theme.id == themeLayerId
        })
        if (!themeOptions) return
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