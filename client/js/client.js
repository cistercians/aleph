var socket = io({transports: ['websocket'], upgrade: false});

// DOM elements
var codeDiv = document.getElementById('code');
var inputCode = document.getElementById('code-input');
var menu = document.getElementById('menu');
var intelFeed = document.getElementById('intel-feed');
var feedDiv = document.getElementById('feed');
var feedTable = document.getElementById('feed-table');
var archive = document.getElementById('archive-button');
var archiveDiv = document.getElementById('archive');
var archiveSel = document.getElementById('archive-select');
var archiveTable = document.getElementById('archive-table');
var keywordsDiv = document.getElementById('keywords');
var inputType = document.getElementById('type-input');
var inputKeyword = document.getElementById('keyword-input');
var launchSearch = document.getElementById('launch-search');
var keywordList = document.getElementById('keyword-list');
var urlExtractDiv = document.getElementById('url-extract');
var inputDiv = document.getElementById('input');
var inputUrl = document.getElementById('url-input');
var inputDepth = document.getElementById('depth-input');
var extractButton = document.getElementById('extract');
var processingDiv = document.getElementById('processing');
var outputDiv = document.getElementById('output');
var outKey = document.getElementById('out-key');
var outSubmit = document.getElementById('out-submit');
var areaStudyDiv = document.getElementById('area-study');

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

// Points of interest
var poi = {
  'type':'geojson',
  'data':{
    'type':'FeatureCollection',
    'features':[]
  }
};

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

var homeView = function(){
  buildList();
  var llong = null;
  var llat = null;
  var hlong = null;
  var hlat = null;
  for(i in poi['data']['features']){
    var p = poi['data']['features'][i]['geometry']['coordinates'];
    if(!llong){
      llong = p[0];
    } else if(p[0] < llong){
      llong = p[0];
    }
    if(!hlong){
      hlong = p[0];
    } else if(p[0] > hlong){
      hlong = p[0];
    }
    if(!llat){
      llat = p[1];
    } else if(p[1] < llat){
      llat = p[1];
    }
    if(!hlat){
      hlat = p[1];
    } else if(p[1] > hlat){
      hlat = p[1];
    }
  }
  var mlong = (hlong - llong) * 0.2;
  var mlat = (hlat - llat) * 0.1;
  var sw = [llong-mlong,llat-mlat];
  var ne = [hlong,hlat];
  map.fitBounds([sw,ne]);
};

// LOG IN
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

// INTEL FEED
var clickIntelFeed = function(){
  feedDiv.style.display = 'inline';
  archiveDiv.style.display = 'none';
  keywordsDiv.style.display = 'none';
  urlExtractDiv.style.display = 'none';
  areaStudyDiv.style.display = 'none';
  intelFeed.className = null;
  project.notifs.feed = false;
  socket.emit('clear','feed');
};

var popFeed = function(){
  feedTable.innerHTML = '';
  for(i in project.feed){
    var u = project.feed[i];
    if(!u.discard){
      feedTable.innerHTML += "<tr><td><button onclick='archiveLink(&quot;" + u.url + "&quot;)'>📁</button><button onclick='discardLink(&quot;" + u.url + "&quot;)'>x</button></td><td><a href='" + u.url + "' target='_blank'>" + u.title + '</td><td>' + u.pair + '</td></tr>';
    }
  }
};

var archiveLink = function(link){
  socket.emit('archive',link);
};

var discardLink = function(link){
  socket.emit('discard',link);
};

// ARCHIVE
var clickArchive = function(){
  feedDiv.style.display = 'none';
  archiveDiv.style.display = 'inline';
  keywordsDiv.style.display = 'none';
  urlExtractDiv.style.display = 'none';
  areaStudyDiv.style.display = 'none';
};

