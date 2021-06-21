/* Final Project
Author: Emily Addiego
Course: CS 493
Code adapted from course learning materials and previous assignments
Other sources:
https://medium.com/developer-rants/running-promises-in-a-loop-sequentially-one-by-one-bd803181b283
https://gomakethings.com/how-to-check-if-two-arrays-are-equal-with-vanilla-js/
https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array
*/


//modules required
const express = require('express');
const app = express();
const json2html = require('json-to-html');
const handlebars = require('express-handlebars').create({defaultLayout:'main'});
const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const axios = require('axios');


app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(bodyParser.json());

//entities
const USER = "User";
const ANIMAL = "Animal";
const ZOO = "Zoo";

const router = express.Router();
const login = express.Router();



function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}


/* Middleware checks validity of JWT (from assign 7) */
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://493-assign7.us.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://493-assign7.us.auth0.com/`,
    algorithms: ['RS256']
  });



/*Get token returns JWT (modified from assignment 7)*/
function get_token(name, pwd)
{
        const url = "https://493-assign7.us.auth0.com/oauth/token";
        const body = { grant_type: 'password',
       username: name,
       password: pwd,
       client_id: 'wxEGr9QwVEIFi99VtfAJ3mwBF9uTSzbo',
       client_secret: 'qgr0YgcXnSG3QzF1NTigndPWxqvo4CgScyXKPc2ywSWFZBoCJraExGlJx7Wsfa35' };
        return axios
    .post(url, body, {
      headers: {
        'content-type': 'application/json', 
      },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.error(`Failed to fetch auth tokens`);
      throw new Error(error.message);
    });
}




//removes animal from zoo's animal array
function remove_animal(arr, animal){
    
    for( var i = 0; i < arr.length; i++){ 
    
        if ( arr[i] === animal) { 
    
            arr.splice(i, 1); 
        }
      }

    return arr;

}

//checks if two arrays are equal (used to compare animal arrays)
 function sameArr(arr1, arr2) {

  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) return false;

  // Check if all items exist and are in the same order
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;

};




/* ------------- Begin  Model Functions ------------- */


/*------functions for users and user-sponsored animals--------*/
function get_users() {
    const q = datastore.createQuery(USER);
    return datastore.runQuery(q).then( (entities) => {
            return entities[0].map(fromDatastore);
        });
}

function post_u_animal(name, type, age, habitat, zoo, user){
    var key = datastore.key(ANIMAL);
    const new_animal = {"name": name, "type": type, "age": age, "habitat": habitat, "zoo": null, "user":user};
    return datastore.save({"key":key, "data":new_animal}).then(() => {return key});
}


function get_u_animals_paginated(req, user){
  var q = datastore.createQuery(ANIMAL).filter('user', '=', user).limit(5);
    const results = {};
  return datastore.runQuery(q).then( (entities) => {
            results.items = entities[0].map(fromDatastore);
            if(entities[1].moreResults !== Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/animal" + "?cursor=" + entities[1].endCursor;
            }
      return results;
    });
}


/*-----------------functions for animals--------------------*/


function post_animal(name, type, age, habitat, zoo, user){
    var key = datastore.key(ANIMAL);
    const new_animal = {"name": name, "type": type, "age": age, "habitat": habitat, "zoo": zoo, "user": user};
    return datastore.save({"key":key, "data":new_animal}).then(() => {return key});
}

function get_all_animals(){
    const q = datastore.createQuery(ANIMAL);
    return datastore.runQuery(q).then( (entities) => {
            return entities[0].map(fromDatastore);
        });
}

function get_animals_paginated(req){
  var q = datastore.createQuery(ANIMAL).limit(5);
    const results = {};
  return datastore.runQuery(q).then( (entities) => {
            results.items = entities[0].map(fromDatastore);
            if(entities[1].moreResults !== Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/animal" + "?cursor=" + entities[1].endCursor;
            }
      return results;
    });
}


