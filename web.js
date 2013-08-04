var BufferHelper = require('bufferhelper');
var express = require('express');
var http = require('http');
var iconv = require('iconv-lite');
var jsdom = require('jsdom');
var params = require('express-params');
var url = require('url');
var app = express();
app.use(express.logger());
params.extend(app);

var CODE_SUCCESS = 0;
var CODE_ERROR = 1;

app.get('/list', function(request, response) {
  var page = parseInt(request.param('page')) || 1;
  var options = url.parse('http://123.yehuaer.com/thread0806.php?fid=8&type=1&page=' + page);
  options.headers = {
    'User-Agent': 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'
  };
  http.get(options, function(res) {
    if (res.statusCode != 200) {
      response.send(JSON.stringify({
        code: CODE_ERROR,
        msg: 'Unexpected upstream HTTP status code: ' + res.statusCode,
      }));
      return;
    }

    var buffer = new BufferHelper();
    res.on('data', function(chunk) {
      buffer.concat(chunk);
    }).on('end', function() {
      var buf = buffer.toBuffer();
      var str = iconv.decode(buf, 'GBK');
      var urls = str.match(/href="htm_data\/8\/\d+\/\d+\.html"/g);
      var result = [];
      for (var i = 0; i < urls.length; i++) {
        var beginPos = urls[i].lastIndexOf('/') + 1;
        var endPos = urls[i].lastIndexOf('.');
        var tid = parseInt(urls[i].substring(beginPos, endPos));
        if (result.indexOf(tid) == -1) {
          result.push(tid);
        }
      }
      response.send(JSON.stringify({
        code: CODE_SUCCESS,
        data: result
      }));
    }).on('close', function() {
      response.send(JSON.stringify({
        code: CODE_ERROR,
        msg: 'Upstream HTTP connection closed.'
      }));
    });
  }).on('error', function(e) {
    response.send(JSON.stringify({
      code: CODE_ERROR,
      msg: 'Error: ' + e.message
    }));
  });
});

app.param('tid', Number);

app.get('/:tid', function(request, response) {
  var options = url.parse('http://123.yehuaer.com/read.php?fid=8&tid=' + request.params.tid + '&toread=1');
  options.headers = {
    'User-Agent': 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'
  };
  http.get(options, function(res) {
    if (res.statusCode != 200) {
      response.send(JSON.stringify({
        code: CODE_ERROR,
        msg: 'Unexpected upstream HTTP status code: ' + res.statusCode,
      }));
      return;
    }

    var buffer = new BufferHelper();
    res.on('data', function(chunk) {
      buffer.concat(chunk);
    }).on('end', function() {
      var buf = buffer.toBuffer();
      var str = iconv.decode(buf, 'GBK');
      var beginPos = str.indexOf('<div class="tpc_content"');
      var endPos = str.indexOf('</div>', beginPos);
      var str = str.substring(beginPos, endPos);
      var urls = str.match(/src=['"][^'"]*['"]/g);
      var result = [];
      for (var i = 0; i < urls.length; i++) {
        var url = urls[i].substring(5, urls[i].length - 1);
        result.push(url);
      }
      response.send(JSON.stringify({
        code: CODE_SUCCESS,
        data: result
      }));
    }).on('close', function() {
      response.send(JSON.stringify({
        code: CODE_ERROR,
        msg: 'Upstream HTTP connection closed.'
      }));
    });
  }).on('error', function(e) {
    response.send(JSON.stringify({
      code: CODE_ERROR,
      msg: 'Error: ' + e.message
    }));
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
