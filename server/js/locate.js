const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'opencage',
  // Optional depending on the providers
  apiKey: '491ba9f53725456eb6e81341918f7eb2', // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

locate = async function(code,loc){
  const res = await geocoder.geocode(loc);
  console.log(res);
  var conf = 10;
  var best = null;
  for(i in res){
    if(res[i].extra.confidence < conf){
      conf = res[i].extra.confidence;
      best = res[i];
    }
  }
  CODES[code].keywords[loc].loc = [best.longitude,best.latitude];
  return;
}
