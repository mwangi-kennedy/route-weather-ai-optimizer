import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleRouteWeather } from './api/weather-route.js';

const app = express();


app.use(cors());


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.post('/api/weather-route', handleRouteWeather);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
});