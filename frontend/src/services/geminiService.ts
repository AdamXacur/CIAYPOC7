import { GoogleGenerativeAI } from "@google/generative-ai";
import { CitizenRequest, TrendData } from "../types";

// Servicio para generar reportes ejecutivos usando Gemini
export const generateExecutiveReport = async (
  requests: CitizenRequest[],
  trends: TrendData[]
): Promise<string> => {
  // Obtener API Key de las variables de entorno de Vite
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    // Mock si no hay API Key (para demos)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`## Reporte Ejecutivo (Modo Demo)
        
**Resumen:**
Se detecta actividad inusual en el sector transporte.

**Recomendaciones:**
* Revisar rutas en Kanasín.
* Atender fugas de agua prioritarias.
        `);
      }, 1000);
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const dataContext = `
      Solicitudes recientes: ${JSON.stringify(requests.slice(0, 10))}
      Tendencias: ${JSON.stringify(trends)}
    `;

    const prompt = `Actúa como un experto analista de gobierno. Analiza estos datos y genera un reporte breve en Markdown:
    ${dataContext}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error generating AI report:", error);
    return "Error al conectar con el servicio de IA.";
  }
};