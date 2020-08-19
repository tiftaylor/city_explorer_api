'use strict';

// =================== Packages ===================== //
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const { json } = require('express');
require('dotenv').config();


// =================== Global Variables ===================== //
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;


// ========================== Routes ============================ //
// ============= location api route ================ //
app.get('/location', (request, response) => {
  const queryFromInput = request.query.city;
  const dynamicURL = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${queryFromInput}&format=json`;

  superagent.get(dynamicURL)
    .then(resultData => {
      const resultArrayFromBody = resultData.body;
      const constructorLocation = new Location(resultArrayFromBody, queryFromInput);
      response.send(constructorLocation);
    })
    // .catch(handleError);
});

// ============= weather api route ================ //
app.get('/weather', weatherInfo);

function weatherInfo(request, response){
  const latData = request.query.latitude;
  const lonData = request.query.longitude;
  const weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${latData}&lon=${lonData}&key=${WEATHER_API_KEY}`

  superagent.get(weatherURL)
    .then(resultData => {
      const objectFromBody = resultData.body;
      response.send(objectFromBody.data.map(objInArray => new Weather(objInArray)));
    })
    // .catch(handleError);
};

// ============= trails api route ================ //
app.get('/trails', trailInfo);

function trailInfo(request, response){
  console.log('trailInfo');
  const latData = request.query.latitude;
  const lonData = request.query.longitude;
  const trailURL = `https://www.hikingproject.com/data/get-trails?lat=${latData}&lon=${lonData}&maxDistance=10&key=${TRAIL_API_KEY}`

  superagent.get(trailURL)
    .then(resultData => {
      const arrayFromBody = resultData.body.trails;
      console.log(arrayFromBody);
      response.send(arrayFromBody.map(objInArray => new Trail(objInArray)));
    })
    // .catch(handleError);
};


// =================== Misc. Functions ===================== //
function Location(jsonObject, query) {
  this.search_query = query;
  this.formatted_query = jsonObject[0].display_name;
  this.latitude = jsonObject[0].lat;
  this.longitude = jsonObject[0].lon;
}


function Weather(jsonObj){
  this.forecast = jsonObj.weather.description;
  this.time = jsonObj.valid_date;
}


function Trail(jsonObj){
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


// const handleError = (error) => response.status(500).send(error.message);


// =================== Start Server ===================== //
app.listen(PORT, () => console.log('Ay! You connected!'));