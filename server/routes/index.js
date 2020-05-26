const express = require('express');
const router = express.Router();

const layersCtrl = require('../controllers/layers.js');
const mapthemeCtrl = require('../controllers/maptheme.js');

router
    .route('/layer/tile/:place/:z/:x/:y.pbf')
    .get(layersCtrl.getVectorTilePbf);

router
    .route('/layer/:place/:id')
    .get(layersCtrl.getGeoJSON)

router
    .route('/maptheme/:theme/:place')
    .get(mapthemeCtrl.getThemeData)

/* router
    .route('/info/states/:id')
    .get(mapthemeCtrl.getStatesInfo)

router
    .route('/info/cities/:id')
    .get(mapthemeCtrl.getCitesInfo) */

router
    .route('/info/country')
    .get(mapthemeCtrl.getCountryInfo)

module.exports = router;