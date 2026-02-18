
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCategory, Alert } from '../types';
import { analyzeAlertPotential, getBahiaBlancaPlaceInfo } from '../services/geminiService';

interface CreateAlertModalProps {
  onClose: () => void;
  onSubmit: (data: { category: AlertCategory, description: string, image?: string, location: { lat: number, lng: number, address: string } }) => void;
  initialAlert?: Alert | null;
}

declare const L: any;

const QUICK_REPORTS = [
  { label: '🚗 Choque', category: AlertCategory.ACCIDENT, text: 'Choque leve entre dos vehículos. No parece haber heridos de gravedad.' },
  { label: '🚥 Semáforo', category: AlertCategory.TRAFFIC, text: 'Semáforo fuera de servicio o con fallas en la sincronización.' },
  { label: '🕳️ Pozo/Asfalto', category: AlertCategory.BROKEN_ASPHALT, text: 'Se reporta un pozo o desperfecto en el asfalto' },
  { label: '💡 Sin Luz', category: AlertCategory.SERVICE, text: 'Corte de luz total en la manzana.' },
  { label: '🚨 Robo', category: AlertCategory.CRIME, text: 'Actividad sospechosa o robo detectado en la vía pública.' },
];

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ onClose, onSubmit, initialAlert }) => {
  const [description, setDescription] = useState(initialAlert?.description || '');
  const [category, setCategory] = useState<AlertCategory>(initialAlert?.category || AlertCategory.TRAFFIC);
  const [address, setAddress] = useState(initialAlert?.location.address || '');
  const [image, setImage] = useState<string | undefined>(initialAlert?.image);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isAiLocating, setIsAiLocating] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [hasManuallySelected, setHasManuallySelected] = useState(!!initialAlert);
  const [isAutoSelected, setIsAutoSelected] = useState(false);
  
  const [location, setLocation] = useState(initialAlert?.location || { lat: -38.7183, lng: -62.2660 });
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image Handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        if (description.length > 5) runAiAnalysis(false, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reverse Geocoding
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.address) {
        const street = data.address.road || '';
        const houseNumber = data.address.house_number || '';
        const neighborhood = data.address.suburb || data.address.neighbourhood || '';
        const formattedAddress = `${street} ${houseNumber}${street && houseNumber ? ', ' : ''}${neighborhood}`.trim();
        setAddress(formattedAddress || data.display_name.split(',')[0]);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Forward Geocoding
  const forwardGeocode = useCallback(async (query: string) => {
    if (query.length < 5) return;
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Bahía Blanca, Argentina')}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        updateMarkerPosition(newPos.lat, newPos.lng);
      }
    } catch (error) {
      console.error("Forward geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const updateMarkerPosition = (lat: number, lng: number) => {
    setLocation(prev => ({ ...prev, lat, lng }));
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng]);
    }
  };

  const handleSmartSearch = async () => {
    if (address.length < 3) return;
    setIsAiLocating(true);
    try {
      const result = await getBahiaBlancaPlaceInfo(`¿Dónde queda exactamente "${address}" en Bahía Blanca? Dame solo la ubicación geográfica si puedes.`, location.lat, location.lng);
      if (result.places && result.places.length > 0) {
        const placeTitle = result.places[0].title;
        setAddress(placeTitle);
        forwardGeocode(placeTitle);
      } else {
        forwardGeocode(address);
      }
    } catch (error) {
      console.error("Smart search error:", error);
    } finally {
      setIsAiLocating(false);
    }
  };

  // Sync AI analysis
  const runAiAnalysis = async (manual = false, imgOverride?: string) => {
    const currentImg = imgOverride || image;
    if (description.length < 10) return;
    setIsAiAnalyzing(true);
    try {
      const analysis = await analyzeAlertPotential(description, currentImg);
      if (analysis) {
        setAiAnalysis(analysis);
        if (!initialAlert && !hasManuallySelected) {
          const found = Object.values(AlertCategory).find(c => c === analysis.category);
          if (found) {
            setCategory(found);
            setIsAutoSelected(true);
          }
        }
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  useEffect(() => {
    if (description.length > 15 && !initialAlert) {
      const timeout = setTimeout(() => runAiAnalysis(), 1500);
      return () => clearTimeout(timeout);
    }
  }, [description, initialAlert]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    geocodeTimeoutRef.current = setTimeout(() => {
      forwardGeocode(value);
    }, 1500);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: false
      }).setView([location.lat, location.lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
      markerRef.current = L.marker([location.lat, location.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setLocation(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }));
        reverseGeocode(pos.lat, pos.lng);
      });
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        setLocation(prev => ({ ...prev, lat, lng }));
        reverseGeocode(lat, lng);
      });
      if (!initialAlert && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(prev => ({ ...prev, ...newPos }));
          mapRef.current.setView([newPos.lat, newPos.lng], 16);
          markerRef.current.setLatLng([newPos.lat, newPos.lng]);
          reverseGeocode(newPos.lat, newPos.lng);
        });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [reverseGeocode]);

  const handleQuickReport = (report: typeof QUICK_REPORTS[0]) => {
    setHasManuallySelected(true);
    setIsAutoSelected(false);
    setCategory(report.category);
    setDescription(report.text);
    setAiAnalysis(null);
  };

  const applyAiCategory = (suggested: string) => {
    const found = Object.values(AlertCategory).find(c => c === suggested);
    if (found) {
      setCategory(found);
      setHasManuallySelected(true);
      setIsAutoSelected(false);
    }
  };

  const applyAiDescription = (improvedText: string) => {
    setDescription(improvedText);
  };

  const applyAiSubcategory = (sub: string) => {
    if (!description.includes(sub)) {
      setDescription(prev => `${prev} (${sub})`);
    }
  };

  const selectCategoryManually = (cat: AlertCategory) => {
    setCategory(cat);
    setHasManuallySelected(true);
    setIsAutoSelected(false);
    
    // Si se selecciona Asfalto Roto y la descripción está vacía, pre-completamos para guiar al usuario
    if (cat === AlertCategory.BROKEN_ASPHALT && (!description.trim() || description === '')) {
      setDescription('Se reporta un pozo o desperfecto en el asfalto');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !address) return;
    setIsSubmitting(true);
    onSubmit({
      category,
      description,
      image,
      location: { lat: location.lat, lng: location.lng, address }
    });
  };

  const showCategoryMismatch = aiAnalysis && initialAlert && aiAnalysis.category !== category;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{initialAlert ? 'Editar Reporte' : 'Reportar Alerta'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {!initialAlert && (
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Reporte Rápido</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPORTS.map((report, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReport(report)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${category === report.category ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50'}`}
                  >
                    {report.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1. DESCRIPTION FIRST */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Detalles del Reporte</label>
              <button 
                type="button"
                onClick={() => runAiAnalysis(true)}
                disabled={isAiAnalyzing || description.length < 10}
                className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all flex items-center group active:scale-95 disabled:opacity-50"
              >
                {isAiAnalyzing ? (
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-3 h-3 mr-1 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1.046.12-.38z" clipRule="evenodd" /></svg>
                )}
                {isAiAnalyzing ? 'ANALIZANDO...' : 'REFINAR CON IA'}
              </button>
            </div>
            <textarea 
              rows={3}
              placeholder="Describe lo que sucede. Mientras más detalles des, mejor podrá ayudarte la IA a categorizarlo."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* 2. ENHANCED AI ASSISTANT BOX */}
          {aiAnalysis && (
            <div className="relative group overflow-hidden rounded-3xl p-[2px] animate-in fade-in slide-in-from-top-4 duration-500">
              <div className={`absolute inset-0 bg-gradient-to-r ${aiAnalysis.isLegitimate ? 'from-indigo-500 via-purple-500 to-blue-500' : 'from-red-500 to-orange-500'} opacity-30 blur-sm`}></div>
              <div className="relative bg-white rounded-[22px] p-5 shadow-sm border border-white/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${aiAnalysis.isLegitimate ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Análisis Local con IA</h3>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black ${aiAnalysis.confidenceScore > 0.8 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {(aiAnalysis.confidenceScore * 100).toFixed(0)}% CONFIANZA
                  </div>
                </div>

                {/* Legitimacy Reason Display */}
                <div className={`mb-4 p-3 rounded-xl border text-[11px] leading-relaxed font-medium ${aiAnalysis.isLegitimate ? 'bg-blue-50/50 border-blue-100 text-blue-800' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
                   <span className="font-black mr-1">{aiAnalysis.isLegitimate ? '✅ VALIDACIÓN:' : '❌ DUDA:'}</span>
                   {aiAnalysis.legitimacyReasoning}
                </div>

                {!aiAnalysis.isLegitimate ? (
                  <p className="text-xs text-red-700 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">⚠️ {aiAnalysis.suggestion}</p>
                ) : (
                  <div className="space-y-4">
                    {showCategoryMismatch && (
                      <div className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 animate-in slide-in-from-left-4 duration-300">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-orange-800 uppercase tracking-tight mb-1">Cambio de Categoría</p>
                            <p className="text-[11px] text-orange-700 font-medium leading-tight mb-3">Detectado como <span className="font-black">"{aiAnalysis.category}"</span> según el contexto.</p>
                            <button 
                              type="button"
                              onClick={() => applyAiCategory(aiAnalysis.category)}
                              className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-orange-700 transition-all active:scale-95"
                            >
                              Aplicar sugerencia
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyAiCategory(aiAnalysis.category)}
                        className={`flex items-center transition-all px-4 py-2 rounded-xl border shadow-sm group/btn ${category === aiAnalysis.category ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white border-indigo-100'}`}
                      >
                        <span className={`text-[9px] font-black uppercase mr-2 opacity-50 ${category === aiAnalysis.category ? 'opacity-100' : 'group-hover/btn:opacity-100'}`}>Tipo:</span>
                        <span className="text-xs font-bold">{aiAnalysis.category}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAiSubcategory(aiAnalysis.subCategory)}
                        className="flex items-center bg-blue-50 hover:bg-blue-600 hover:text-white transition-all px-4 py-2 rounded-xl border border-blue-100 shadow-sm group/btn max-w-full overflow-hidden"
                      >
                        <span className="text-[9px] font-black uppercase mr-2 opacity-50 group-hover/btn:opacity-100 shrink-0">Detalle:</span>
                        <span className="text-xs font-bold truncate">{aiAnalysis.subCategory}</span>
                      </button>
                    </div>

                    {aiAnalysis.improvedDescription && aiAnalysis.improvedDescription !== description && (
                       <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Mejora con IA:</span>
                          <p className="text-xs text-gray-700 italic leading-relaxed">"{aiAnalysis.improvedDescription}"</p>
                          <button 
                            type="button"
                            onClick={() => applyAiDescription(aiAnalysis.improvedDescription)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm transition-all active:scale-95"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            Usar esta versión
                          </button>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. CATEGORY SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Categoría Seleccionada</label>
              {hasManuallySelected && !isAutoSelected && (
                <span className="text-[9px] font-black text-blue-500 uppercase">Manual</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.values(AlertCategory).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectCategoryManually(cat)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${category === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. EVIDENCE */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Evidencia (Opcional)</label>
            <div className="flex items-center space-x-4">
              {image ? (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-blue-100 group shadow-md">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-tight">Adjuntar Foto</span>
                </button>
              )}
              <div className="flex-1 text-[10px] text-gray-400 font-medium italic">Un reporte con imagen tiene 5x más probabilidades de ser verificado.</div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          {/* 5. LOCATION */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Ubicación Precisa</label>
              {(isGeocoding || isAiLocating) && (
                <span className="flex items-center text-[10px] text-blue-600 font-bold animate-pulse">
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {isAiLocating ? 'Buscando...' : 'Obteniendo...'}
                </span>
              )}
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner h-40 mb-4 group">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
            </div>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Dirección o referencia..."
                className={`flex-1 px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm border-gray-200`}
                value={address}
                onChange={handleAddressChange}
                required
              />
              <button 
                type="button"
                onClick={handleSmartSearch}
                disabled={address.length < 3 || isAiLocating}
                className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-gray-300 shadow-sm flex items-center justify-center group"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !description || !address || isGeocoding || isAiLocating || isAiAnalyzing}
            className={`w-full ${initialAlert ? 'bg-blue-600' : 'bg-red-600'} text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:bg-gray-300`}
          >
            {isSubmitting ? 'Procesando...' : (initialAlert ? 'Guardar Cambios' : 'Publicar Alerta')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAlertModal;
