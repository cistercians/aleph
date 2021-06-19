var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var publicEye = require('public-eye')({
    services: {
      geonames: {
        username: 'alephapp'
      }
    }
  });

require('./server/js/extract');

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

SOCKET_LIST = {};
CODES = {};

io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  console.log('Socket connected: ' + socket.id);

  socket.on('disconnect',function(){
    delete SOCKET_LIST[socket.id];
    console.log('Socket disconnected: ' + socket.id);
  })

  socket.on('code', function(data){
    socket.code = data;
    if(!CODES[data]){
      CODES[data] = {};
    }
    socket.emit('granted', CODES[data]);
  })

  xport = function(data){
    console.log('xporting');
    console.log(data);
    for(i in data.keyphrases){
      socket.emit('key', data.keyphrases[i].keyphrase);
      console.log('key: ' + data.keyphrases[i].keyphrase);
    }
    for(i in data.keywords){
      socket.emit('key', data.keywords[i].keyword);
      console.log('key: ' + data.keywords[i].keyword);
    }
    for(i in data.orgs){
      socket.emit('org', data.orgs[i].text);
      console.log('org: ' + data.orgs[i].text);
    }
    for(i in data.people){
      socket.emit('ent', data.people[i].text);
      console.log('ent: ' + data.people[i].text);
    }
    for(i in data.places){
      socket.emit('loc', data.places[i].text);
      console.log('loc: ' + data.places[i].text);
    }
    for(i in data.links){
      xport(data.links[i]);
    }
  }

  socket.on('url', async function(data){
    var output = await extract('', [{href: data.url}], data.depth);
    await xport(output[Object.keys(output)[0]]);
    socket.emit('output');
  })

  socket.on('addKeyword', function(data){
    var keywords = CODES[socket.code].keywords;
    for(i in keywords){
      if(data == keywords[i]){
        return
      }
    }
    CODES[socket.code].keywords[data.key] = {key:data.key,type:data.type};
    socket.emit('granted', CODES[socket.code]);
  })
});

http.listen(2000, function() {
  console.log("Server is listening on port 2000");
});
