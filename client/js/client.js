var socket = io({transports: ['websocket'], upgrade: false});

// DOM elements
var codeDiv = document.getElementById('code');
var inputCode = document.getElementById('code-input');
var menu = document.getElementById('menu');
var feedDiv = document.getElementById('feed');
var addKeywordsDiv = document.getElementById('add');
var inputType = document.getElementById('type-input');
var inputKeyword = document.getElementById('keyword-input');
var keywordList = document.getElementById('keyword-list');
var urlExtractDiv = document.getElementById('url-extract');
var inputDiv = document.getElementById('input');
var inputUrl = document.getElementById('url-input');
var inputDepth = document.getElementById('depth-input');
var extractButton = document.getElementById('extract');
var processingDiv = document.getElementById('processing');
var outputDiv = document.getElementById('output');
var outKey = document.getElementById('out-key');

// Mapbox.js
mapboxgl.accessToken = 'pk.eyJ1IjoiY2lzdGVyY2lhbmNhcGl0YWwiLCJhIjoiY2s5N2RsczhmMGU1dzNmdGEzdzU2YTZhbiJ9.-xDMU_9FYbMXJf3UD4ocCw';
var map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-streets-v11',
  center: [12.4663, 41.9031],
  zoom: 16.35,
  pitch: 45,
  bearing: 0,
  container: 'map',
  antialias: true
});

// The 'building' layer in the mapbox-streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', function(){
  // Insert the layer beneath any symbol layer.
  var layers = map.getStyle().layers;

  var labelLayerId;
  for(var i = 0; i < layers.length; i++){
    if(layers[i].type === 'symbol' && layers[i].layout['text-field']){
      labelLayerId = layers[i].id;
      break;
    }
  }

  // 3d buildings layer
  map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
      'fill-extrusion-color': '#aaa',

      // use an 'interpolate' expression to add a smooth transition effect to the
      // buildings as the user zooms in
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        15.05,
        ['get', 'height']
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        15.05,
        ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.8
    }
  },labelLayerId);

  map.addControl(
    new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl
    })
  );
});

var project = {};
var incoming = {
  key: [],
  ent: [],
  org: [],
  loc: []
};

var sendCode = function(code){
  if(code != ''){
    console.log(code);
    socket.emit('code', code);
  }
};

var clickViewFeed = function(){
  feedDiv.style.display = 'inline';
  addKeywordsDiv.style.display = 'none';
  urlExtractDiv.style.display = 'none';
};

var clickAddKeywords = function(){
  feedDiv.style.display = 'none';
  addKeywordsDiv.style.display = 'inline';
  urlExtractDiv.style.display = 'none';
};

var addKeyword = function(type,keyword){
  socket.emit('addKeyword', {type:type,key:keyword});
  inputType.value = null;
  inputKeyword.value = '';
};

var clickExtractUrl = function(){
  feedDiv.style.display = 'none';
  addKeywordsDiv.style.display = 'none';
  urlExtractDiv.style.display = 'inline';
};

var sendUrl = function(url, depth){
  urlExtractDiv.style.display = 'none';
  inputDiv.style.display = 'none';
  processingDiv.style.display = 'inline';
  socket.emit('url', {url:url, depth:depth});
  inputUrl.value = '';
};

var showOutput = function(){
  outKey.innerHTML = '';
  for(i in incoming){
    var inc = incoming[i];
    for(n in inc){
      outKey.innerHTML += '<li>' + inc[n] + "   <button onclick='deleteKey(&quot;" + inc[n] + "&quot;)'>x</button></li>";
    }
  }
};

var deleteKey = function(key){
  for(i in incoming){
    var inc = incoming[i];
    for(n in inc){
      if(key == inc[n]){
        delete inc[n];
      }
    }
  }
  showOutput();
}

var buildLists = function(){
  keywordList.innerHTML = '';
  for(i in project){
    if(project[i].type == 'ent'){
      keywordList.innerHTML += '<li>👤 ' + project[i].key + '</li>';
    } else if(project[i].type == 'org'){
      keywordList.innerHTML += '<li>🏢 ' + project[i].key + '</li>';
    } else if(project[i].type == 'loc'){
      keywordList.innerHTML += '<li>🌐 ' + project[i].key + '</li>';
    } else {
      keywordList.innerHTML += '<li>' + project[i].key + '</li>';
    }
  }
};

socket.on('granted', function(data){
  project = data;
  buildLists();
  codeDiv.style.display = 'none';
  menu.style.display = 'inline';
});

socket.on('key', function(data){
  for(i in incoming.key){
    if(data == incoming.key[i]){
      return;
    }
  }
  incoming.key.push(data);
  console.log('key: ' + data);
});

socket.on('ent', function(data){
  for(i in incoming.ent){
    if(data == incoming.ent[i]){
      return;
    }
  }
  incoming.ent.push(data);
  console.log('ent: ' + data);
});

socket.on('org', function(data){
  for(i in incoming.org){
    if(data == incoming.org[i]){
      return;
    }
  }
  incoming.org.push(data);
  console.log('org: ' + data);
});

socket.on('loc', function(data){
  for(i in incoming.loc){
    if(data == incoming.loc[i]){
      return;
    }
  }
  incoming.loc.push(data);
  console.log('loc: ' + data);
});

socket.on('output', function(){
  showOutput();
  processingDiv.style.display = 'none';
  outputDiv.style.display = 'inline';
  urlExtractDiv.style.display = 'inline';
});
