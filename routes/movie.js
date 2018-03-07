'use strict';

var router = require('express').Router();
var AV = require('leanengine');

var RegisteredMovie = AV.Object.extend('registered_movies');
var ReservedTicket = AV.Object.extend('reserved_ticket');


router.get('/movie', function(req, res, next){
    var query = new AV.Query(RegisteredMovie)
    query.descending("createdAt");
    query.find().then(function(result){

    });
    sendJSONText("{'result':'ok'}",res);
}, function(err){

});

router.get('/',function(req, res, next){
    var query = new AV.Query(RegisteredMovie);
    query.descending("createdAt");
    query.find().then(function(results){
        res.render('movie', {
            title : 'Movie List',
            register_movies : results
        });
    }).catch(next);
});

router.post('/register_movie', function(req, res,next){
    var imdbId = req.body.imdbId;
    var screenId = req.body.screenId;
    var availableSeats = req.body.availableSeats;
    var registeredMovie = new RegisteredMovie();
    registeredMovie.set('screenId', screenId);
    registeredMovie.set('imdbId', imdbId);
    registeredMovie.set('availableSeats',Number(availableSeats));

    registeredMovie.save().then(function(movie){
        sendJSONText(JSON.stringify(movie),res);
    }).catch(next);
});

router.post('/reserved_ticket', function(req, res, next){
    var reservedTicket = new ReservedTicket();
    var screenId = req.body.screenId;
    var imdbId = req.body.imdbId;
    reservedTicket.set('screenId', screenId);
    reservedTicket.set('imdbId', imdbId);
    reservedTicket.save().then(function(ticket){
        sendJSONText(JSON.stringify(ticket), res);
    }).catch(next);
});

function sendJSONText(text, res){
    res.writeHead(200, {'Content-Type':'application/json'});
    res.write(text);
    res.end();
}

module.exports = router;