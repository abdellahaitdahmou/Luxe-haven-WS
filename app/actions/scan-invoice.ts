"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim() || "");

export async function processInvoiceAction(base64Image: string) {
    try {
        console.log("Processing invoice with Gemini 1.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Analyze this invoice image and extract the following information in JSON format:
            {
              "invoice_number": "number",
              "date": "YYYY-MM-DD",
              "supplier": "name",
              "ice": "ICE number",
              "amount_ht": number,
              "tva": number,
              "amount_ttc": number,
              "payment_method": "Espèce" | "Carte bancaire" | "Virement" | "Chèque" | "BC",
              "category": "Maintenance" | "Utilities" | "Other"
            }
            Return ONLY the JSON. If a value is unknown, use null.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image.split(",")[1],
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json|```/g, "").trim();
        const extractedData = JSON.parse(cleanedText);

        return { success: true, data: extractedData };
    } catch (error: any) {
        console.error("OCR Error:", error);
        return { success: false, error: error.message };
    }
}

export async function saveToGoogleSheet(data: any) {
    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
        if (!scriptUrl) throw new Error("GOOGLE_SCRIPT_URL not found in .env.local");

        const response = await fetch(scriptUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Script Error: ${errorText}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, error: error.message };
    }
}