var buildArchive = function(key){
  if(Object.keys(project.archive).length > 0){
    archiveSel.style.display = 'inline';
  }
  archiveTable.innerHTML = '';
  archiveSel.innerHTML = '<option value=null></option>';
  for(i in project.keywords){
    var k = project.keywords[i];
    if(k.key == key){
      archiveSel.innerHTML += "<option value='" + k.key + "' selected>" + k.key + "</option>";
    } else {
      archiveSel.innerHTML += "<option value='" + k.key + "'>" + k.key + "</option>";
    }
  }
  if(key){
    for(n in project.archive){
      var link = project.archive[n];
      if(link.pairs[0] == key || link.pairs[1] == key){
        archiveTable.innerHTML += "<tr><td><button onclick='inspectLink(&quot;" + link.url + "&quot;)'>🔍</button><button onclick='unarchive(&quot;" + link.url + "&quot;)'>x</button></td><td><a href='" + link.url + "' target='_blank'>" + link.title + '</td><td>' + link.pair + '</td></tr>';
      }
    }
  } else {
    for(n in project.archive){
      var link = project.archive[n];
      archiveTable.innerHTML += "<tr><td><button onclick='inspectLink(&quot;" + link.url + "&quot;)'>🔍</button><button onclick='unarchive(&quot;" + link.url + "&quot;)'>x</button></td><td><a href='" + link.url + "' target='_blank'>" + link.title + '</td><td>' + link.pair + '</td></tr>';
    }
  }
};

var inspectLink = function(link){
  inputUrl.value = link;
  archiveDiv.style.display = 'none';
  urlExtractDiv.style.display = 'inline';
};

var unarchive = function(link){
  socket.emit('unarchive',link);
};

// KEYWORDS
var clickKeywords = function(){
  feedDiv.style.display = 'none';
  archiveDiv.style.display = 'none';
  keywordsDiv.style.display = 'inline';
  urlExtractDiv.style.display = 'none';
  areaStudyDiv.style.display = 'none';
};

var buildList = function(){
  poi['data']['features'] = [];
  keywordList.innerHTML = '';
  for(i in project.keywords){
    var k = project.keywords[i];
    if(k.type == 'ent'){
      keywordList.innerHTML += "<tr id='" + k.id + "'><td>👤</td><td>" + k.key + "</td><td><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
    } else if(k.type == 'org'){
      keywordList.innerHTML += "<tr id='" + k.id + "'><td>🏢</td><td>" + k.key + "</td><td><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
    } else if(k.type == 'loc'){
      if(k.loc){
        keywordList.innerHTML += "<tr id='" + k.id + "'><td>🌐</td><td>" + k.key + "</td><td><button onclick='map.flyTo({center:[" + k.loc + "],essential:true})'>⌖</button><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
        var feature = {
          'type':'Feature',
          'properties':{
            'description':'<strong>' + k.key + '</strong>'
          },
          'geometry':{
            'type':'Point',
            'coordinates':k.loc
          }
        };
        poi['data']['features'].push(feature);
      } else {
        keywordList.innerHTML += "<tr id='" + k.id + "'><td>🌐</td><td>" + k.key + "</td><td><button class='notif' onclick='getLoc(&quot;" + k.key + "&quot;)'>⌖</button><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
      }
    } else if(k.type == 'event'){
      if(k.loc){
        var feature = {
          'type':'Feature',
          'properties':{
            'description':'<strong>' + k.key + '</strong>'
          },
          'geometry':{
            'type':'Point',
            'coordinates':k.loc
          }
        };
        poi['data']['features'].push(feature);
        if(k.time){
          keywordList.innerHTML += "<tr id='" + k.id + "'><td>📅</td><td>" + k.key + "</td><td><button onclick='map.flyTo({center:[" + k.loc + "],essential:true})'>⌖</button><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
        } else {
          keywordList.innerHTML += "<tr id='" + k.id + "'><td>📅</td><td>" + k.key + "</td><td><button onclick='map.flyTo({center:[" + k.loc + "],essential:true})'>⌖</button><button class='notif' onclick='getTime(" + k.id + ",&quot;" + k.key + "&quot;)'>⏱</button><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
        }
      } else {
        if(k.time){
          keywordList.innerHTML += "<tr id='" + k.id + "'><td>📅</td><td>" + k.key + "</td><td><button class='notif' onclick='eventLoc(" + k.id + ",&quot;" + k.key + "&quot;)'>⌖</button><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
        } else {
          keywordList.innerHTML += "<tr id='" + k.id + "'><td>📅</td><td>" + k.key + "</td><td><button class='notif' onclick='eventLoc(" + k.id + ",&quot;" + k.key + "&quot;)'>⌖</button><button class='notif' onclick='getTime(" + k.id + ",&quot;" + k.key + "&quot;)'>⏱</button><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
        }
      }
    } else {
      keywordList.innerHTML += "<tr id='" + k.id + "'><td></td><td>" + k.key + "</td><td><button onclick='editKey(" + k.id + ",&quot;" + k.key + "&quot;)'>✎</button></td></tr>";
    }
  }
  if(Object.keys(project.keywords).length > 1){
    launchSearch.style.display = 'inline';
  }
};

