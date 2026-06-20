import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { useRouteWeather } from './hooks/useRouteWeather';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


const START_VEHICLE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="34px" height="34px" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" stroke="#fff" stroke-width="1" style="display:none;"/>
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1-1-1s-1 .17-1 1V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
`;

const FINISH_FLAG_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="34px" height="34px" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>
  </svg>
`;

const WAYPOINT_DOT_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20px" height="20px">
    <circle cx="12" cy="12" r="6" fill="#F59E0B" stroke="#fff" stroke-width="2" style="filter: drop-shadow(0px 1px 3px rgba(0,0,0,0.5));"/>
  </svg>
`;

const WAYPOINT_RISK_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22px" height="22px">
    <circle cx="12" cy="12" r="7" fill="#EF4444" stroke="#fff" stroke-width="2" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.6));"/>
  </svg>
`;

function MapBoundsController({ polyline }) {
  const map = useMap();
  useEffect(() => {
    if (polyline && polyline.length > 0) {
      map.fitBounds(polyline, { padding: [50, 50] });
    }
  }, [polyline, map]);
  return null;
}

export default function App() {
  const { calculateRouteAndWeather, routePolyline, weatherWaypoints, loading, error: apiError } = useRouteWeather();
  

  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [localError, setLocalError] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  const fetchCoordinates = async (cityName) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName + ', Kenya')}&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'RouteWeatherAIOptimizerApp' } });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        name: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  };

  const handleRouteCalculation = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!startQuery.trim() || !endQuery.trim()) {
      setLocalError("Please enter both a departure point and destination target.");
      return;
    }

    try {
      setGeocoding(true);
      const [startLocation, endLocation] = await Promise.all([
        fetchCoordinates(startQuery),
        fetchCoordinates(endQuery)
      ]);

      if (!startLocation) {
        setLocalError(`Could not find departure location: "${startQuery}"`);
        setGeocoding(false);
        return;
      }
      if (!endLocation) {
        setLocalError(`Could not find destination target: "${endQuery}"`);
        setGeocoding(false);
        return;
      }

      setGeocoding(false);
      calculateRouteAndWeather(startLocation, endLocation);
    } catch (err) {
      setLocalError("Failed to resolve town locations due to network error.");
      setGeocoding(false);
    }
  };

  const checkSafetyRisk = (weatherItem) => {
    if (!weatherItem) return { isHighRisk: false, reasons: [] };
    const windSpeed = weatherItem.current?.wind_kph ?? 0;
    const condition = weatherItem.current?.condition?.text ?? '';
    const reasons = [];

    if (windSpeed > 15) reasons.push(`High Winds (${windSpeed} kph)`);
    if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle')) {
      reasons.push(`Precipitation (${condition})`);
    }

    return { isHighRisk: reasons.length > 0, reasons };
  };

  const activeError = localError || apiError;
  const systemLoading = loading || geocoding;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#0B0F19', margin: 0, padding: 0, overflow: 'hidden' }}>
      
      {/* Premium Sidebar Design */}
      <div style={{ 
        width: '380px', 
        padding: '24px', 
        background: 'linear-gradient(180deg, #111827 0%, #0F172A 100%)', 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px', 
        zIndex: 1000, 
        boxShadow: '4px 0 25px rgba(0,0,0,0.5)',
        borderRight: '1px solid #1E293B'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6', boxShadow: '0 0 10px #3B82F6' }}></div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #60A5FA, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Route Weather AI</h2>
          </div>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '6px', margin: 0, lineHeight: '1.5' }}>
            Calculate dynamic route safety matrices across Kenya.
          </p>
        </div>

        {/* Inputs Section */}
        <form onSubmit={handleRouteCalculation} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9CA3AF', marginBottom: '6px', fontWeight: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Departure Point</label>
            <input 
              type="text" 
              value={startQuery}
              onChange={(e) => setStartQuery(e.target.value)}
              placeholder="e.g. Nairobi, Mombasa, Eldoret"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0F172A', color: '#fff', fontSize: '14px', boxSizing: 'border-box', transition: 'border 0.2s' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9CA3AF', marginBottom: '6px', fontWeight: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destination Target</label>
            <input 
              type="text" 
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              placeholder="e.g. Nakuru, Nyeri, Kisumu"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0F172A', color: '#fff', fontSize: '14px', boxSizing: 'border-box', transition: 'border 0.2s' }}
            />
          </div>

          <button 
            type="submit"
            disabled={systemLoading}
            style={{ 
              marginTop: '4px',
              padding: '14px', 
              background: systemLoading ? '#334155' : 'linear-gradient(90deg, #2563EB, #1D4ED8)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: systemLoading ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: systemLoading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'transform 0.1s'
            }}
          >
            {geocoding ? 'Locating Waypoints...' : loading ? 'Analyzing Weather...' : 'Calculate Route Conditions'}
          </button>
        </form>

        {activeError && <div style={{ color: '#FCA5A5', fontSize: '13px', background: '#7F1D1D', padding: '12px', borderRadius: '8px', border: '1px solid #991B1B' }}>⚠️ {activeError}</div>}

        {/* Dynamic Card Feed */}
        {weatherWaypoints.length > 0 ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' }}>Waypoint Risk Profiles</span>
              <span style={{ fontSize: '11px', background: '#1E293B', color: '#60A5FA', padding: '2px 8px', borderRadius: '20px' }}>{weatherWaypoints.length} stops</span>
            </div>
            
            {weatherWaypoints.map((wp, idx) => {
              const isStart = idx === 0;
              const isEnd = idx === weatherWaypoints.length - 1;
              
              if (wp.error) {
                return (
                  <div key={idx} style={{ background: '#1E293B', padding: '14px', borderRadius: '10px', fontSize: '13px', borderLeft: '4px solid #64748B' }}>
                    <strong style={{ color: '#94A3B8' }}>Stop #{idx + 1}:</strong> Segment Data Offline
                  </div>
                );
              }

              const temperature = wp.weather?.current?.temp ?? 'N/A';
              const conditionText = wp.weather?.current?.condition?.text ?? 'Clear';
              const windSpeed = wp.weather?.current?.wind_kph ?? 0;
              
              const { isHighRisk, reasons } = checkSafetyRisk(wp.weather);

              return (
                <div 
                  key={idx} 
                  style={{ 
                    background: isHighRisk ? 'rgba(220, 38, 38, 0.1)' : '#1E293B', 
                    padding: '14px', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    borderLeft: isHighRisk ? '4px solid #EF4444' : isStart ? '4px solid #3B82F6' : isEnd ? '4px solid #10B981' : '4px solid #F59E0B',
                    border: isHighRisk ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #334155',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: isStart ? '#60A5FA' : isEnd ? '#34D399' : '#F3F4F6', fontWeight: '700' }}>
                      {isStart ? '🚀 Start Location' : isEnd ? '🏁 Finish Target' : `Stop #${idx + 1}`}
                    </strong>
                    {isHighRisk && (
                      <span style={{ background: '#7F1D1D', color: '#FCA5A5', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', letterSpacing: '0.5px' }}>
                        HAZARD
                      </span>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600' }}>{temperature}°C</span>
                    <span style={{ color: '#F59E0B', fontWeight: '500' }}>{conditionText}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Wind Velocity: <span style={{ color: '#F3F4F6' }}>{windSpeed} kph</span></div>
                  
                  {isHighRisk && (
                    <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '8px', padding: '6px', background: 'rgba(127, 29, 29, 0.4)', borderRadius: '4px', fontStyle: 'italic' }}>
                      Warning: {reasons.join(' & ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', textAlign: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '40px', height: '40px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.626 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span style={{ fontSize: '13px' }}>No active track loaded.<br/>Enter destinations to plot hazards.</span>
          </div>
        )}
      </div>

      {/* Map Element */}
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        <MapContainer center={[-1.2921, 36.8219]} zoom={7} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {routePolyline.length > 0 && <Polyline positions={routePolyline} color="#2563EB" weight={6} opacity={0.8} />}

          {weatherWaypoints.map((wp, idx) => {
            if (wp.error) return null;
            const position = [wp.coordinates[1], wp.coordinates[0]];
            
            const temperature = wp.weather?.current?.temp ?? 'N/A';
            const conditionText = wp.weather?.current?.condition?.text ?? 'Clear';
            const windSpeed = wp.weather?.current?.wind_kph ?? 0;
            
            const { isHighRisk, reasons } = checkSafetyRisk(wp.weather);
            const isStart = idx === 0;
            const isEnd = idx === weatherWaypoints.length - 1;

            
            const customIcon = L.divIcon({
              html: isStart ? START_VEHICLE_SVG : isEnd ? FINISH_FLAG_SVG : (isHighRisk ? WAYPOINT_RISK_SVG : WAYPOINT_DOT_SVG),
              className: 'custom-leaflet-icon',
              iconSize: [34, 34],
              iconAnchor: [17, 17]
            });

            return (
              <Marker key={idx} position={position} icon={customIcon}>
                <Popup>
                  <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                    <strong style={{ display: 'block', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '6px', color: isStart ? '#2563EB' : isEnd ? '#10B981' : '#1E293B' }}>
                      {isStart ? '🚀 Start Point' : isEnd ? '🏁 Destination Target' : `Waypoint #${idx + 1}`}
                    </strong>
                    <b>Temperature:</b> {temperature}°C<br />
                    <b>Condition:</b> {conditionText}<br />
                    <b>Wind Speed:</b> {windSpeed} kph
                    
                    {isHighRisk && (
                      <div style={{ marginTop: '8px', color: '#DC2626', fontWeight: 'bold', fontSize: '11px', borderTop: '1px dashed #FCA5A5', paddingTop: '6px' }}>
                        🚨 Risk Flags: {reasons.join(', ')}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <MapBoundsController polyline={routePolyline} />
        </MapContainer>
      </div>
    </div>
  );
}