var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

require('./server/js/extract');
require('./server/js/combine');
require('./server/js/search');
require('./server/js/locate');

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
      CODES[data] = {
        code:data,
        notifs:{feed:false},
        feed:{},
        archive:{},
        keywords:{},
        pairs:[],
        connections:{}
      };
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
    var output = await extract('', [{href: data.url}],data.depth);
    await xport(output[Object.keys(output)[0]]);
    socket.emit('output');
  })

  socket.on('addKeyword', function(data){
    var keys = CODES[socket.code].keywords;
    for(i in keys){
      if(data.key == keys[i].key){
        return
      }
    }
    CODES[socket.code].keywords[data.key] = {
      id:Math.random(),
      key:data.key,
      type:data.type
    }
    socket.emit('granted', CODES[socket.code]);
  })

  socket.on('launch', async function(){
    await search(socket.code);
    socket.emit('granted',CODES[socket.code]);
    socket.emit('search-complete');
  })

  socket.on('get-loc', async function(data){
    var loc = await locate(socket.code,data);
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('event-loc', function(data){
    CODES[socket.code].keywords[data.key].loc = data.loc;
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('event-time', function(data){
    CODES[socket.code].keywords[data.key].time = data.time;
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('clear', function(data){
    if(data == 'feed'){
      CODES[socket.code].notifs.feed = false;
    }
  })

  socket.on('archive', function(data){
    CODES[socket.code].archive[data] = CODES[socket.code].feed[data];
    CODES[socket.code].feed[data].discard = true;
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('discard', function(data){
    CODES[socket.code].feed[data].discard = true;
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('unarchive', function(data){
    delete CODES[socket.code].archive[data];
    CODES[socket.code].feed[data].discard = false;
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('edit-key', function(data){
    var old = CODES[socket.code].keywords[data.old];
    if(old.key == data.key){
      CODES[socket.code].keywords[data.old].type = data.type;
    } else {
      CODES[socket.code].keywords[data.key] = {
        id:Math.random(),
        key:data.key,
        type:data.type
      }
      delete CODES[socket.code].keywords[data.old];
    }
    socket.emit('granted',CODES[socket.code]);
  })

  socket.on('delete-key', function(data){
    delete CODES[socket.code].keywords[data];
    socket.emit('granted',CODES[socket.code]);
  })
});

http.listen(2000, function() {
  console.log("Server is listening on port 2000");
});