var addKeyword = function(type,keyword){
  if(keyword !== ''){
    socket.emit('addKeyword', {key:keyword,type:type});
    inputType.value = null;
    inputKeyword.value = '';
  }
};

var launch = function(){
  launchSearch.disabled = true;
  socket.emit('launch',project.code);
  keywordsDiv.style.display = 'none';
  processingDiv.style.display = 'inline';
};

var editKey = function(id,key){
  var str = String(id);
  var k = project.keywords[key];
  var t = k.type;
  var row = document.getElementById(str);
  var type = null;
  if(k.type == 'ent'){
    type = "<td><select id='" + id + "-type'><option value=null></option><option value='ent' selected>👤</option><option value='org'>🏢</option><option value='loc'>🌐</option><option value='event'>📅</option></select></td>";
  } else if(k.type == 'org'){
    type = "<td><select id='" + id + "-type'><option value=null></option><option value='ent'>👤</option><option value='org' selected>🏢</option><option value='loc'>🌐</option><option value='event'>📅</option></select></td>";
  } else if(k.type == 'loc'){
    type = "<td><select id='" + id + "-type'><option value=null></option><option value='ent'>👤</option><option value='org'>🏢</option><option value='loc' selected>🌐</option><option value='event'>📅</option></select></td>";
  } else if(k.type == 'event'){
    type = "<td><select id='" + id + "-type'><option value=null></option><option value='ent'>👤</option><option value='org'>🏢</option><option value='loc'>🌐</option><option value='event' selected>📅</option></select></td>";
  } else {
    type = "<td><select id='" + id + "-type'><option value=null></option><option value='ent'>👤</option><option value='org'>🏢</option><option value='loc'>🌐</option><option value='event'>📅</option></select></td>";
  }
  var keyword = "<td><input type='text' id='" + id + "-key' value='" + k.key + "'></input></td>";
  var submit = "<button onclick='submitEdit(&quot;" + id + "&quot;,&quot;" + k.key + "&quot;)'>✔</button>";
  var cancel = "<button onclick='buildList()'>⟲</button>";
  var del = "<button onclick='deleteKey(&quot;" + k.key + "&quot;)'>x</button>";
  row.innerHTML = type + ' ' + keyword + ' ' + '<td>' + submit + cancel + del + '</td>';
};

var submitEdit = function(id,key){
  var old = project.keywords[key];
  var type = document.getElementById(id+'-type');
  var input = document.getElementById(id+'-key');
  var newType = type.value;
  var newKey = input.value;
  if(newType == old.type && newKey == old.key){
    buildList();
  } else {
    socket.emit('edit-key',{old:key,type:newType,key:newKey});
  }
};

var deleteKey = function(key){
  socket.emit('delete-key',key);
};

var getLoc = function(loc){
  socket.emit('get-loc',loc);
};

var eventLoc = function(id,key){
  var str = String(id);
  var row = document.getElementById(str);
  var opts = '';
  for(i in project.keywords){
    var k = project.keywords[i];
    if(k.type == 'loc' && k.loc){
      opts += "<option value='" + k.key + "'>" + k.key + "</option>";
    }
  }
  row.innerHTML = "<td>📅</td><td>" + key + "</td><td><select id='" + id + "-loc'>" + opts + "</td><button onclick='submitLoc(" + id + ",&quot;" + key + "&quot;)'>✔</button></td>";
};

