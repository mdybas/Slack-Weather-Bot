const SlackBot = require('slackbots');
const fetch = require('isomorphic-fetch');
var config = require("./config.js");

var openweathermap_api_key = config.OPENWEATHERMAP_API_KEY;
var slack_token = config.SLACK_TOKEN;
var botID = '';

const bot = new SlackBot({
  token: slack_token,
  name: 'weatherbot'
});

// Start Handler
bot.on('start', () => {
  bot.postMessageToChannel('general', 
  'Type in the city to find out the weather',
  );
  botID = bot.self.id;
});

// Error Handler
bot.on('error', (err) => console.log(err));

// Message Handler
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
  handleMessage(str.replace(/\s*\<.*?\>\s*/g, ''));
});

// Responds to Data
function handleMessage(message){
  var url = "https://api.openweathermap.org/data/2.5/weather?q=" + message + "&appid=" + openweathermap_api_key + "&units=imperial";
  console.log(url);
  fetch(url).then((response) => {
    if (response.ok) {
      return response.json();
    } 
    else {
      throw new Error('Something went wrong');
    }
  })
  .then((responseJson) => {
    bot.postMessageToChannel(
      'general',
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
    bot.postMessageToChannel(
      'general',
      'Could not find the weather at the city entered. Please try another name of a city.'
    );
  });
} 

