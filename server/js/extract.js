var parser = require('horseman-article-parser');

extract = async function(parent, urls, max, depth=0){
  var res = {};
  for(i in urls){
    var url = urls[i].href;
    if(url == parent){
      continue;
    } else {
      var article = await parser.parseArticle({
        url: url,
        enabled: ['links', 'entities', 'keywords']
      });
      if(article.title == undefined){
        continue;
      } else if(depth < max){
        res[article.title.text] = {
          depth: depth,
          title: article.title.text,
          metadescription: article.meta.description.text,
          url: article.url,
          keyphrases: article.processed.keyphrases,
          keywords: article.processed.keywords,
          people: article.people,
          orgs: article.orgs,
          places: article.places,
          links: await extract(url, article.links, max, depth+1)
        }
      }
    }
  }
  return res;
};
