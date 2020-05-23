const layersModel = require('../models/layers.js')

module.exports.getVectorTilePbf = async (req, res) => {
    let place = req.params.place
    let z = parseInt(req.params.z)
    let x = parseInt(req.params.x)
    let y = parseInt(req.params.y)
    let tilePbf
    if (place == 'city') 
        tilePbf = layersModel.getCitiesVectorTilePbf(z, x, y)
    else if ('state') 
        tilePbf = layersModel.getStatesVectorTilePbf(z, x, y)
    if (!tilePbf) {
        res.writeHead(204, { 'Content-Type': 'text/plain' })
        res.end("Not Content")
        return
    }
    res.writeHead(200, { 'Content-Type': 'application/protobuf' })
    res.write(Buffer.from(tilePbf), 'binary')
    res.end()
}

module.exports.getGeoJSON = async (req, res) => {
    let place = req.params.place
    let id = req.params.id
    let feature
    if (place == 'city') {
        feature = layersModel.getCityGeoJSON(id)
    } else if ('state') {
        feature = layersModel.getStateGeoJSON(id)
    }
    if (!tile) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end("Not found")
        return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(feature));
}