import { GoogleGenAI } from "@google/genai";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*"
  })
);

const googleApiKey = process.env.GOOGLEAPI;

const { models } = new GoogleGenAI({
  apiKey: googleApiKey,
});

async function aiCall(prompt) {
  const response = await models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  // console.log(response.text);
  return response.text;
}

function updateChat(req, author, content) {
  req.session.messages.push({ author, content });
}

function initializeChat(req) {
  req.session.messages = [];
}

app.get("/", async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Manual 
    const manualPath = path.join(__dirname, "aiManual.txt");
    const manual = fs.readFileSync(manualPath, "utf-8");
    
    const prompt = JSON.stringify(manual);

    const aiRes = await aiCall(prompt);
    const aiResData = JSON.parse(aiRes);
    res.status(200).json({ aiResData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

app.post("/interact", async (req, res) => {
  try {
    // console.log(req.session.messages);
    // const data = req.body;
    // updateChat(req, "user", data);

    const prompt = JSON.stringify(req.body);
    const aiRes = await aiCall(prompt);
    const aiResData = JSON.parse(aiRes);
    console.log(aiResData);
    // updateChat(req, "assistant", aiResData);
    res.status(200).json({ aiResData });
  } catch (error) {
    res.status(500).json({ error });
    console.log(error);
  }
});

// function generateUniqueSessionId() {
//   return Math.random().toString(36).substring(2) + Date.now().toString(36);
// }

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server running on port: ", port);
});
