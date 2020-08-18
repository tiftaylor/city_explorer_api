'use strict';

// =================== Packages ===================== //
const express = require('express');
const cors = require('cors');
const { json } = require('express');
require('dotenv').config();


// =================== Global Variables ===================== //
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());


// =================== Routes ===================== //
app.get('/location', (request, response) => {
  const jsonObject = require('./data/location.json');
  const constructorLocation = new Location(jsonObject);

  // handle wrong city error
  if(request.query.city !== 'lynwood'){
    return response.status(500).send('You can only search for lynwood (with a lowercase l');
  };

  response.send(constructorLocation);
})


app.get('/weather', weatherInfo);

function weatherInfo(request, response){
  const jsonObj = require('./data/weather.json');
  const dataArray = jsonObj.data;
  const newArray = [];

  dataArray.forEach(objInArray => {
    const newDay = new Weather(objInArray);
    newArray.push(newDay);
  });

  response.send(newArray);
}


// =================== Misc. Functions ===================== //

function Location(jsonObject) {
  // this.search_query = "seattle";
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