function edit_animal(id, name, type, age, habitat, zoo, user){
    const key = datastore.key([ANIMAL, parseInt(id,10)]);
    const animal = {"name": name, "type": type, "age": age, "habitat": habitat, "zoo": zoo, "user": user};
    return datastore.save({"key":key, "data":animal}).then(() => {return key});
}

function delete_animal(id){
    const key = datastore.key([ANIMAL, parseInt(id,10)]);
    return datastore.delete(key);
}




/*-----------------functions for zoos---------------------*/

function post_zoo(name, city, state, animals){
    var key = datastore.key(ZOO);
    const new_zoo = {"name": name, "city": city, "state": state, "animals": animals};
    return datastore.save({"key":key, "data":new_zoo}).then(() => {return key});
}


function get_zoos_paginated(req){
  var q = datastore.createQuery(ZOO).limit(5);
    const results = {};
  return datastore.runQuery(q).then( (entities) => {
            results.items = entities[0].map(fromDatastore);
            if(entities[1].moreResults !== Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/zoo" + "?cursor=" + entities[1].endCursor;
            }
      return results;
    });
}


function get_zoos(){
    const q = datastore.createQuery(ZOO);
    return datastore.runQuery(q).then( (entities) => {
            return entities[0].map(fromDatastore);
        });
}


function edit_zoo(id, name, city, state, animals){
    const key = datastore.key([ZOO, parseInt(id,10)]);
    const zoo = {"name": name, "city": city, "state": state, "animals": animals};
    return datastore.save({"key":key, "data":zoo}).then(() => {return key});
}

function delete_zoo(id){
    const key = datastore.key([ZOO, parseInt(id,10)]);
    return datastore.delete(key);
}




/* ------------- End Model Functions ------------- */





/*---------------Controllers for Views-------------------*/
router.get('/', (req, res) => {
  res.render('home');
});



router.get('/login', async (req, res) => {
//get login information from query parameters
    let name = req.query.name;
    let pass = req.query.pwd;


    const data = await get_token(name, pass);
    let tk = data.id_token;
    let user;
    const users = get_users()
    .then( (users) => {
      for (let x =0; x < users.length; x++){
        if (users[x].email == name){
          user = users[x].auth0_id;
        }
      }
      res.render('token', {token: tk, name: user});
    });
});





/* ------------- Controllers for users and user-related entities ------------- */

router.get('/user', function (req, res) {
    const users = get_users()
    .then( (users) => {
      res.status(200).json(users);
    });
});



router.get('/user/animal', checkJwt, function (req, res) {
    const animals = get_u_animals_paginated(req, req.user.sub)
    .then( (animals) => {
      console.log(animals);
//array for animal data
      let data = [];
//next link
      let next = {};
//push animals into data array with self link
      for (let x =0; x < animals.items.length; x++){
                
                        let animal = {};
                        animal.id = animals.items[x].id;
                        animal.name = animals.items[x].name;
                        animal.type = animals.items[x].type;
                        animal.age = animals.items[x].age;
                        animal.habitat = animals.items[x].habitat;
                        animal.zoo = animals.items[x].zoo;
                        animal.user = animals.items[x].user;
                        animal.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal"  + '/' + animal.id;
                        data.push(animal);
                    
                }
      if (animals.next)
      {
        next.link = animals.next;
        data.push(next);
      }
       const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({"Error": "Not Acceptable"});
        } else if((accepts)){
            res.status(200).json(data);
        }
    });
});



router.get('/user/animal/:id', checkJwt, function(req, res){
    const animals = get_all_animals()
  .then( (animals) => {
//see if animal is found
        let found = false;
        let bad = true;
        let animal = {};
            for (let x =0; x < animals.length; x++){
                if (animals[x].id == req.params.id)
                    {
                        found = true;
                        if (animals[x].user == req.user.sub)
                        {
                          bad = false;
                          animal.id = animals[x].id;
                        animal.name = animals[x].name;
                        animal.type = animals[x].type;
                        animal.age = animals[x].age;
                        animal.habitat = animals[x].habitat;
                        animal.zoo = animals[x].zoo;
                        animal.user = req.user.sub;
                        animal.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal" + '/' + animal.id;
                        }
                        
                    }
                }
        const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({"Error": "Not Acceptable"});
        } else if((accepts) && found == true && bad == false){
            res.status(200).json(animal);
        } else if((accepts) && found == true && bad == true){
            res.status(403).json({"Error": "You do not have access to this animal"});
        } else if((accepts) && found == false)
        {res.status(404).send({"Error": "No animal with this id in the database"});  }
    });
});


