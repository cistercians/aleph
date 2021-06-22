combine = function(code){
  console.log('Combining...');
  var keys = CODES[code].keywords;
  var pairs = CODES[code].pairs;
  for(x in keys){
    for(y in keys){
      if(keys[x].key == keys[y].key){
        continue;
      } else {
        var arr = [keys[x].key,keys[y].key];
        var sorted = arr.sort();
        var duplicate = false;
        for(i in pairs){
          if(sorted.toString() == pairs[i].toString()){
            duplicate = true;
          }
        }
        if(!duplicate){
          CODES[code].pairs.push(sorted);
        }
      }
    }
  }
  console.log('Combining complete.');
}
