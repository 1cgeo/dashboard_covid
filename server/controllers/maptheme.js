const NodeCache = require("node-cache");
const ttlSeconds = 60 * 60 * 1;
const resCache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
const mapthemeModel = require('../models/maptheme.js')

module.exports.getCircleThemeData = async (req, res) => {
    let location = req.query.location
    if (!location) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    var requestId = `circles${location}`
    var cacheValue = resCache.get(requestId)
    if (cacheValue) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cacheValue))
        return
    }
    mapthemeModel.getCircleThemeData(location, function (themeData) {
        if (!themeData) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
        resCache.set(requestId, themeData)
    })
}


module.exports.getChoroplethThemeData = async (req, res) => {
    let location = req.query.location
    if (!location) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    var requestId = `choropleth${location}`
    var cacheValue = resCache.get(requestId)
    if (cacheValue) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cacheValue))
        return
    }
    mapthemeModel.getChoroplethThemeData(location, function (themeData) {
        if (!themeData) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
        resCache.set(requestId, themeData)
    })
}


module.exports.getHeatThemeData = async (req, res) => {
    let location = req.query.location
    if (!location) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    var requestId = `heat${location}`
    var cacheValue = resCache.get(requestId)
    if (cacheValue) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cacheValue))
        return
    }
    mapthemeModel.getHeatThemeData(location, (themeData) => {
        if (!themeData) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
        resCache.set(requestId, themeData)
    })
}


module.exports.getCountryInformation = async (req, res) => {
    mapthemeModel.getCountryInformation((info) => {
        if (!info) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info))
    })
}


/*
module.exports.getInformation = async(req, res) => {
    let location = req.query.location
    let id = req.query.id
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    if (!location || !['city', 'state'].includes(location) || !id) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    if (location === 'city') {
        mapthemeModel.getCityInformation(id, startDate, endDate, function(info) {
            if (!info) {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end("404 ot found")
                return
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(info))
        })
    } else {
        mapthemeModel.getStateInformation(id, startDate, endDate, function(info) {
            if (!info) {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end("404 ot found")
                return
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(info))
        })
    }

} */