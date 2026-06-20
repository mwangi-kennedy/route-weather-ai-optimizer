import axios from 'axios';
import { sampleRouteCoordinates } from '../utils/sampler.js';

const WEATHER_AI_BASE_URL = 'https://api.weather-ai.co';
const API_KEY = process.env.WEATHER_AI_API_KEY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function handleRouteWeather(req, res) {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: 'Invalid or missing route coordinates.' });
    }

    const sampledWaypoints = sampleRouteCoordinates(coordinates, 8);

    const weatherPromises = sampledWaypoints.map(async ([lng, lat], index) => {
      try {
        await sleep(index * 80);

        
        const response = await axios.get(`${WEATHER_AI_BASE_URL}/v1/hourly`, {
          params: { lat, lon: lng },
          headers: { Authorization: `Bearer ${"wai_85bac0.88c7c8d586c163675dbc0f80c843d812600db14ce8653207"}` }
        });
        
        const rawData = response.data;
        
        
        const currentHourData = rawData.hourly && rawData.hourly.length > 0 ? rawData.hourly[0] : null;

        const normalizedWeather = {
          current: {
            temp: currentHourData ? currentHourData.temperature : 'N/A',
            wind_kph: currentHourData ? currentHourData.wind_speed : 0,
            condition: {
              text: currentHourData?.icon?.includes('overcast') ? 'Overcast' :
                    currentHourData?.icon?.includes('cloudy') ? 'Partly Cloudy' :
                    currentHourData?.icon?.includes('drizzle') ? 'Light Rain' : 
                    currentHourData?.icon?.includes('rain') ? 'Light Rain' : 'Clear'
            }
          }
        };

        return {
          coordinates: [lng, lat],
          weather: normalizedWeather
        };

      } catch (error) {
        console.error(`Waypoint #${index + 1} Fetch Error:`, error.response?.status || error.message);
        return {
          coordinates: [lng, lat],
          error: true
        };
      }
    });

    const routeWeatherData = await Promise.all(weatherPromises);
    return res.status(200).json({ data: routeWeatherData });

  } catch (globalError) {
    console.error('Global Route Weather Safety Exception:', globalError.message);
    return res.status(500).json({ error: 'Internal server safety error occurred.' });
  }
}