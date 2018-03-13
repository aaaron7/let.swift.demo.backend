'use strict';

var router = require('express').Router();
var AV = require('leanengine');
var Fetcher = require('./movie_fetcher');

var RegisteredMovie = AV.Object.extend('registered_movies');
var ReservedTicket = AV.Object.extend('reserved_tickets');
var Movie = AV.Object.extend('movies');
var Screen = AV.Object.extend('screens');

/*
RET CODE DEFINITION:
0 - OK
1 - 
2 - NO MORE SEATS

*/

Date.prototype.addHours = function(h){
    var copiedDate = new Date(this.getTime());
    copiedDate.setHours(copiedDate.getHours() + h);
    return copiedDate;
}

Date.prototype.toUTCDate = function(){
    var now = this;
    var now_utc = new Date();

    var copiedDateUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

    return copiedDateUTC;
}

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
    var screenQuery = new AV.Query(Screen);
    query.descending("createdAt");
    screenQuery.descending("createdAt");
    console.log(screenQuery);

    Promise.all([query.find(), screenQuery.find()]).then(function(values){
        console.log(values);
        res.render('movie', {
            title : 'Movie List',
            register_movies : values[0],
            screens : values[1]
        });
    }).catch(next);
});

router.post('/register_movie_by_date',function(req, res ,next){
    var queryDate = req.body.queryDate;
    console.log(queryDate);
    var query = new AV.Query(RegisteredMovie);
    var beginTime = new Date(queryDate);
    var endTime = new Date(queryDate);

    endTime.setDate(endTime.getDate() + 1);

    query.greaterThanOrEqualTo('beginTime',beginTime.toUTCDate()).lessThanOrEqualTo('beginTime', endTime.toUTCDate()).find().then(function(results){
        sendJSONText(JSON.stringify({"result":results,"ret":RET_OK}), res);
    }).catch(next);
});

router.get('/movie_list',function(req, res, next){
    var query = new AV.Query(Movie);
    query.descending('createdAt');
    query.notEqualTo('imdbId','').find().then(function(results){
        var resp = new Object();
        resp['ret'] = RET_OK;
        resp['data'] = results;
        sendJSONText(JSON.stringify(resp), res);
    }, function(err){
        console.log(err);
    }).catch(next);
});

router.post('/register_movie', function(req, res,next){
    var imdbId = req.body.imdbId;
    var screenId = req.body.screenId;
    var availableSeats = req.body.availableSeats;
    var beginTimeString = req.body.beginTime;
    var endTimeString = req.body.endTime;

    var beginTime = new Date(beginTimeString)
    var endTime;
    if (!endTime || endTimeString.length <= 0){
        endTime = beginTime.addHours(2);    
    }else{
        endTime = new Date(endTimeString);
    }

    var registeredMovie = new RegisteredMovie();
    registeredMovie.set('screenId', screenId);
    registeredMovie.set('imdbId', imdbId);
    registeredMovie.set('availableSeats',Number(availableSeats));
    registeredMovie.set('beginTime',beginTime);
    registeredMovie.set('endTime', endTime);
    
    registeredMovie.save().then(function(movie){
        sendJSONText(JSON.stringify(movie),res);
    }).catch(next);

});

router.get('/test_fetcher', function(req, res, next){
    Fetcher.getMovies();
});

router.post('/add_screen', function(req, res, next){
    var screenId = req.body.screenId;
    var screenName = req.body.screenName;
    var screen = new Screen();
    screen.set('screenId', screenId);
    screen.set('screenName', screenName);
    screen.save().then(function(result){
        sendJSONText('successfully add screen', res);
    }).catch(next);
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