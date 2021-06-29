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
  for(i in res){
    if(res[i].extra.confidence == 1){
      CODES[code].keywords[loc].loc = [res[i].longitude,res[i].latitude];
      return;
    }
  }
}
