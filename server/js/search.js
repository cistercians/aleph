const serp = require("serp");

search = async function(code){
  combine(code);
  var out = [];
  for(i in CODES[code].pairs){
    var pair = CODES[code].pairs[i];
    var q = pair[0] + ' ' + pair[1];
    console.log('SEARCHING: ' + pair[0] + ' + ' + pair[1]);
    const links = await serp.search({qs:{q:q,filters:0,pws:0},num:100});
    if(links){
      for(n in links){
        var u = links[n].url
        var end = u.indexOf('&ved=');
        var url = u.slice(30,end);
        console.log(url);
        var link = {
          title:links[n].title,
          url:url,
          pair:pair
        }
        out.push(link);
        console.log(links[n]);
      }
    }
  }
  for(x in out){
    var duplicate = false;
    for(y in CODES[code].feed){
      var z = CODES[code].feed[y].url;
      if(out[x].url == z){
        duplicate = true;
      }
    }
    if(!duplicate){
      CODES[code].feed[out[x].url] = out[x];
      CODES[code].notifs.feed = true;
      console.log(out[x].url + ' ADDED');
    }
  }
  console.log('Search complete.');
}