router.post('/user/animal', checkJwt, function(req, res){
    if (!(req.body.name) || !(req.body.age) || !(req.body.type) || !(req.body.habitat)){
        res.status(400).json({"Error": "One or more required attributes is missing."})
    }
    post_u_animal(req.body.name, req.body.type, req.body.age, req.body.habitat, null, req.user.sub)
    .then( key => {
        let link = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal" + '/' + key.id;
        const resp = {"id": key.id, "name": req.body.name, "type": req.body.type, "age": req.body.age, "habitat": req.body.habitat, "zoo": null, "user": req.user.sub, "self": link}
        res.status(201).json(resp)
    } );
});



router.patch('/user/animal/:id', checkJwt, function(req, res){
        const animals = get_all_animals()
            .then( (animals) => {
            let found = false;
            let bad = true;
            let bad_zoo = false;
            let animal = {};
            for (let x =0; x < animals.length; x++){
//animal is found in db, make sure to fill in missing information
                if (animals[x].id == req.params.id)
                {
                    found = true;
                    if (req.body.name){
                        animal.name = req.body.name;
                    }
                    else {
                        animal.name = animals[x].name;
                    }
                    if (req.body.type){
                        animal.type = req.body.type;
                    }
                    else {
                        animal.type = animals[x].type;
                    }
                    if (req.body.age){
                        animal.age = req.body.age;
                    }
                    else {
                        animal.age = animals[x].age;
                    }
                    if (req.body.habitat){
                        animal.habitat = req.body.habitat;
                    }
                    else {
                        animal.habitat = animals[x].habitat;
                    }
//control for trying to add zoo with the wrong path
                    if (req.body.zoo){
                        if (req.body.zoo != animals[x].zoo){
                          bad_zoo = true;
                        }
                    }
//control for a user trying to edit another user's animal
                    if (animals[x].user == req.user.sub){
                      bad = false;
                    }
                }
                }
            if (found == false){
                return res.status(404).json({"Error": "no animal with this id exists or is associated with this user"});
            }
            else if (found == true && bad == true){
                return res.status(403).json({"Error": "You do not have access to this animal"});
            }
            else if (found == true && bad_zoo == true){
                return res.status(405).json({"Error": "Wrong method. You can't add animal to zoo this way."});
            }
//everything's fine, put it!
            else {
                edit_animal(req.params.id, animal.name, animal.type, animal.age, animal.habitat, animal.zoo, req.user.sub)
                .then( key => {
                let link = req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id;
                res.status(201).json({ "id": key.id, "name": animal.name, "type": animal.type, "age": animal.age, "habitat": animal.habitat, "zoo": animal.zoo, "user": req.user.sub, "self": link})

                } );
        }
    });
});


router.delete('/user/animal/:id', checkJwt, function(req, res){
    const zoos = get_zoos()
            .then( (zoos) => {
            let found = false;
            let bad = true;
            let zoo = {};
            for (let x =0; x < zoos.length; x++){
//animal in zoo
                if (zoos[x].animals.includes(req.params.id))
                {
                 
                  zoo.id = req.params.zoo_id;
                  zoo.city = zoos[x].city;
                  zoo.state = zoos[x].state;
                  zoo.animals = zoos[x].animals;
                  }
                }
                const animals = get_all_animals()
                .then( (animals) => {
//if id not in animals
                found = false;
                for (let x =0; x < animals.length; x++){
                    if (animals[x].id == req.params.id)
                        {
                            found = true;
                            if (animals[x].user == req.user.sub) {
                              bad = false;
                            }
                        }
                    }
                if (found == false)
                {
                    res.status(404).json({"Error": "No animal or zoo exists with this id"});
                }
                if (found == true && bad == true)
                {
                    res.status(403).json({"Error": "You do not have access to this animal"});
                }
//delete animal 
                else if (!(zoo.animals)){
                  delete_animal(req.params.id).then(res.status(204).end())
                }
//if animal is in zoo, delete from zoo
                else {
                    let new_arr = remove_animal(zoo.animals, req.params.id);
                    console.log(new_arr);
                    edit_zoo(zoo.id, zoo.name, zoo.city, zoo.state, new_arr).then( (keys) =>
                    {
                      delete_animal(req.params.id).then(res.status(204).end())
                    })
                    }
                });
                });
    });


