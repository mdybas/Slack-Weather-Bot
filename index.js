const SlackBot = require('slackbots');
const fetch = require('isomorphic-fetch');
var config = require("./config.js");
const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');

// Start app
const app = express();
app.use(express.static(__dirname + '/dist/'));
app.listen(process.env.PORT || 8080);

var http = require("http");
setInterval(function() {
    http.get("http://stormy-crag-2nom2612.herokuapp.com/");
    console.log("wake up");
}, 300000);


// Get api key and token from config file.
var openweathermap_api_key = config.OPENWEATHERMAP_API_KEY;
var slack_token = config.SLACK_TOKEN;
var botID = '';

//Creates a new Slackbot
const bot = new SlackBot({
  token: slack_token,
  name: 'weatherbot'
});

// Start Handler. Bot posts instructions on how to call the bot on the general channel.
bot.on('start', () => {
  bot.postMessage('general', 
  'Type \'@Weather Bot\' and the name of the city to find the current weather conditions at the city entered.',
  );
  botID = bot.self.id;
});

// Error Handler
bot.on('error', (err) => console.log(err));

// Message Handler. Bot only responds if the message is sent from the user and if the user
// types in '@Weather Bot'.
bot.on('message', data => {
  if(data.type != 'message'){
    return;
  }
  if(data.subtype == 'bot_message'){
    return;
  }
  if(!data.text.includes(botID)){
    return;
  }
  var str = data.text;
  var channel = data.channel;
  if(data.text.includes(' help')){
    runHelp(channel);
    return;
  }
  handleMessage(str.replace(/\s*\<.*?\>\s*/g, ''), channel);
});

// Request to openweathermap.org to get data on current condition,
// temperature, pressure, humidty, maximum temperature and minimum temperature. 
// Posts information to the slack channel the message was sent from.
function handleMessage(message, channel){
  var url = 'https://api.openweathermap.org/data/2.5/weather?q=' + message + '&appid=' + openweathermap_api_key + '&units=imperial';
  fetch(url).then((response) => {
    if (response.ok) {
      return response.json();
    } 
    else {
      throw new Error('Something went wrong');
    }
  })
  .then((responseJson) => {
    bot.postMessage(
      channel,
      'Here are the weather conditions in ' + message  + ':\n' +
      'The current condition is: ' + responseJson.weather[0].description + '\n' +
      'The current temperature is: ' + responseJson.main.temp + '°F\n' +
      'The current pressure is: ' + responseJson.main.pressure + ' hPa\n' +
      'The current humidity is: ' + responseJson.main.humidity + '%\n' +
      'The minimum temperature today is: ' + responseJson.main.temp_min + '°F\n' +
      'The maximum temperature today is: ' + responseJson.main.temp_max + '°F'
    );
  })
  .catch((error) => {
    console.log(error)
    bot.postMessage(
      channel,
      'Could not find the weather at the city entered. Please try another name of a city.'
    );
  });
} 

//Help function
function runHelp(channel){
  bot.postMessage(
    channel,
    'Type \'@Weather Bot\' and the name of the city to find the current weather conditions at the city entered.'
  );
}