var submitLoc = function(id,key){
  var sel = document.getElementById(id+'-loc').value;
  var loc = project.keywords[sel].loc;
  socket.emit('event-loc',{key:key,loc:loc});
};

var getTime = function(id,key){
  var str = String(id);
  var row = document.getElementById(str);
  row.innerHTML = "<td>📅</td><td>" + key + "</td><td><input id='" + id + "-date' type='datetime-local'><button onclick='submitTime(" + id + ",&quot;" + key + "&quot;)'>✔</button></td>";
};

var submitTime = function(id,key){
  var dt = document.getElementById(id+'-date');
  var time = dt.value;
  socket.emit('event-time',{key:key,time:time});
}

// EXTRACT URL
var clickExtractUrl = function(){
  feedDiv.style.display = 'none';
  archiveDiv.style.display = 'none';
  keywordsDiv.style.display = 'none';
  urlExtractDiv.style.display = 'inline';
  areaStudyDiv.style.display = 'none';
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
  for(i in incoming.key){
    var inc = incoming.key[i];
    outKey.innerHTML += '<tr><td></td><td>' + inc + "</td><td><button onclick='deleteInc(&quot;" + inc + "&quot;)'>x</button></td></tr>";
  }
  for(i in incoming.ent){
    var inc = incoming.ent[i];
    outKey.innerHTML += '<tr><td>👤</td><td>' + inc + "</td><td><button onclick='deleteInc(&quot;" + inc + "&quot;)'>x</button></td></tr>";
  }
  for(i in incoming.org){
    var inc = incoming.org[i];
    outKey.innerHTML += '<tr><td>🏢</td><td>' + inc + "</td><td><button onclick='deleteInc(&quot;" + inc + "&quot;)'>x</button></td></tr>";
  }
  for(i in incoming.loc){
    var inc = incoming.loc[i];
    outKey.innerHTML += '<tr><td>🌐</td><td>' + inc + "</td><td><button onclick='deleteInc(&quot;" + inc + "&quot;)'>x</button></td></tr>";
  }
};

var deleteInc = function(key){
  for(i in incoming){
    var inc = incoming[i];
    for(n in inc){
      if(key == inc[n]){
        delete inc[n];
      }
    }
  }
  showOutput();
};

var submitKeys = function(){
  for(i in incoming.key){
    socket.emit('addKeyword', {key:incoming.key[i],type:null});
  }
  for(i in incoming.ent){
    socket.emit('addKeyword', {key:incoming.ent[i],type:'ent'});
  }
  for(i in incoming.org){
    socket.emit('addKeyword', {key:incoming.org[i],type:'org'});
  }
  for(i in incoming.loc){
    socket.emit('addKeyword', {key:incoming.loc[i],type:'loc'});
  }
  clearOutput();
};

var clearOutput = function(){
  incoming = {
    key: [],
    ent: [],
    org: [],
    loc: []
  }
  outputDiv.style.display = 'none';
  inputDiv.style.display = 'inline';
};

// AREA STUDY
var clickAreaStudy = function(){
  feedDiv.style.display = 'none';
  keywordsDiv.style.display = 'none';
  urlExtractDiv.style.display = 'none';
  areaStudyDiv.style.display = 'inline';
};

socket.on('granted', function(data){
  project = data;
  if(project.notifs.feed){
    intelFeed.className = 'notif';
  }
  popFeed();
  buildArchive();
  buildList();
  codeDiv.style.display = 'none';
  menu.style.display = 'inline';
  map.addSource('poi',poi);
  map.addLayer({
    'id': 'poi',
    'type': 'circle',
    'source': 'poi',
    'paint': {
    'circle-color': '#4264fb',
    'circle-radius': 6,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
    }
  });
  console.log(project);
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

socket.on('search-complete', function(){
  launchSearch.disabled = false;
  processingDiv.style.display = 'none';
  keywordsDiv.style.display = 'inline';
})
