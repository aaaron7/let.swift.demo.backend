'use strict';

var router = require('express').Router();
var AV = require('leanengine');
var Fetcher = require('./movie_fetcher');

var RegisteredMovie = AV.Object.extend('registered_movies');
var ReservedTicket = AV.Object.extend('reserved_tickets');
var Movie = AV.Object.extend('movies');

/*
RET CODE DEFINITION:
0 - OK
1 - 
2 - NO MORE SEATS

*/

const RET_OK = 0;
const RET_NO_MORE_SEATS = 2;

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

router.get('/movie_list',function(req, res, next){
    var query = new AV.Query(Movie);
    query.descending('createdAt');
    query.notEqualTo('imdbId','').find().then(function(results){
        response = {}
        response['ret'] = RET_OK;
        response['data'] = results;
        sendJSONText(JSON.stringify(response), res);
    });
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

router.get('/test_fetcher', function(req, res, next){
    Fetcher.getMovies();
});

router.post('/reserved_ticket', function(req, res, next){
    var reservedTicket = new ReservedTicket();
    var screenId = req.body.screenId;
    var imdbId = req.body.imdbId;
    var availableSeats = getAvailableSeats(screenId, imdbId)
    var ticketsCount = getTotalTickets(screenId, imdbId);

    Promise.all([availableSeats, ticketsCount]).then(function(values){
        var movieInfos = values[0];
        var totalTickets = values[1].length;
        console.log(totalTickets);
        if (movieInfos.length > 0)
        {
            var movie = movieInfos[0];
            console.log(movie);
            if (movie.get('availableSeats') > totalTickets)
            {
                reservedTicket.set('screenId', screenId);
                reservedTicket.set('imdbId', imdbId);
                reservedTicket.save().then(function(ticket){
                    sendJSONText(JSON.stringify({"ret":RET_OK, "data":ticket}), res);
                }).catch(next);
            }
            else
            {
                sendJSONText(JSON.stringify({"ret":RET_NO_MORE_SEATS}), res);
            }
        }
    }).catch(next);

});

function sendJSONText(text, res){
    res.writeHead(200, {'Content-Type':'application/json'});
    res.write(text);
    res.end();
}

function getAvailableSeats(screenId, imdbId){
    var query = new AV.Query(RegisteredMovie);
    return query.equalTo("imdbId", imdbId).equalTo('screenId', screenId).find();
}

function getTotalTickets(screenId, imdbId){
    var query = new AV.Query(ReservedTicket);
    return query.equalTo("imdbId", imdbId).equalTo('screenId', screenId).find();
}

module.exports = router;