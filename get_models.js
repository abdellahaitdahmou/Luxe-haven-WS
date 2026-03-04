const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI("AIzaSyBRd2p_tzjr-plmOQNLPdfiHwREshUsEPU");
    try {
        const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
        // note: listModels is a top level function not on model
        console.log("Listing models...");
    } catch (error) {
        // console.error(error);
    }
}

// Fixed listModels call
async function run() {
    const apiKey = "AIzaSyBRd2p_tzjr-plmOQNLPdfiHwREshUsEPU";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
