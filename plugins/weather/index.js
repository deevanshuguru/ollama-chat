// Weather Plugin for Local AI Labs
// Provides weather information using wttr.in API

let api;

async function initialize(pluginAPI) {
  api = pluginAPI;
  api.log('Weather plugin initialized');

  // Register tools
  api.registerTool('getWeather', getWeather);
  api.registerTool('getForecast', getForecast);

  // Register commands
  api.registerCommand('/weather', handleWeatherCommand);
}

async function getWeather(params) {
  const { location } = params;

  if (!location) {
    throw new Error('Location is required');
  }

  try {
    const response = await api.fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    const data = await response.json();

    const current = data.current_condition[0];
    const area = data.nearest_area[0];

    return {
      location: `${area.areaName[0].value}, ${area.country[0].value}`,
      temperature: `${current.temp_C}°C (${current.temp_F}°F)`,
      feels_like: `${current.FeelsLikeC}°C (${current.FeelsLikeF}°F)`,
      condition: current.weatherDesc[0].value,
      humidity: `${current.humidity}%`,
      wind: `${current.windspeedKmph} km/h ${current.winddir16Point}`,
      precipitation: `${current.precipMM} mm`,
      uv_index: current.uvIndex,
      visibility: `${current.visibility} km`
    };
  } catch (error) {
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
}

async function getForecast(params) {
  const { location, days = 3 } = params;

  if (!location) {
    throw new Error('Location is required');
  }

  try {
    const response = await api.fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    const data = await response.json();

    const forecast = data.weather.slice(0, days).map(day => ({
      date: day.date,
      max_temp: `${day.maxtempC}°C (${day.maxtempF}°F)`,
      min_temp: `${day.mintempC}°C (${day.mintempF}°F)`,
      avg_temp: `${day.avgtempC}°C (${day.avgtempF}°F)`,
      condition: day.hourly[4].weatherDesc[0].value,
      sunrise: day.astronomy[0].sunrise,
      sunset: day.astronomy[0].sunset,
      uv_index: day.uvIndex,
      rain_chance: `${day.hourly[4].chanceofrain}%`
    }));

    return {
      location: `${data.nearest_area[0].areaName[0].value}, ${data.nearest_area[0].country[0].value}`,
      forecast
    };
  } catch (error) {
    throw new Error(`Failed to fetch forecast: ${error.message}`);
  }
}

async function handleWeatherCommand(args) {
  const location = args || 'auto';

  try {
    const weather = await getWeather({ location });

    return {
      type: 'weather',
      data: weather,
      formatted: `
🌡️ Weather in ${weather.location}

Temperature: ${weather.temperature}
Feels like: ${weather.feels_like}
Condition: ${weather.condition}
Humidity: ${weather.humidity}
Wind: ${weather.wind}
UV Index: ${weather.uv_index}
Visibility: ${weather.visibility}
      `.trim()
    };
  } catch (error) {
    return {
      type: 'error',
      message: error.message
    };
  }
}

function cleanup() {
  api.log('Weather plugin cleaned up');
}

// Export plugin functions
module.exports = {
  initialize,
  cleanup
};