/*----------------Controllers for animals  not associated with a user----------------*/
router.get('/animal', function (req, res) {
    const animals = get_animals_paginated(req)
    .then( (animals) => {
//array for animal data
      let data = [];
//next link
      let next = {};
//push animals into data array with self link
      for (let x =0; x < animals.items.length; x++){
                
                        let animal = {};
                        animal.id = animals.items[x].id;
                        animal.name = animals.items[x].name;
                        animal.type = animals.items[x].type;
                        animal.age = animals.items[x].age;
                        animal.habitat = animals.items[x].habitat;
                        animal.zoo = animals.items[x].zoo;
                        animal.user = animals.items[x].user;
                        animal.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal"  + '/' + animal.id;
                        data.push(animal);
                    
                }
      if (animals.next)
      {
        next.link = animals.next;
        data.push(next);
      }
        const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({"Error": "Not Acceptable"});
        } else if((accepts)){
            res.status(200).json(data);
        }
    });
});


router.get('/animal/:id', function(req, res){
    const animals = get_all_animals()
  .then( (animals) => {
//see if animal is in list of animals
        let found = false;
        let animal = {};
        let user = false;
            for (let x =0; x < animals.length; x++){
                if (animals[x].id == req.params.id)
                    {
                        found = true;
                        animal.id = animals[x].id;
                        animal.name = animals[x].name;
                        animal.type = animals[x].type;
                        animal.age = animals[x].age;
                        animal.habitat = animals[x].habitat;
                        animal.zoo = animals[x].zoo;
                        animal.user = animals[x].user;
                        animal.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal"  + '/' + animal.id;
                        if (animals[x].user != null){
                            user = true;
                        }
                    }
                    
                }
        const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({"Error": "Not Acceptable"});
        } else if((accepts) && found == true && user == false){
            res.status(200).json(animal);
            } else if((accepts) && found == true && user == true){
            res.status(403).json({"Error": "You must be logged in to access this animal"});
        }  else if((accepts) && found == false)
        {res.status(404).json({"Error": "No animal with this id in the database"});  }
    });
});


router.post('/animal', function(req, res){
    if (!(req.body.name) || !(req.body.age) || !(req.body.type) || !(req.body.habitat)){
        res.status(400).json({"Error": "One or more required attributes is missing."})
    }
    post_animal(req.body.name, req.body.type, req.body.age, req.body.habitat, null, null)
    .then( key => {
        let link = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal" + '/' + key.id;
        const resp = {"id": key.id, "name": req.body.name, "type": req.body.type, "age": req.body.age, "habitat": req.body.habitat, "zoo": null, "user": null, "self": link}
        res.status(201).json(resp)
    } );
});



