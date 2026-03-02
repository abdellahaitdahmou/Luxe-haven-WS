const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAn7tVMLpVPUf9yLogAWiHboVof_I7Xi78");

async function list() {
    const result = await genAI.listModels();
    result.models.forEach(m => console.log(m.name));
}
list();
