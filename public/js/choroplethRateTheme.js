class ChoroplethRateLayer extends Layer {
  constructor(newOptions) {
    super(newOptions);
    this.currentProcessKey = "";
    this.vectorTiles = [];
    this.limits = [];
    this.scenes = [];
    this.rangeData = null;
    this.create();
  }

  startAnimation() {
    this.updateAnimation();
  }

  stopAnimation() {
    this.updateAnimation();
  }

  updateAnimation() {
    var processKey = this.createUUID();
    this.currentProcessKey = processKey;
    var jsonData = this.getDataset();
    if (jsonData.length < 1) {
      return;
    }
    var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers;
    if (mapLayers.length < 1) {
      return;
    }
    var mainLayer = mapLayers.find((l) => l.main);
    this.lastData = jsonData;

    if (processKey !== this.currentProcessKey) return;

    this.currentPane = this.currentPane === "fill1" ? "fill2" : "fill1";
    if (this.currentPane == "fill1") {
      this.options.map.getMap().getPane("fill2").style.zIndex = 2045;
      this.options.map.getMap().getPane("fill1").style.zIndex = 2030;
    }
    var layer = this.createVectorGrid(
      mainLayer,
      this.options.attributeName,
      this.options.attributeNameSecondary,
      false
    );
    this.options.map.getFeatureGroup().addLayer(layer);
    this.mainVectorTile = layer;
    this.scenes.push(layer);
    setTimeout(() => {
      if (this.scenes.length > 1) {
        var l = this.scenes.shift();
        this.options.map.getFeatureGroup().removeLayer(l);
      }
    }, 1500);
  }

  remove() {
    this.currentProcessKey = "";
    if (this.currentLegend) {
      this.options.map.getMap().removeControl(this.currentLegend);
      this.currentLegend = null;
    }
    for (var i = this.vectorTiles.length; i--;) {
      this.options.map.getFeatureGroup().removeLayer(this.vectorTiles[i]);
    }
    this.layers = [];
    for (var i = this.limits.length; i--;) {
      this.options.map.getFeatureGroup().removeLayer(this.limits[i]);
    }
    this.limits = [];
    for (var i = this.scenes.length; i--;) {
      this.options.map.getFeatureGroup().removeLayer(this.scenes[i]);
    }
    this.scenes = [];
    this.rangeData = null;
  }

  loadPanels() {
    if (!this.options.map.getMap().getPane("limitpane")) {
      this.options.map.getMap().createPane("limitpane");
      this.options.map.getMap().getPane("limitpane").style.zIndex = 2050;
    }
    if (!this.options.map.getMap().getPane("fill1")) {
      this.options.map.getMap().createPane("fill1");
      this.options.map.getMap().getPane("fill1").style.zIndex = 2045;
    }
    if (!this.options.map.getMap().getPane("fill2")) {
      this.options.map.getMap().createPane("fill2");
      this.options.map.getMap().getPane("fill2").style.zIndex = 2030;
    }
  }

  /*  getJsonData() {
     if (this.options.layerId == 0) {
       return this.options.map.getDataSource().getStateChoroplethData();
     }
     return this.options.map.getDataSource().getCityChoroplethData();
   } */

  loadTimeInterval() {
    this.options.map.getDataSource().setChoroplethTimeInterval(
      this.options.map.getCurrentLayerOptions().id
    )
  }

  create() {
    this.loadTimeInterval()
    var processKey = this.createUUID();
    this.currentProcessKey = processKey;
    var jsonData = this.getDataset();
    if (jsonData.length < 1) {
      return;
    }
    var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers;
    this.lastData = jsonData;
    if (mapLayers.length < 1) {
      return;
    }
    if (processKey !== this.currentProcessKey) return;
    this.loadPanels();
    this.loadLimits(mapLayers);
    for (var i = mapLayers.length; i--;) {
      this.idField = mapLayers[i].idField;
      var loadOtherStyle = mapLayers[i].main ? false : true;
      this.currentPane = "fill1";
      var layer = this.createVectorGrid(
        mapLayers[i],
        this.options.attributeName,
        this.options.attributeNameSecondary,
        loadOtherStyle
      );
      this.options.map.getFeatureGroup().addLayer(layer);
      this.vectorTiles.push(layer);
      if (mapLayers[i].main) {
        this.mainVectorTile = layer;
        this.scenes.push(layer);
      }
    }
    if (!this.currentLegend) this.createLegend();
  }

  loadLimits(mapLayers) {
    for (var i = mapLayers.length; i--;) {
      var idField = mapLayers[i].idField;
      var layer = L.vectorGrid.protobuf(mapLayers[i].url, {
        pane: "limitpane",
        rendererFactory: L.canvas.tile,
        vectorTileLayerStyles: {
          data: mapLayers[i].styleLimit
        },
        interactive: true,
        getFeatureId: (feature) => {
          return feature.properties[idField];
        },
      });
      this.options.map.getFeatureGroup().addLayer(layer);
      this.limits.push(layer);
    }
  }

  createVectorGrid(mapLayer, attrLabel1, attrLabel2, loadDefaultStyle) {
    var layer = L.vectorGrid.protobuf(mapLayer.url, {
      rendererFactory: L.canvas.tile,
      pane: this.currentPane,
      vectorTileLayerStyles: {
        data: (feat) => {
          if (loadDefaultStyle) return mapLayer.style;
          var idx = this.lastData.ids.indexOf(feat[mapLayer.idField]);
          if (idx >= 0) {
            feat.rate = +this.lastData.data[idx][attrLabel1];
            feat[attrLabel2] = +this.lastData.data[idx][attrLabel2];
            return this.getStyle(feat.rate, feat[attrLabel2]);
          }
          feat.rate = 0;
          feat[attrLabel2] = 0;
          return this.getStyle(feat.rate, feat[attrLabel2]);
        },
      },
      interactive: true,
      getFeatureId: (feature) => {
        return feature.properties[mapLayer.idField];
      },
    });
    return layer;
  }

  showPopup(e) {
    L.popup({
      pane: "popup",
      closeButton: false,
    })
      .setLatLng(this.options.map.getMap().layerPointToLatLng(e.layerPoint))
      .setContent(this.getPopupContent(e))
      .openOn(this.options.map.getMap());
  }

  getStyle(attrLabel1, attrLabel2) {
    return {
      weight: 0,
      opacity: 0,
      color: "white",
      dashArray: "2",
      fill: true,
      fillOpacity: 1,
      fillColor: this.getColor(attrLabel1, attrLabel2),
    };
  }

  getRate() {
    return this.getOptions().rate
  }

  getColor(attrLabel1, attrLabel2) {
    var colors = this.getHexColors();
    if (+attrLabel2 === 0) {
      return "#eeeeee";
    } else if (+attrLabel2 < this.getLimiteValue()) {
      return "#bdbdbd";
    } else {
      return attrLabel1 < this.getRate()[0]
        ? colors[3]
        : attrLabel1 < this.getRate()[1]
          ? colors[2]
          : attrLabel1 < this.getRate()[2]
            ? colors[1]
            : colors[0];
    }
  }

  getAttributeName() {
    return this.options.attributeNameSecondary;
  }

  getLimiteValue() {
    return this.getAttributeName() === "deaths" ? 10 : 100;
  }

  getHexColors() {
    return this.getAttributeName() === "deaths"
      ? ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#6a51a3"]
      : ["#fee5d9", "#ffae43", "#ff6e0b", "#ce0a05"];
  }

  getLegendContent() {
    var colors = this.getHexColors();
    var tag = this.getAttributeName() === "deaths" ? "Óbitos" : "Casos";
    return `<div class="grid-choropleth-legend">
                <div class="y">
                    <div>${tag} atualmente dobrando a cada...</div>
                </div>
                <div class="a" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: ${
      colors[3]
      };">
                    </div>
                </div>
                <div class="b" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: ${
      colors[2]
      };">
                    </div>
                </div>
                <div class="c" style="width:60px; height:15px; background-color: none; border-right:solid">
                    <div style="width:60px; height:10px; background-color: ${
      colors[1]
      };">
                    </div>
                </div>
                <div class="d" style="width:80px; height:15px; background-color: none;">
                    <div style="width:60px; height:10px; background-color: ${
      colors[0]
      };">
                    </div>
                </div>
                <div class="e" style="width:70px; height:15px; background-color: none;">
                    <div style="width:40px; height:10px; background-color: #bdbdbd;">
                    </div>
                </div>
                <div class="f" style="width:30px; height:15px; background-color: none;">
                    <div style="width:40px; height:10px; background-color: #eeeeee;">
                    </div>
                </div>
                <div class="h" style="width:50px;">
                    <div>${this.getRate()[0]} dias</div>
                </div>
                <div class="i" style="width:50px; height:15px; background-color: none;">
                    <div>${this.getRate()[1]} dias</div>
                </div>
                <div class="j" style="width:50px; height:15px; background-color: none;">
                    <div>${this.getRate()[2]} dias</div>
                </div>
                <div class="l" style="width:90px; height:15px; background-color: none;">
                    <div> &lt; ${this.getLimiteValue()} ${tag.toLowerCase()}</div>
                </div>
                <div class="m" style="width:80px; height:15px; background-color: none;">
                    <div>Não reportados</div>
                </div>
            </div>`;
  }

  createLegend() {
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = (map) => {
      var div = L.DomUtil.create("div", "");
      div.innerHTML = this.getLegendContent();
      return div;
    };
    legend.addTo(this.options.map.getMap());
    this.currentLegend = legend;
  }
}
