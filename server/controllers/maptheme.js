const mapthemeModel = require('../models/maptheme.js')

module.exports.getThemeData = async (req, res) => {
    let place = req.params.place
    let theme = req.params.theme
    let functionDataSource
    if (theme == 'circle' && place == 'state')
        functionDataSource = mapthemeModel.getCircleStates
    else if (theme == 'choropleth' && place == 'state')
        functionDataSource = mapthemeModel.getChoroplethStates
    else if (theme == 'heat' && place == 'city')
        functionDataSource = mapthemeModel.getHeatCities
    else if (theme == 'circle' && place == 'city')
        functionDataSource = mapthemeModel.getCircleCities
    else if (theme == 'choropleth' && place == 'city')
        functionDataSource = mapthemeModel.getChoroplethCities
    if (!functionDataSource) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end("Not found")
        return
    }
    functionDataSource( function (themeData) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(themeData))
    })
}