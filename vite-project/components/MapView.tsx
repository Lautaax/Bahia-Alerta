
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertCategory, NotificationSettings } from '../types';
import { getBahiaBlancaPlaceInfo, getSpeechForText } from '../services/geminiService';

interface MapViewProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  userSettings?: NotificationSettings;
}

declare const L: any;

// Audio Decoding Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const MapView: React.FC<MapViewProps> = ({ alerts, onSelectAlert, userSettings }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isRadiusFilterActive, setIsRadiusFilterActive] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const getCategoryColor = (category: AlertCategory) => {
    switch (category) {
      case AlertCategory.ACCIDENT: return '#ef4444';
      case AlertCategory.CRIME: return '#a855f7';
      case AlertCategory.TRAFFIC: return '#3b82f6';
      case AlertCategory.FIRE: return '#f97316';
      case AlertCategory.SERVICE: return '#6b7280';
      case AlertCategory.BROKEN_ASPHALT: return '#92400e';
      default: return '#3b82f6';
    }
  };

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const handleAiInsight = async () => {
    if (!userLocation) return;
    
    stopAudio();
    setIsAiLoading(true);
    setAiInsight(null);

    try {
      const result = await getBahiaBlancaPlaceInfo("Resume brevemente la situación actual de tránsito y seguridad en este sector de Bahía Blanca.", userLocation.lat, userLocation.lng);
      setAiInsight(result.text);

      const audioBase64 = await getSpeechForText(result.text);
      if (audioBase64) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioBytes = decodeBase64(audioBase64);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          setIsAudioPlaying(false);
          currentSourceRef.current = null;
        };

        setIsAudioPlaying(true);
        currentSourceRef.current = source;
        source.start();
      }
    } catch (e) {
      console.error("AI Insight Error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Distance helper
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-38.7183, -62.2660], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    clusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50
    });
    mapRef.current.addLayer(clusterGroupRef.current);

    updateMarkers();
    centerOnUser();

    return () => {
      stopAudio();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    updateMarkers();
  }, [alerts, isRadiusFilterActive, userLocation, userSettings?.radiusKm]);

  const updateMarkers = () => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();
    
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    const filtered = isRadiusFilterActive && userLocation && userSettings?.radiusKm
      ? alerts.filter(a => getDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng) <= userSettings.radiusKm)
      : alerts;

    if (isRadiusFilterActive && userLocation && userSettings?.radiusKm) {
      radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: userSettings.radiusKm * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '5, 10'
      }).addTo(mapRef.current);
    }

    filtered.forEach(alert => {
      const color = getCategoryColor(alert.category);
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full opacity-30 alert-pulse" style="background-color: ${color}"></div>
            <div class="relative w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-black" style="background-color: ${color}">
              ${alert.category[0]}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([alert.location.lat, alert.location.lng], { icon })
        .bindPopup(`
          <div class="p-2 min-w-[200px]">
            <div class="flex justify-between items-start mb-1">
              <span class="text-[9px] font-black text-blue-600 uppercase tracking-tighter">${alert.category}</span>
              <span class="text-[8px] text-gray-400 font-bold">${alert.userName}</span>
            </div>
            <p class="text-xs font-bold text-gray-900 mb-3 leading-tight">${alert.description.substring(0, 60)}${alert.description.length > 60 ? '...' : ''}</p>
            <div class="flex space-x-2">
               <button 
                id="view-details-${alert.id}"
                class="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-[10px] font-black tracking-wide shadow-sm hover:bg-blue-700 transition-colors"
              >
                DETALLES
              </button>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${alert.location.lat},${alert.location.lng}" 
                target="_blank"
                class="bg-gray-100 text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="Cómo llegar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </a>
            </div>
          </div>
        `, {
          className: 'custom-leaflet-popup',
          closeButton: false,
          offset: [0, -10]
        });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-${alert.id}`);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectAlert(alert);
          });
        }
      });
      
      clusterGroupRef.current.addLayer(marker);
    });
  };

  const centerOnUser = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      mapRef.current.flyTo([latitude, longitude], 15);
      
      L.circleMarker([latitude, longitude], {
        radius: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        color: 'white',
        weight: 3
      }).addTo(mapRef.current).bindTooltip("Tú", { permanent: false, direction: 'top' });
    }, (err) => {
      console.warn("Geolocation denied or failed.", err);
    });
  };

  return (
    <div className="relative bg-gray-100 rounded-3xl overflow-hidden h-[65vh] border border-gray-200 shadow-inner group">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[400]">
        <button 
          onClick={centerOnUser}
          title="Mi ubicación"
          className="bg-white p-3 rounded-2xl shadow-lg text-gray-600 hover:text-blue-600 active:scale-95 transition-all border border-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button 
          onClick={() => setIsRadiusFilterActive(!isRadiusFilterActive)}
          title={isRadiusFilterActive ? "Ver todas las alertas" : `Ver alertas en un radio de ${userSettings?.radiusKm || 5}km`}
          className={`p-3 rounded-2xl shadow-lg transition-all border active:scale-95 ${isRadiusFilterActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-100 hover:text-blue-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>

        <button 
          onClick={handleAiInsight}
          disabled={isAiLoading || !userLocation}
          title="Resumen IA por Audio"
          className={`p-3 rounded-2xl shadow-lg text-white active:scale-95 transition-all border flex items-center justify-center ${isAudioPlaying ? 'bg-green-600 border-green-500 animate-pulse' : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-700'}`}
        >
          {isAiLoading ? (
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : isAudioPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>

      {aiInsight && (
        <div className="absolute top-20 left-4 right-4 z-[400] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-indigo-100 relative group">
            <button 
              onClick={() => { setAiInsight(null); stopAudio(); }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${isAudioPlaying ? 'bg-green-50 text-green-600 border-green-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                {isAudioPlaying ? (
                  <div className="flex space-x-0.5 items-end h-4">
                    <div className="w-1 bg-current animate-[wave_1s_ease-in-out_infinite] h-full"></div>
                    <div className="w-1 bg-current animate-[wave_1s_ease-in-out_0.2s_infinite] h-2/3"></div>
                    <div className="w-1 bg-current animate-[wave_1s_ease-in-out_0.4s_infinite] h-1/2"></div>
                  </div>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                )}
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                  {isAudioPlaying ? 'Reproduciendo Resumen...' : 'IA Insights'}
                </span>
                <p className="text-xs text-gray-800 font-medium leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-[400]">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg text-[10px] font-black text-gray-700 flex flex-col space-y-1 border border-gray-200">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            MAPA BAHIENSE EN VIVO
          </div>
          <div className="text-blue-600 uppercase tracking-tight flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
            Basado en Google Maps Data
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>
    </div>
  );
};

export default MapView;
