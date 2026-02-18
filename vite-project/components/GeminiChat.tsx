
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getBahiaBlancaPlaceInfo, PlaceResult } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string, url: string }[];
  places?: { title: string, url: string, snippet?: string }[];
}

const QUICK_SUGGESTIONS = [
  "¿Cómo está el tránsito en el centro?",
  "¿Farmacias de turno para hoy?",
  "¿Eventos culturales este finde?",
  "¿Dónde hay un cajero cerca?",
  "Estado del clima y alertas"
];

const GeminiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de Bahía Alerta. Puedo ayudarte con información sobre el tránsito, lugares de interés o eventos en la ciudad usando datos de Google Maps en tiempo real. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-AR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageToSend = textOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMsg = messageToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    let lat: number | undefined;
    let lng: number | undefined;
    
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) {
      console.warn("Could not get location for grounding.");
    }

    const result = await getBahiaBlancaPlaceInfo(userMsg, lat, lng);
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: result.text, 
      sources: result.sources,
      places: result.places
    }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-gray-100 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-none">Asistente Bahiense</h3>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Conectado a Google Maps
              </span>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-200`}>
            <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-800'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              
              {m.places && m.places.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest block ${m.role === 'user' ? 'text-blue-100' : 'text-blue-600'}`}>Lugares Encontrados:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {m.places.map((p, pi) => (
                      <a 
                        key={pi} 
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-start p-2 bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all shadow-sm group"
                      >
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 shrink-0 mr-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">{p.title}</p>
                          {p.snippet && <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{p.snippet}"</p>}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {m.sources && m.sources.length > 0 && (
                <div className={`mt-3 pt-3 border-t ${m.role === 'user' ? 'border-white/20' : 'border-gray-200'}`}>
                  <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 opacity-60 ${m.role === 'user' ? 'text-white' : 'text-gray-500'}`}>Fuentes web:</span>
                  <div className="flex flex-wrap gap-1">
                    {m.sources.map((s, si) => (
                      <a key={si} href={s.url} target="_blank" rel="noopener noreferrer" className={`text-[9px] px-2 py-0.5 rounded border transition-colors block max-w-[150px] truncate ${m.role === 'user' ? 'bg-white/20 border-white/30 text-white hover:bg-white/40' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}

        {!isLoading && messages.length < 3 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button 
                key={i}
                onClick={() => handleSend(s)}
                className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Escuchando..." : "Pregunta sobre la ciudad..."}
              className={`w-full pl-4 pr-12 py-3.5 bg-white border rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-sm ${isListening ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}
            />
            <button 
              onClick={toggleListening}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'text-red-600 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              title="Entrada de voz"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 shadow-md active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-gray-400 text-center mt-2 font-medium">
          La IA puede cometer errores. Verifica información crítica.
        </p>
      </div>
    </div>
  );
};

export default GeminiChat;
