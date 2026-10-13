import React, { useEffect, useRef, useState } from 'react';

let mapsLoader;
const escapeMapText = (value) => String(value ?? '').replace(/[<>&"']/g, '');

export function loadGoogleMaps(apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is missing.'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Google Maps could not be loaded. Check the API key and its referrer restrictions.'));
    document.head.appendChild(script);
  });
  return mapsLoader;
}

export const MapView = ({ listings = [], userLocation, onLocationSelect, height = '24rem' }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const center = userLocation || { latitude: 12.9716, longitude: 77.5946 };

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: { lat: Number(center.latitude), lng: Number(center.longitude) },
          zoom: listings.length ? 12 : 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        new maps.Marker({
          map,
          position: { lat: Number(center.latitude), lng: Number(center.longitude) },
          title: 'Your selected location',
          label: 'You',
        });
        listings.forEach((listing) => {
          const marker = new maps.Marker({
            map,
            position: { lat: Number(listing.latitude), lng: Number(listing.longitude) },
            title: listing.title,
          });
          const info = new maps.InfoWindow({
            content: `<strong>${escapeMapText(listing.title)}</strong><br/>₹${Number(listing.price)} / ${escapeMapText(listing.unit)}`,
          });
          marker.addListener('click', () => info.open({ map, anchor: marker }));
        });
        if (onLocationSelect) {
          map.addListener('click', (event) => onLocationSelect({
            latitude: event.latLng.lat(), longitude: event.latLng.lng(),
          }));
        }
      })
      .catch((loadError) => !cancelled && setError(loadError.message));
    return () => { cancelled = true; };
  }, [apiKey, center.latitude, center.longitude, listings, onLocationSelect]);

  if (!apiKey) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-sm">
        <p className="font-semibold text-slate-300 mb-1">Map View Unavailable</p>
        <p>Set <code className="text-emerald-400">VITE_GOOGLE_MAPS_API_KEY</code> in environment variables to enable Google Maps.</p>
      </div>
    );
  }
  if (error) return <div className="bg-slate-900 border border-red-800 rounded-lg p-5 text-red-200 text-sm">{error}</div>;
  return <div ref={containerRef} className="rounded-lg overflow-hidden border border-slate-800 shadow-xl" style={{ height }} />;
};
