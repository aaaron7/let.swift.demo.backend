'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var Todo = AV.Object.extend('Todo');

// 查询 Todo 列表
router.get('/', function(req, res, next) {
  var query = new AV.Query(Todo);
  query.descending('createdAt');
  query.find().then(function(results) {
    res.render('todos', {
      title: 'TODO 列表',
      todos: results
    });
  }, function(err) {
    if (err.code === 101) {
      // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
      // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
      res.render('todos', {
        title: 'TODO 列表',
        todos: []
      });
    } else {
      next(err);
    }
  }).catch(next);
});

router.get('/list',function(req,res,next){
  var query = new AV.Query(Todo)
  query.descending('createdAt');
  query.find().then(function(results){
    res.writeHead(200,{'Content-Type':'application/json'})
    res.write(JSON.stringify(results))
    res.end()
  }, function(err){
    console.log(err)
  });
});

// 新增 Todo 项目
router.post('/', function(req, res, next) {
  var content = req.body.content;
  var todo = new Todo();
  todo.set('content', content);
  todo.save().then(function(todo) {
    res.redirect('/todos');
  }).catch(next);
});

router.post('/list',function(req, res, next){
  var content = req.body.content;
  var status = req.body.status;
  var todo = new Todo();
  console.log(content + "aaaaaaa")
  todo.set('content', content);
  todo.save().then(function(todo){
    res.writeHead(200, {'Content-Type' : 'application/json'});
    res.write(JSON.stringify(todo))
    res.end()
  }).catch(next);
});

router.post("/list/update", function(req, res, next){
  var objId = req.body.objectId
  var status = req.body.status
  var query = new AV.Query(Todo)
  query.find().then(function(results){
    console.log(JSON.stringify(results))
    for (var itemIndex in results){
      var item = results[itemIndex]
      if (item.id === objId)
      {
        item.save({"status" : status}).then(function(todo){
          res.writeHead(200, {'Content-Type' : 'application/json'});
          var result = {"status" : "success"};
          res.write(JSON.stringify(result));
          res.end()
        }).catch(next);
        return;
      }
    }
    res.writeHead(200, {'Content-Type' : 'application/json'});
    res.write("{'status':'failed'}")
    res.end();
  }).catch(next);

});

module.exports = router;
