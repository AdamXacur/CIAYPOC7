import { GoogleGenAI } from "@google/genai";
import { CitizenRequest, TrendData } from "../types";

// Note: This relies on process.env.API_KEY being set in the build environment.
// For the POC, we handle the missing key gracefully in the UI.

export const generateExecutiveReport = async (
  requests: CitizenRequest[],
  trends: TrendData[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    // Return a mock response if no API key is present for the POC demo
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`## Reporte Ejecutivo Generado por IA (Simulado)
        
**Resumen General:**
Se ha detectado un volumen considerable de solicitudes en el sector **Transporte** y **Servicios Públicos** durante la última semana. La satisfacción ciudadana muestra una tendencia a la baja en Kanasín.

**Puntos Críticos:**
1. **Transporte:** Quejas recurrentes sobre frecuencias en horas pico.
2. **Servicios Públicos:** Fugas de agua en Mérida Poniente requieren atención inmediata (Urgency: Crítica).

**Recomendaciones:**
* Incrementar supervisión en rutas de Kanasín.
* Desplegar brigadas de JAPAY a la zona poniente antes de 24 horas.
        `);
      }, 1500);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare data context for the model
    const dataContext = `
      Solicitudes recientes: ${JSON.stringify(requests.slice(0, 20))}
      Tendencias semanales: ${JSON.stringify(trends)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Actúa como un experto analista de políticas públicas del Gobierno de Yucatán. 
      Analiza los siguientes datos de atención ciudadana (JSON) y genera un reporte ejecutivo breve en formato Markdown.
      
      Estructura del reporte:
      1. Resumen General (Sentimiento y volumen).
      2. Puntos Críticos (Áreas con urgencia Alta/Crítica).
      3. Recomendaciones de Acción.

      Datos:
      ${dataContext}
      `,
    });

    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Error generating AI report:", error);
    return "Error al conectar con el servicio de IA. Verifique su conexión o API Key.";
  }
};
