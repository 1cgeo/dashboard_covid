const createError = require('http-errors');
const express = require('express');
const path = require('path');
const apiRouter = require('./server/routes/index');
const app = express();

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);
app.get("*", function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(function(req, res, next) {
    next(createError(404));
});


module.exports = app;