router.patch('/animal/:id', function(req, res){
        const animals = get_all_animals()
            .then( (animals) => {
//catch any missing params if animal does exist but patch req was sent without all params
            let found = false;
            let bad_zoo = false;
            let animal = {};
            let user = false;
            for (let x =0; x < animals.length; x++){
//animal is found in db, make sure to fill in missing information
                if (animals[x].id == req.params.id)
                {
                    found = true;
                    if (req.body.name){
                        animal.name = req.body.name;
                    }
                    else {
                        animal.name = animals[x].name;
                    }
                    if (req.body.type){
                        animal.type = req.body.type;
                    }
                    else {
                        animal.type = animals[x].type;
                    }
                    if (req.body.age){
                        animal.age = req.body.age;
                    }
                    else {
                        animal.age = animals[x].age;
                    }
                    if (req.body.habitat){
                        animal.habitat = req.body.habitat;
                    }
                    else {
                        animal.habitat = animals[x].habitat;
                    }
//control for trying to edit zoo by this path
                    if (req.body.zoo){
                        if (req.body.zoo != animals[x].zoo){
                          bad_zoo = true;
                        }
                      }
//check if animal is associated with a user
                    if (animals[x].user != null)
                    {
                      user = true;
                    }
                }
                }
            if (found == false){
                return res.status(404).json({"Error": "no animal with this id exists"});
            }
//forbidden if assocaited with user
            else if (found == true && user == true){
                return res.status(403).json({"Error": "you must be logged in to edit this animal"});
            }
            else if (found == true && bad_zoo == true){
                return res.status(405).json({"Error": "Wrong method. You can't add an animal to a zoo this way"});
            }
//everything's fine, put it!
            else {
                edit_animal(req.params.id, animal.name, animal.type, animal.age, animal.habitat, animal.zoo, null)
                .then( key => {
                let link = req.protocol + "://" + req.get('host') + req.baseUrl + "/animal" + '/' + key.id;
                res.status(201).json({ "id": key.id, "name": animal.name, "type": animal.type, "age": animal.age, "habitat": animal.habitat, "zoo": animal.zoo, "user": null, "self": link})

                } );
        }
    });
});


router.delete('/animal/:id', function(req, res){
    const zoos = get_zoos()
            .then( (zoos) => {
//if id not in zoos list
            let found = false;
            let user = false;
            let zoo = {};
            for (let x =0; x < zoos.length; x++){
//animal already in zoo
                if (zoos[x].animals.includes(req.params.id))
                {
                 
                  zoo.id = zoos[x].id;
                  zoo.name = zoos[x].name;
                  zoo.city = zoos[x].city;
                  zoo.state = zoos[x].state;
                  zoo.animals = zoos[x].animals;
                  }
                }
                const animals = get_all_animals()
                .then( (animals) => {
//if id not in animals
                for (let x =0; x < animals.length; x++){
                    if (animals[x].id == req.params.id)
                        {
                            found = true;
                            if (animals[x].user){
                                user = true;
                              }
                        }
                    

                    }
                if (found == false)
                {
                    res.status(404).json({"Error": "No animal exists with this id"});
                }
                else if (user == true){
                return res.status(403).json({"Error": "you must be logged in to delete this animal"});
            }
//delete animal from zoo
                else if (!(zoo.animals)){
                  delete_animal(req.params.id).then(res.status(204).end())
                }
                else {
                    let new_arr = remove_animal(zoo.animals, req.params.id);
                    console.log(new_arr);
                    edit_zoo(zoo.id, zoo.name, zoo.city, zoo.state, new_arr).then( (keys) =>
                    {
                      delete_animal(req.params.id).then(res.status(204).end())
                    })
                    }
                });
                });
    });



/*------------------Controllers for zoos------------------------*/


router.get('/zoo', function (req, res) {
    const zoos = get_zoos_paginated(req)
    .then( (zoos) => {
//array for animal data
      let data = [];
//next link
      let next = {};
//push animals into data array with self link
      for (let x =0; x < zoos.items.length; x++){
                
                        let zoo = {};
                        zoo.id = zoos.items[x].id;
                        zoo.name = zoos.items[x].name;
                        zoo.city = zoos.items[x].city;
                        zoo.state = zoos.items[x].state;
                        zoo.animals = zoos.items[x].animals;
                        zoo.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/zoo"  + '/' + zoo.id;
                        data.push(zoo);
                    
                }
      if (zoos.next)
      {
        next.link = zoos.next;
        data.push(next);
      }
       const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({"Error": "Not Acceptable"});
        } else if((accepts)){
            res.status(200).json(data);
        }
    });
});



