const mapthemeModel = require('../models/maptheme.js')

module.exports.getCircleThemeData = async (req, res) => {
    let location = req.query.location
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    if (!location || !['city', 'state'].includes(location)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    mapthemeModel.getCircleThemeData(location, startDate, endDate, function (themeData) {
        if (!themeData) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
    })
}


module.exports.getChoroplethThemeData = async (req, res) => {
    let location = req.query.location
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    if (!location || !['city', 'state'].includes(location)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    mapthemeModel.getChoroplethThemeData(location, startDate, endDate, function (themeData) {
        if (!themeData) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
    })
}


module.exports.getHeatThemeData = async (req, res) => {
    let location = req.query.location
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    if (!location || !['city'].includes(location)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    mapthemeModel.getHeatThemeData(startDate, endDate, function (themeData) {
        if (!themeData) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
    })
}


module.exports.getCountryInformation = async (req, res) => {
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    mapthemeModel.getCountryInformation(startDate, endDate, function (info) {
        if (!info) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end("404 ot found")
            return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info))
    })
}



module.exports.getInformation = async (req, res) => {
    let location = req.query.location
    let id = req.query.id
    let startDate = req.query.startDate
    let endDate = req.query.endDate
    if (!location || !['city', 'state'].includes(location) || !id ) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('400 Bad Request')
        return
    }
    if (location === 'city') {
        mapthemeModel.getCityInformation(id, startDate, endDate, function (info) {
            if (!info) {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end("404 ot found")
                return
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(info))
        })
    } else {
        mapthemeModel.getStateInformation(id, startDate, endDate, function (info) {
            if (!info) {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end("404 ot found")
                return
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(info))
        })
    }

}