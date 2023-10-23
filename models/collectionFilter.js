

export default class CollectionFilter {

  constructor(objects, params = null, model) {
    this.objects = objects;
    this.params = params;
    this.model = model;
  }
  get() {
    /*  
    Questions :
    Si offset=2 et limit=4 et seulement 10 éléments 
    Si fields n'est pas parmi les fields du model
    /api/bookmark?sort=Name,desc&Name=*e*&Category=new&limit=5&offset=10

    */
    let fields;
    let sort;
    let offset;
    let limit;
    let desc = false;
    if (this.params == null) {
      return this.objects;
    }

    else if (Object.keys(this.params).length > 0) {
      if (this.params.fields != null && this.params.sort != null) {
        sort = this.params.sort;
        if (this.params.sort.includes("desc")) {
          desc = true;
        }
        delete this.params.sort;
      }
      if (this.params.fields != null) {
        fields = this.params.fields;
        delete this.params.fields;
      }
      if (this.params.limit == null && this.params.offset != null || this.params.limit != null && this.params.offset == null) {
        return [];
      }
      //set une limit et un offset sur la liste filtrée
      else if (this.params.limit != null && this.params.offset != null) {
        offset = parseInt(this.params.offset);
        limit = parseInt(this.params.limit);
        delete this.params.limit;
        delete this.params.offset;
      }
      for (let i = 0; i < Object.keys(this.params).length; i++) {
        let key = Object.keys(this.params)[i];
        if (this.model.isMember(key)) {
          this.objects = Filter(this.params, this.objects, key);
        }
        if (key == 'sort') {
          console.log(this.params[key]);
          let sortValue = this.params[key];
          let desc = false;
          if (this.params[key].includes("desc")) {
            desc = true;
            this.params[key] = this.params[key].replace(/,desc/g, "");
            sortValue = this.params[key];
          }
          if (this.model.isMember(this.params[key])) {
            if (this.params[key] == "Category") {
              this.objects.sort(function (a, b) {
                let x = a.Category.toLowerCase();
                let y = b.Category.toLowerCase();
                return innerCompare(x, y)
              })
              this.objects.reverse();
            }
            else if (desc) {
              this.objects.sort(function (a, b) {
                let x;
                let y;
                if ((typeof a[sortValue]) === 'string') {
                  let x = a[sortValue].toLowerCase();
                  let y = b[sortValue].toLowerCase();
                }
                else {
                  x = a[sortValue];
                  y = b[sortValue];
                }
                return innerCompare(x, y)
              })
              this.objects.reverse();
            }
            else {
              this.objects.sort(function (a, b) {
                let x;
                let y;
                if ((typeof a[sortValue]) === 'string') {
                  x = a[sortValue].toLowerCase();
                  y = b[sortValue].toLowerCase();
                }
                else {
                  x = a[sortValue];
                  y = b[sortValue];
                }
                return innerCompare(x, y)
              })
            }
          }
          else {
            return [];
          }
        }
      }
    }
    if (fields != null) {
      const keysToKeep = fields.split(',');
      keysToKeep.forEach(key => { if (!this.model.isMember(key)) { return [] } });
      let duplicatesIndexs = [];
      const reduce = array => array.map(o => {
        const newObj = {};
        keysToKeep.forEach(key => newObj[key] = o[key]);
        return newObj;
      });



      let listObjects = reduce(this.objects);
      sortObjects(listObjects, keysToKeep);

      for (let i = 0; i < listObjects.length; i++) {
        if (JSON.stringify(listObjects[i]) === JSON.stringify(listObjects[i + 1])) {
          duplicatesIndexs.push(i);
        }
      }
      deleteByIndex(listObjects, duplicatesIndexs);
      if (sort != null) {
        listObjects.sort(function (a, b) {
          let x;
          let y;
          if ((typeof a[sort]) === 'string') {
            x = a[sort].toLowerCase();
            y = b[sort].toLowerCase();
          }
          else {
            x = a[sort];
            y = b[sort];
          }
          return innerCompare(x, y)
        });
      }
      if (desc) {
        listObjects = listObjects.reverse();
      }
      if (limit != null && offset != null) {
        listObjects = listObjects.slice(offset * limit, (offset * limit) + limit);
      }
      return listObjects;
    }
    if (limit != null && offset != null) {
      this.objects = this.objects.slice(offset * limit, (offset * limit) + limit);
    }
    return this.objects;
  }
}
function Filter(params, objects, key) {
  if (params[key].startsWith('*') && params[key].endsWith('*')) {
    let string = params[key].slice(0, params[key].length - 1);
    string = string.slice(1);
    return objects.filter(item => item[key].includes(string))
  }
  else if (params[key].startsWith('*')) {
    let string = params[key].substring(1);
    return objects.filter(item => item[key].endsWith(string));
  }
  else if (params[key].endsWith('*')) {
    let string = params[key].substring(0, params[key].length - 1);
    return objects.filter(item => item[key].startsWith(string))
  }
  else {
    return objects.filter(item => item[key] == params[key])
  }
}
function valueMatch(value, searchValue) {
  try {
    let exp = '^' + searchValue.toLowerCase().replace(/\*/g, '.*') + '$';
    return new RegExp(exp).test(value.toString().toLowerCase());
  } catch (error) {
    console.log(error);
    return false;
  }
}
function compareNum(x, y) {
  if (x === y) return 0;
  else if (x < y) return -1;
  return 1;
}
function innerCompare(x, y) {
  if ((typeof x) === 'string')
    return x.localeCompare(y);
  else
    return compareNum(x, y);
}
const deleteByIndex = (array, indexToDelete) => {
  for (let i = indexToDelete.length - 1; i >= 0; i--) {
    array.splice(indexToDelete[i], 1);
  }
}
function sortObjects(listObjects, keysToKeep) {
  listObjects.sort(function (a, b) {
    let x;
    let y;

    for (let key of keysToKeep) {
      if (typeof a[key] === 'string') {
        x = a[key].toLowerCase();
        y = b[key].toLowerCase();
      } else {
        x = a[key];
        y = b[key];
      }
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
    }
    return 0;
  }
  );
}