router.post('/zoo', function(req, res){
    if (!(req.body.name) || !(req.body.city) || !(req.body.state)){
        res.status(400).json({"Error": "One or more required attributes is missing."})
    }
    post_zoo(req.body.name, req.body.city, req.body.state, [])
    .then( key => {
        let link = req.protocol + "://" + req.get('host') + req.baseUrl + "/zoo" + '/' + key.id;
        const resp = {"id": key.id, "name": req.body.name, "city": req.body.city, "state": req.body.state, "animals": [], "self": link}
        res.status(201).json(resp)
    } );
});


router.get('/zoo/:id', function(req, res){
    const zoos = get_zoos()
  .then( (zoos) => {
        let found = false;
        let zoo= {};
            for (let x =0; x < zoos.length; x++){
                if (zoos[x].id == req.params.id)
                    {
                        found = true;
                        zoo.id = zoos[x].id;
                        zoo.name = zoos[x].name;
                        zoo.city = zoos[x].city;
                        zoo.state = zoos[x].state;
                        zoo.animals = zoos[x].animals;
                        zoo.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/zoo" + '/' + zoo.id;
                    }
                }
        const accepts = req.accepts('application/json');
        if(!accepts){
            res.status(406).json({"Error": "Not Acceptable"});
        }
         else if(found == true){
            res.status(200).json(zoo);
        }  else if(found == false)
        {res.status(404).send({"Error": "No zoo with this id in the database"});  }
    });
});



router.patch('/zoo/:id', function(req, res){
        const zoos = get_zoos()
            .then( (zoos) => {
            let found = false;
            let bad = true;
            let zoo = {};
            for (let x =0; x < zoos.length; x++){
//zoo is found in db, make sure to fill in missing information
                if (zoos[x].id == req.params.id)
                {
                    found = true;
                    if (req.body.name){
                        zoo.name = req.body.name;
                    }
                    else {
                        zoo.name = zoos[x].name;
                    }
                    if (req.body.city){
                        zoo.city = req.body.city;
                    }
                    else {
                        zoo.city = zoos[x].city;
                    }
                    if (req.body.state){
                        zoo.state = req.body.state;
                    }
                    else {
                        zoo.state = zoos[x].state;
                    }
//if no animals array provided or both arrays are the same
                    if ( !(req.body.animals) || (sameArr(req.body.animals, zoos[x].animals))){
                      bad = false;
                      zoo.animals = zoos[x].animals;
                    }
                }
                }
            if (found == false){
                return res.status(404).json({"Error": "no zoo with this id exists"});
            }
//someone tried to edit animals array through this path instead of proper path
            else if (found == true && bad == true) {
                  return res.status(405).json({"Error": "Wrong method. Cannot add/delete animals with this route"});
            }
//everything's fine, put it!
            else {
                edit_zoo(req.params.id, zoo.name, zoo.city, zoo.state, zoo.animals)
                .then( key => {
                let link = req.protocol + "://" + req.get('host') + req.baseUrl + "/zoo" + '/' + key.id;
                res.status(201).json({ "id": key.id, "name": zoo.name, "city": zoo.city, "state": zoo.state, "animals": zoo.animals, "self": link})

                } );
        }
    });
});





router.delete('/zoo/:id', function(req, res){
    const zoos = get_zoos()
            .then( (zoos) => {
//if id not in animals list
            let found = false;
            let zoo_animals = [];
            let animal_list = [];
            for (let x =0; x < zoos.length; x++){
                if (zoos[x].id == req.params.id)
                    {
                        found = true;
                        zoo_animals = zoos[x].animals;
                    }
                }
                const animals = get_all_animals()
                .then( (animals) => {
//get information on all animals that are in zoo
                for (let x =0; x < animals.length; x++){
                    if (zoo_animals.includes(animals[x].id))
                        {
                          animal_list.push(animals[x]);
                    }

                    }
            if (found == false)
            {
                res.status(404).json({"Error": "no zoo with this id exists"});
            }
//use promise all to loop through animals array
            else {
                Promise.all(
                animal_list.map(a => edit_animal(a.id, a.name, a.type, a.habitat, null, a.user))
                )       
                .then(() => {
                delete_zoo(req.params.id).then(res.status(204).end())
        })
        }
    });
              });
});



