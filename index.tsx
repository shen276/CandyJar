/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;

if (!apiKey) {
    console.error("API_KEY is not defined. Please set it in your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

async function transcribeAudio(duration: number): Promise<string> {
    if (!apiKey) {
        return "API Key not configured. Transcription is unavailable.";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a short, sweet, and romantic sentence that a person might say to their partner in a voice message. The voice message is ${duration} seconds long. Keep the response to just the sentence itself, without any quotes or extra text.`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Transcription error:", error);
        return "Sorry, I couldn't transcribe that.";
    }
}

// Expose to global scope for app.js
(window as any).transcribeAudio = transcribeAudio;
