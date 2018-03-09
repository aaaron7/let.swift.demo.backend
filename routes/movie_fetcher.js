var cheerio = require('cheerio');
var https = require('https');
var iconv = require('iconv-lite');

var AV = require('leanengine');
var Movie = AV.Object.extend("movies");

function getMovies(){
    var url ="https://movie.douban.com/coming";

    https.get(url, function(sres){
        var chunks = [];
        sres.on('data', function(chunk){
            chunks.push(chunk);
        });
    
        sres.on('end', function(){
            var titles = [];
            var html = iconv.decode(Buffer.concat(chunks), 'utf-8');
            var $ = cheerio.load(html, {decodeEntities : false});
    
            $('.grid-16-8 td a').each(function(idx, element){
                var $element = $(element);
                var title = $element.text();
                var url = $element.attr().href;
    
                getMovieInfo(url, function(info){
                    saveMovieInfo(title, info).then(function(movie){
                        console.log("saved a movie");
                    });
                });
            });
        });
    });
}

function saveMovieInfo(movieName, extraInfo){
    var movie = new Movie();
    movie.set('category', extraInfo.category);
    movie.set('name', movieName);
    movie.set('director', extraInfo.director);
    movie.set('poster', extraInfo.poster);
    movie.set('imdbId', extraInfo.imdbId);
    return movie.save();
}

function getMovieInfo(url,callback){
    https.get(url, function(sres){
        var chunks = [];
        sres.on('data', function(chunk){
            chunks.push(chunk);
        });

        sres.on('end', function(){
            var html = iconv.decode(Buffer.concat(chunks),'utf-8');
            var $ = cheerio.load(html, {decodeEntities : false});
            var poster =$($('#mainpic img')[0]).attr().src;
            var imdbId = "";
            var director = "";
            var category = "";
            $('#info span').each(function(idx, element){
                var $element = $(element);
                if ($element.text() == "IMDb链接:"){
                    imdbId = $($element.next()).text();
                }else if ($element.text() == "导演"){
                    var next = $element.next();
                    director = $($('a',next)[0]).text()
                }else if ($element.text() == "类型:"){
                    category = $($element.next()).text();
                }
            });
            var extraInfo = {};
            extraInfo.category = category;
            extraInfo.poster = poster;
            extraInfo.director = director;
            extraInfo.imdbId = imdbId;
            callback(extraInfo);
        });
    });
}

exports.getMovieInfo = getMovieInfo;
exports.saveMovieInfo = saveMovieInfo;
exports.getMovies = getMovies;

getMovieInfo("https://movie.douban.com/subject/6390825/",function(info){
    console.log(info);
})