/*---------------Controller functions for zoo-animal relationship-----------*/

router.put('/zoo/:zoo_id/:animal_id', function(req, res){
    const zoos = get_zoos()
            .then( (zoos) => {
//if id not in zoos list
            let found = false;
            let bad = false;
            let zoo = {};
            let animal = {};
            for (let x =0; x < zoos.length; x++){
//animal already in zoo
                if (zoos[x].animals.includes(req.params.animal_id))
                {
                 bad = true;
                  }
                if (zoos[x].id == req.params.zoo_id)
                {
                  found = true;
                  zoo.id = zoos[x].id;
                  zoo.name = zoos[x].name;
                  zoo.city = zoos[x].city;
                  zoo.state = zoos[x].state;
                  zoo.animals = zoos[x].animals;
                  }
                }
                const animals = get_all_animals()
                .then( (animals) => {
//if id not in animals
                found = false;
                for (let x =0; x < animals.length; x++){
                    if (animals[x].id == req.params.animal_id)
                        {
                      found = true;
                      animal.name = animals[x].name;
                      animal.type = animals[x].type;
                      animal.age = animals[x].age;
                      animal.habitat = animals[x].habitat;
                      animal.user = animals[x].user;
                    }

                    }
                if (found == false)
                {
                    res.status(404).json({"Error": "No animal and/or zoo exists with this id"});
                }
                else if (bad == true){
                return res.status(403).json({"Error": "This animal is already in a zoo"});
            }
//add animal to zoo, then add zoo to animal
                else {
                    zoo.animals.push(req.params.animal_id);
                    edit_zoo(zoo.id, zoo.name, zoo.city, zoo.state, zoo.animals).then( (keys) =>
                    {
                      edit_animal(req.params.animal_id, animal.name, animal.type, animal.age, animal.habitat, req.params.zoo_id, animal.user).then(res.status(201).end())
                    })
                    }
                });
                });
    });



router.delete('/zoo/:zoo_id/:animal_id', function(req, res){
    const zoos = get_zoos()
            .then( (zoos) => {
//if id not in zoos list
            let found = false;
            let bad = false;
            let zoo = {};
            let animal = {};
            for (let x =0; x < zoos.length; x++){
//animal already in zoo
                if (zoos[x].animals.includes(req.params.animal_id) && zoos[x].id != req.params.zoo_id)
                {
                 bad = true;
                  }
                if (zoos[x].id == req.params.zoo_id)
                {
                  found = true;
                  zoo.id = zoos[x].id;
                  zoo.name = zoos[x].name;
                  zoo.city = zoos[x].city;
                  zoo.state = zoos[x].state;
                  zoo.animals = zoos[x].animals;
                  }
                }
                const animals = get_all_animals()
                .then( (animals) => {
//if id not in animals
                found = false;
                for (let x =0; x < animals.length; x++){
                    if (animals[x].id == req.params.animal_id)
                        {
                      found = true;
                      animal.name = animals[x].name;
                      animal.type = animals[x].type;
                      animal.age = animals[x].age;
                      animal.habitat = animals[x].habitat;
                      animal.user = animals[x].user;
                    }

                    }
                if (found == false)
                {
                    res.status(404).json({"Error": "No animal and/or zoo exists with this id"});
                }
                else if (bad == true){
                return res.status(403).json({"Error": "This animal is in another zoo"});
            }
//remove animal from zoo, then remove zoo from animal
                else {
                    new_arr = remove_animal(zoo.animals, req.params.animal_id)
                    edit_zoo(zoo.id, zoo.name, zoo.city, zoo.state, new_arr).then( (keys) =>
                    {
                      edit_animal(req.params.animal_id, animal.name, animal.type, animal.age, animal.habitat, null, animal.user).then(res.status(204).end())
                    })
                    }
                });
                });
    });





/* ------------- End Controller Functions ------------- */

app.use('/', router);



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

