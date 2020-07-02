const express = require('express');
const router = express.Router();

const layersCtrl = require('../controllers/layers.js');
const mapthemeCtrl = require('../controllers/maptheme.js');

router
    .route('/layer/tile/:place/:z/:x/:y.pbf')
    .get(layersCtrl.getVectorTilePbf);


router
    .route('/maptheme/circle')
    .get(mapthemeCtrl.getCircleThemeData)


router
    .route('/maptheme/heat')
    .get(mapthemeCtrl.getHeatThemeData)


router
    .route('/maptheme/choropleth')
    .get(mapthemeCtrl.getChoroplethThemeData)


router
    .route('/information/country')
    .get(mapthemeCtrl.getCountryInformation)

module.exports = router;