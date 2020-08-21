'use strict';

// =================== Packages ===================== //
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const { json } = require('express');
require('dotenv').config();


// =================== Global Variables ===================== //
const PORT = process.env.PORT || 3001;
const app = express();
const DATABASE_URL = process.env.DATABASE_URL;

const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;


// ================= Express Configs ====================//
app.use(cors());
const client = new pg.Client(DATABASE_URL);
client.on('error', (error) => console.error(error));


// ===================== Routes ======================= //
app.get('/location', getLocation);
app.get('/weather', weatherInfo);
app.get('/trails', trailInfo);
app.get('/movies', moviesInfo);
app.get('/yelp', yelpInfo);


// ========================== Route Handlers ============================ //
function getLocation (request, response) {
  const queryFromInput = request.query.city;

  client.query(`SELECT * FROM locations WHERE search_query = '${queryFromInput}'`)
    .then (theCityData => {

      if(theCityData.rowCount === 1){
        console.log('Retrieved result from db');
        response.send(theCityData.rows[0]);
      } else {
        const dynamicURL = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${queryFromInput}&format=json`;

        superagent.get(dynamicURL)
          .then(resultData => {
            const resultArrayFromBody = resultData.body;
            const insertString = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)';
            const valueArray = [queryFromInput, resultArrayFromBody[0].display_name, resultArrayFromBody[0].lat,resultArrayFromBody[0].lon];

            client.query(insertString, valueArray)
              .then( () => {
                console.log('Added location to db');
                response.send(new Location(resultArrayFromBody, queryFromInput));
              });
          });
      }
    })
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
};


function weatherInfo(request, response){
  const latData = request.query.latitude;
  const lonData = request.query.longitude;
  const weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${latData}&lon=${lonData}&key=${WEATHER_API_KEY}`

  superagent.get(weatherURL)
    .then(resultData => {
      const objectFromBody = resultData.body;
      response.send(objectFromBody.data.map(objInArray => new Weather(objInArray)));
    })
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
};


function trailInfo(request, response){
  const latData = request.query.latitude;
  const lonData = request.query.longitude;
  const trailURL = `https://www.hikingproject.com/data/get-trails?lat=${latData}&lon=${lonData}&maxDistance=10&key=${TRAIL_API_KEY}`

  superagent.get(trailURL)
    .then(resultData => {
      const arrayFromBody = resultData.body.trails;
      response.send(arrayFromBody.map(objInArray => new Trail(objInArray)));
    })
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
};


function moviesInfo(request, response){
  const query = request.query.search_query;
  const movieURL = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${query}&page=1&include_adult=false`

  superagent.get(movieURL)
    .then(resultData => {
      const resultArray = resultData.body.results;
      response.send(resultArray.map(objInArray => new Movie(objInArray)));
    })
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
};


function yelpInfo(request, response){
  const latData = request.query.latitude;
  const lonData = request.query.longitude;
  const page = parseInt(request.query.page, 10) - 1;
  const yelpURL = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${latData}&longitude=${lonData}&limit=5&offset=${page * 5}`

  superagent.get(yelpURL)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)
    .then(resultData => {
      const resultArray = resultData.body.businesses
      response.send(resultArray.map(objInArray => new Business(objInArray)));
    })
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
};

// =================== Misc. Functions ===================== //
function Location(jsonObject, query) {
  this.search_query = query;
  this.formatted_query = jsonObject[0].display_name;
  this.latitude = jsonObject[0].lat;
  this.longitude = jsonObject[0].lon;
}


function Weather(jsonObj) {
  this.forecast = jsonObj.weather.description;
  this.time = jsonObj.valid_date;
}


function Trail(jsonObj) {
  this.name = jsonObj.name;
  this.location = jsonObj.location;
  this.length = jsonObj.length;
  this.stars = jsonObj.stars;
  this.star_votes = jsonObj.starVotes;
  this.summary = jsonObj.summary;
  this.trail_url = jsonObj.url;
  this.conditions = jsonObj.conditionDetails;
  this.condition_date = jsonObj.conditionDate.split(' ')[0];
  this.condition_time = jsonObj.conditionDate.split(' ')[1];
}


function Movie(obj) {
  this.title = obj.original_title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = obj.poster_path;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}


function Business(obj) {
  this.name = obj.name; 
  this.image_url = obj.image_url;  
  this.price = obj.price; 
  this.rating = obj.rating; 
  this.url = obj.url;  
}


// =================== Start Server ===================== //
client.connect()
  .then( () => {
    app.listen(PORT, () => console.log('Ay! You connected!'));
  });
