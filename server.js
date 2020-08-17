'use strict';

// =================== Packages ===================== //
const express = require('express');
const cors = require('cors');
require('dotenv').config();


// =================== Global Variables ===================== //
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());


// =================== Routes ===================== //
// app.get('localhost:3000', (request, response) => {

// })




// =================== Misc. Functions ===================== //






// =================== Start Server ===================== //
app.listen(PORT, () => console.log('Ay! You connected!'));