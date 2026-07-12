import axios from 'axios';
import { sampleRouteCoordinates } from '../utils/sampler.js';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

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

        const response = await axios.get(OPEN_METEO_BASE_URL, {
          params: {
            latitude: lat,
            longitude: lng,
            hourly: 'temperature_2m,wind_speed_10m,weather_code',
            wind_speed_unit: 'kmh', 
            forecast_days: 1
          },
          timeout: 5000 
        });
        
        const rawData = response.data;
        
        const temp = rawData.hourly?.temperature_2m?.[0] ?? 'N/A';
        const windSpeed = rawData.hourly?.wind_speed_10m?.[0] ?? 0;
        const weatherCode = rawData.hourly?.weather_code?.[0] ?? 0;

        let conditionText = 'Clear';
        if (weatherCode === 3) {
          conditionText = 'Overcast';
        } else if (weatherCode === 1 || weatherCode === 2) {
          conditionText = 'Partly Cloudy';
        } else if ((weatherCode >= 51 && weatherCode <= 55) || (weatherCode >= 61 && weatherCode <= 65)) {
          conditionText = 'Light Rain';
        } else if ((weatherCode >= 66 && weatherCode <= 67) || (weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 80 && weatherCode <= 86)) {
          conditionText = 'Heavy Rain';
        }

        const normalizedWeather = {
          current: {
            temp: temp,
            wind_kph: windSpeed,
            condition: {
              text: conditionText
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