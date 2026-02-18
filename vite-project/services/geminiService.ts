
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PlaceResult {
  text: string;
  sources: { title: string, url: string }[];
  places: { title: string, url: string, snippet?: string }[];
}

/**
 * Uses Gemini 2.5 Flash with Google Maps Grounding to get location-aware info.
 */
export const getBahiaBlancaPlaceInfo = async (query: string, lat?: number, lng?: number): Promise<PlaceResult> => {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
    };

    if (lat && lng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Contexto: Usuario en Bahía Blanca, Argentina. 
      Pregunta: ${query}
      Si se trata de una ubicación, búscala en Google Maps para dar detalles precisos (dirección, horarios, estado).`,
      config,
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: { title: string, url: string }[] = [];
    const places: { title: string, url: string, snippet?: string }[] = [];

    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, url: chunk.web.uri });
      }
      if (chunk.maps) {
        places.push({ 
          title: chunk.maps.title || 'Ubicación en Maps', 
          url: chunk.maps.uri,
          snippet: chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0]
        });
      }
    });

    return {
      text: response.text || "No pude obtener una respuesta clara.",
      sources,
      places
    };
  } catch (error) {
    console.error("Gemini Place Info Error:", error);
    return {
      text: "Error al conectar con los servicios de ubicación. Intenta de nuevo.",
      sources: [],
      places: []
    };
  }
};

/**
 * Generates audio data from text using Gemini TTS.
 */
export const getSpeechForText = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Resume esto brevemente para un reporte de audio de un segundo: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return undefined;
  }
};

/**
 * Advanced Alert Analysis for Bahía Blanca.
 * Evaluates legitimacy based on local context, landmarks, and visual evidence.
 */
export const analyzeAlertPotential = async (description: string, imageBase64?: string) => {
  try {
    const parts: any[] = [
      { text: `Eres un experto en seguridad ciudadana de Bahía Blanca, Argentina. 
      Analiza minuciosamente este reporte: "${description}".
      
      Instrucciones Críticas:
      1. Valida si menciona calles (ej: Av. Alem, Estomba, Sesquicentenario), barrios (ej: Villa Mitre, Ing. White, Noroeste) o puntos de referencia locales.
      2. Evalúa si el lenguaje es consistente con un reporte de emergencia real.
      3. Si hay imagen, cruza la información visual con la descripción.
      4. Determina la legitimidad y proporciona un razonamiento detallado.` }
    ];

    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      });
      parts[0].text += " Analiza también la imagen adjunta para validar la severidad y el tipo de incidente.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLegitimate: { type: Type.BOOLEAN },
            confidenceScore: { 
              type: Type.NUMBER, 
              description: "Probabilidad (0.0 a 1.0) de que el reporte sea genuino y no spam o error." 
            },
            legitimacyReasoning: {
              type: Type.STRING,
              description: "Explicación breve de por qué se considera legítimo o no (ej: 'Menciona intersección específica y landmarks locales')."
            },
            category: { 
              type: Type.STRING, 
              enum: ["Accidente", "Seguridad/Robo", "Tránsito", "Incendio", "Corte de Servicio", "Asfalto Roto"] 
            },
            subCategory: { 
              type: Type.STRING, 
              description: "Ej: Colisión múltiple, Arrebato motochorro, Semáforo led intermitente, Bache profundo con agua, etc." 
            },
            severity: { type: Type.STRING, enum: ["Baja", "Media", "Alta"] },
            suggestion: { type: Type.STRING, description: "Cómo el usuario puede mejorar el reporte si es poco claro." },
            improvedDescription: { 
              type: Type.STRING, 
              description: "Versión optimizada y profesional del reporte para la comunidad." 
            }
          },
          required: ["isLegitimate", "confidenceScore", "legitimacyReasoning", "category", "severity", "subCategory", "improvedDescription"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
};
