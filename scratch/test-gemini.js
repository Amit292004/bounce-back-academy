const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return;

  const genAI = new GoogleGenerativeAI(key.trim());

  console.log("Testing gemini-flash-latest...");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Hello?");
    const response = await result.response;
    console.log("Success! Response:", response.text());
  } catch (e) {
    console.log("Flash failed:", e.message);
  }
}

testGemini();
