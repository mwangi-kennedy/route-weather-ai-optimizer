import { useState } from 'react';

export function useRouteWeather() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [weatherWaypoints, setWeatherWaypoints] = useState([]);
  const [distance, setDistance] = useState(null); // Step 1: Add state track for distance

  const calculateRouteAndWeather = async (startCoords, endCoords) => {
    setLoading(true);
    setError(null);
    setDistance(null); 
    try {

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`;
      
      const routeResponse = await fetch(osrmUrl);
      const routeData = await routeResponse.json();

      if (!routeData.routes || routeData.routes.length === 0) {
        throw new Error('No route found between selected coordinates.');
      }

      const meters = routeData.routes[0].distance;
      setDistance((meters / 1000).toFixed(1));

      const rawCoordinates = routeData.routes[0].geometry.coordinates;
      const leafletPolyline = rawCoordinates.map(([lng, lat]) => [lat, lng]);
      setRoutePolyline(leafletPolyline);

      const backendResponse = await fetch('http://localhost:5000/api/weather-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: rawCoordinates }), 
      });

      const backendData = await backendResponse.json();
      if (!backendResponse.ok) throw new Error(backendData.error || 'Failed to analyze route weather.');

      setWeatherWaypoints(backendData.data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { calculateRouteAndWeather, routePolyline, weatherWaypoints, distance, loading, error };
}