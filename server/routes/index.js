const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const morgan = require("morgan");

const layersCtrl = require("../controllers/layers.js");
const mapthemeCtrl = require("../controllers/maptheme.js");

router
  .route("/layer/tile/:place/:z/:x/:y.pbf")
  .get(layersCtrl.getVectorTilePbf);

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

morgan.token("host", function (req, res) {
  return req.hostname;
});

router.use(
  morgan(
    ":date[iso] | :url :method :status | :remote-addr | :host | :response-time[3] ms",
    { stream: accessLogStream }
  )
);

router.route("/maptheme/circle").get(mapthemeCtrl.getCircleThemeData);

router.route("/maptheme/heat").get(mapthemeCtrl.getHeatThemeData);

router.route("/maptheme/choropleth").get(mapthemeCtrl.getChoroplethThemeData);

router.route("/information/country").get(mapthemeCtrl.getCountryInformation);

module.exports = router;
