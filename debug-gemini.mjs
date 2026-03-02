import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function listModels() {
    try {
        const result = await genAI.listModels();
        console.log("Available Models:");
        result.models.forEach((m) => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
