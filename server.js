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

  response.send(constructorLocation);
})


// =================== Misc. Functions ===================== //

function Location(jsonObject) {
  // this.search_query = "seattle";
  this.formatted_query = jsonObject[0].display_name;
  this.latitude = jsonObject[0].lat;
  this.longitude = jsonObject[0].lon;
}



// =================== Start Server ===================== //
app.listen(PORT, () => console.log('Ay! You connected!'));