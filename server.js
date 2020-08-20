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
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// ========== Express Configs ============//
app.use(cors());
const client = new pg.Client(DATABASE_URL);
client.on('error', (error) => console.error(error));


// ========================== Routes ============================ //
// ============= location api route ================ //
app.get('/location', (request, response) => {
  const queryFromInput = request.query.city;
  
  client.query('SELECT search_query FROM locations')
    .then(resultFromSql => {
      const valuesOfArray = resultFromSql.rows.map(obj => obj.search_query);

      if (valuesOfArray.includes(queryFromInput)) {
        client.query(`SELECT * FROM locations WHERE search_query = '${queryFromInput}'`)
          .then (theCityData => {
            response.send(theCityData.rows[0]);
          })

      } else {
        const dynamicURL = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${queryFromInput}&format=json`;

        superagent.get(dynamicURL)
          .then(resultData => {
            const resultArrayFromBody = resultData.body;
            const insertString = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)';
            const valueArray = [queryFromInput, resultArrayFromBody[0].display_name, resultArrayFromBody[0].lat,resultArrayFromBody[0].lon];

            client.query(insertString, valueArray)
              .then( () => {
                
                client.query(`SELECT * FROM locations WHERE search_query = '${queryFromInput}'`)
                  .then (theCityData => {
                    response.send(theCityData.rows[0]);
                  })
              })
          })
      }
    })
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
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
    .catch(error => {
      console.log(error);
      response.status(500).send(error.message);
    });
};


// ============= trails api route ================ //
app.get('/trails', trailInfo);

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


// =================== Start Server ===================== //
client.connect()
  .then( () => {
    app.listen(PORT, () => console.log('Ay! You connected!'));
  });

;