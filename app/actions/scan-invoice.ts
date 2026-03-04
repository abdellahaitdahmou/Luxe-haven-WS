"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim() || "");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim() || "dummy",
});

export async function processInvoiceAction(base64Image: string) {
    try {
        const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || "image/jpeg";
        const imageData = base64Image.split(",")[1];

        // 1. Try OpenAI if key is present
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "paste_your_openai_key_here") {
            try {
                console.log("Processing with OpenAI GPT-4o...");
                const response = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Analyze this invoice image and extract the following information in JSON format.
                                    
                                    CRITICAL IDENTIFICATION RULES:
                                    1. SUPPLIER vs CLIENT:
                                       - The SUPPLIER is the company SELLING the service/product (e.g., BRICOMA, VEGETAL PLANTE). 
                                       - The CLIENT/CUSTOMER is "LUXE HAVEN SARL" (ICE: 003644473000006). If you see "LUXE HAVEN", it is NOT the supplier. 
                                       - THE SUPPLIER IS NEVER LUXE HAVEN. Look for the OTHER company name.
                                       - The SUPPLIER's ICE number is a 15-digit code (NOT 003644473000006 which belongs to Luxe Haven).
                
                                     2. AMOUNTS (MAD):
                                        - amount_ht: Montant Hors Taxe.
                                        - tva: Value Added Tax amount in MAD (usually 20% of HT).
                                        - amount_ttc: Total TTC (all taxes included).
                                        - remise: Discount amount if any, otherwise 0.
                                        - debit: Debit amount if shown separately, otherwise same as amount_ttc.
                                        - credit: Credit amount if shown, otherwise 0.
                                        - total_paye: The actual total paid (TOTAL PAYÉ). Usually same as amount_ttc.
                                     3. DATES:
                                        - date: The invoice date (DD/MM/YYYY → convert to YYYY-MM-DD).
                                        - due_date: Payment deadline if mentioned, otherwise use the invoice date.
                
                                     JSON Structure:
                                     {
                                       "invoice_number": "string",
                                       "date": "YYYY-MM-DD",
                                       "due_date": "YYYY-MM-DD",
                                       "supplier": "string",
                                       "ice": "string (15-digit ICE of the supplier, NOT Luxe Haven's ICE)",
                                       "amount_ht": number,
                                       "tva": number,
                                       "amount_ttc": number,
                                       "remise": number,
                                       "debit": number,
                                       "credit": number,
                                       "total_paye": number,
                                       "payment_method": "Espèce" | "Carte banquaire" | "Virement" | "Chèque" | "BC" | "C/E",
                                       "category": "Maintenance" | "Utilities" | "Other"
                                     }
                                     Return ONLY the JSON. If a value is unknown, use null.`,
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                    response_format: { type: "json_object" },
                });

                const content = response.choices[0].message.content;
                if (!content) throw new Error("Empty response from OpenAI");
                return { success: true, data: JSON.parse(content) };
            } catch (err: any) {
                console.error("OpenAI Error, falling back to Gemini:", err.message);
                // Continue to Gemini
            }
        }

        // 2. Default to Gemini
        console.log(`Processing with Gemini Flash Latest (Mime: ${mimeType})...`);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
            Analyze this invoice image and extract the following information in JSON format.
            
            CRITICAL IDENTIFICATION RULES:
            1. SUPPLIER vs CLIENT:
               - The SUPPLIER is the company SELLING the service/product (e.g., BRICOMA, VEGETAL PLANTE). They usually have the big logo at the top.
               - The CLIENT/CUSTOMER is "LUXE HAVEN SARL" (ICE: 003644473000006). If you see "LUXE HAVEN", it is NOT the supplier. 
               - THE SUPPLIER IS NEVER LUXE HAVEN. Look for the OTHER company name.
               - The SUPPLIER's ICE number is a 15-digit code (NOT 003644473000006 which belongs to Luxe Haven).
            2. AMOUNTS (MAD):
               - amount_ht: Montant Hors Taxe.
               - tva: Value Added Tax amount in MAD (usually 20% of HT).
               - amount_ttc: Total TTC (all taxes included).
               - remise: Discount amount if any, otherwise 0.
               - debit: Debit amount if shown separately, otherwise same as amount_ttc.
               - credit: Credit amount if shown, otherwise 0.
               - total_paye: The actual total paid (TOTAL PAYÉ). Usually same as amount_ttc.
            3. DATES:
               - date: The invoice date (convert DD/MM/YYYY to YYYY-MM-DD).
               - due_date: The payment deadline if mentioned, otherwise use the invoice date.

            JSON Structure:
            {
              "invoice_number": "string",
              "date": "YYYY-MM-DD",
              "due_date": "YYYY-MM-DD",
              "supplier": "string",
              "ice": "string (15-digit ICE of the supplier, NOT Luxe Haven's ICE)",
              "amount_ht": number,
              "tva": number,
              "amount_ttc": number,
              "remise": number,
              "debit": number,
              "credit": number,
              "total_paye": number,
              "payment_method": "Espèce" | "Carte banquaire" | "Virement" | "Chèque" | "BC" | "C/E",
              "category": "Maintenance" | "Utilities" | "Other"
            }
            Return ONLY the JSON. If a value is unknown, use null.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType: mimeType,
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

        console.log("Sending to Google Sheet:", JSON.stringify(data, null, 2));

        const response = await fetch(scriptUrl, {
            method: "POST",
            redirect: "follow", // REQUIRED: Google Apps Script always redirects POST requests
            headers: {
                "Content-Type": "text/plain", // Must be text/plain to avoid CORS preflight on redirect
            },
            body: JSON.stringify(data),
        });

        const responseText = await response.text();
        console.log("Google Script response:", response.status, responseText);

        if (!response.ok) {
            throw new Error(`Google Script Error (${response.status}): ${responseText}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, error: error.message };
    }
}
