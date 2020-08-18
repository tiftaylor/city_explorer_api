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


// =================== Routes ===================== //
app.get('/location', (request, response) => {
  const queryFromInput = request.query.city;
  const dynamicURL = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${queryFromInput}&format=json`;

  superagent.get(dynamicURL)
    .then(resultData => {
      const resultArrayFromBody = resultData.body;
      const constructorLocation = new Location(resultArrayFromBody, queryFromInput);
      response.send(constructorLocation);
    })
    .catch(error => {
      response.status(500).send(error.message);
    });

});


app.get('/weather', weatherInfo);

function weatherInfo(request, response){
  const latData = request.query.latitude;
  const lonData = request.query.longitude;
  const weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${latData}&lon=${latData}&key=${WEATHER_API_KEY}`

  superagent.get(weatherURL)
    .then(resultData => {
      const objectFromBody = resultData.body;
      response.send(objectFromBody.data.map(objInArray => new Weather(objInArray)));
    });
}


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

// =================== Start Server ===================== //
app.listen(PORT, () => console.log('Ay! You connected!'));