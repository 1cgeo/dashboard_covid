class HeatLayer extends Layer {
  constructor(newOptions) {
    super(newOptions);
    this.currentProcessKey = "";
    this.layers = [];
    this.rangeData = null;
    this.heatData = {
      ids: [],
      data: [],
    };
    this.create();
  }

  remove() {
    this.currentProcessKey = "";
    if (this.currentLegend) {
      this.options.map.getMap().removeControl(this.currentLegend);
      this.currentLegend = null;
    }
    for (var i = this.layers.length; i--; ) {
      this.options.map.getFeatureGroup().removeLayer(this.layers[i]);
    }
    this.layers = [];
    this.options.map.getFeatureGroup().removeLayer(this.layer);
    this.rangeData = null;
  }

  startAnimation() {
    if (this.layer) this.options.map.getFeatureGroup().removeLayer(this.layer);
    this.layer = L.heatLayer([], {
      interactive: true,
      radius: 15,
      blur: 15,
      gradient: this.getGradientStyle(),
      minOpacity: 0.5,
    });
    this.options.map.getFeatureGroup().addLayer(this.layer);
  }

  updateAnimation() {
    var locations = this.processData(
      this.options.map.getDataSource().getHeatData(),
      "ibgeID"
    );
    this.layer.setLatLngs(locations);
  }

  stopAnimation() {
    this.layer.setLatLngs(
      this.processData(this.options.map.getDataSource().getHeatData(), "ibgeID")
    );
  }

  getPopupContent(e) {
    var props = e.layer.properties;
    var featId = props.CD_GEOCUF ? props.CD_GEOCUF : props.CD_GEOCMU;
    var idx = this.heatData.ids.indexOf(featId);
    if (idx < 0) return;
    var featData = this.heatData.data[idx];
    return `<div class="grid-container-popup">
            <div class="header-popup">
                <div><b>${
                  props.NM_ESTADO ? props.NM_ESTADO : props.NM_MUNICIP
                }</b></div>
            </div>
            <div class="row2-popup">
                    <div><b>Número de ${
                      this.options.attributeName === "deaths"
                        ? "óbitos"
                        : "casos"
                    }:</b></div>
                </div>
                <div class="value2-popup">
                    <div>${this.mFormatter(
                      +featData[this.options.attributeName]
                    )}</div>
                </div>
        </div>`;
  }

  processData(jsonData, comp) {
    var listedId = [];
    var locations = [];
    for (var i = jsonData.length; i--; ) {
      if (!jsonData[i].latlong[0] || !jsonData[i].latlong[1]) {
        continue;
      }
      if (listedId.includes(jsonData[i][comp])) continue;
      if (this.options.layerId === 1) {
        this.heatData.ids.push(jsonData[i].ibgeID);
        this.heatData.data.push(jsonData[i]);
      }
      locations.push(
        jsonData[i].latlong.concat(jsonData[i][this.options.attributeName])
      );
    }
    return locations;
  }

  create() {
    var processKey = this.createUUID();
    this.currentProcessKey = processKey;
    var jsonData = this.options.map.getDataSource().getHeatData();
    if (jsonData.length < 1) {
      return;
    }
    if (this.options.layerId === 0) {
      setTimeout(() => {
        this.options.map
          .getDataSource()
          .getStateChoroplethData()
          .forEach((data) => {
            var idx = this.heatData.ids.indexOf(data.CD_GEOCUF);
            if (idx < 0) {
              this.heatData.ids.push(data.CD_GEOCUF);
              this.heatData.data.push(data);
            } else {
              var currentDate = new Date(
                this.heatData.data[idx].date.replace("-", "/")
              );
              var elemDate = new Date(data.date.replace("-", "/"));
              this.heatData.data[idx] =
                currentDate > elemDate ? this.heatData.data[idx] : data;
            }
          });
      }, 2);
    }
    var locations = this.processData(jsonData, "ibgeID");
    if (processKey !== this.currentProcessKey) return;
    this.loadVectorTile();
    if (this.layer) this.options.map.getFeatureGroup().removeLayer(this.layer);
    this.loadHeat(locations);
    if (!this.currentLegend) this.createLegend();
  }

  loadHeat(locations) {
    this.layer = L.heatLayer(locations, {
      interactive: true,
      radius: 15,
      blur: 15,
      gradient: this.getGradientStyle(),
      minOpacity: 0.5,
    });
    this.options.map.getFeatureGroup().addLayer(this.layer);
  }

  getGradientStyle() {
    return {
      0.3: "gray",
      0.6: "purple",
      0.8: "yellow",
      0.95: "lime",
      1.0: "red",
    };
  }

  loadVectorTile() {
    var mapLayers = this.options.map.getCurrentLayerOptions().mapLayers;
    if (mapLayers.length < 1) {
      return;
    }
    for (var i = mapLayers.length; i--; ) {
      this.idField = mapLayers[i].idField;
      var isMain = mapLayers[i].main;
      var layer = this.createVectorGrid(
        mapLayers[i],
        this.getVectorTileStyle(isMain)
      );
      if (isMain) {
        this.mainVectorTile = layer;
      }
      this.options.map.getFeatureGroup().addLayer(layer);
      this.layers.push(layer);
    }
  }

  getVectorTileStyle(isMain) {
    if (isMain) {
      return {
        weight: 0.2,
        opacity: 0.7,
        color: "black",
      };
    }
    return {
      weight: 1,
      opacity: 0.3,
      color: "black",
    };
  }

  createVectorGrid(mapLayer, style) {
    var layer = L.vectorGrid.protobuf(mapLayer.url, {
      pane: "vectortilepane",
      rendererFactory: L.canvas.tile,
      vectorTileLayerStyles: {
        data: style,
      },
      interactive: true,
      getFeatureId: (feature) => {
        return feature.properties[mapLayer.idField];
      },
    });
    return layer;
  }

  createLegend() {
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function (map) {
      var div = L.DomUtil.create("div");
      div.innerHTML = `
            <div class="container-gradient">
            <div class="gradient-value"></div>
            <div class="gradient-text1"><b>Alta</b></div>
            <div class="gradient-text2"><b>Média</b></div>
            <div class="gradient-text3"><b>Baixa</b></div>
        </div>`;
      return div;
    }.bind(this);
    legend.addTo(this.options.map.getMap());
    this.currentLegend = legend;
  }
}
