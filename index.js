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
    origin: "*",
  })
);

const googleApiKey = process.env.GOOGLEAPI;

const { models } = new GoogleGenAI({
  apiKey: googleApiKey,
});

// Read manual once at startup so every prompt includes it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manual = fs.readFileSync(path.join(__dirname, "aiManual.txt"), "utf-8");

async function aiCall(prompt) {
  const response = await models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // Disable thinking — eliminates thoughtSignature warning
      },
    },
  });
  console.log(response.text);
  return response.text;
}

// GET / — send manual so AI returns greeting JSON
app.get("/", async (req, res) => {
  try {
    const prompt = manual;
    const aiRes = await aiCall(prompt);
    const aiResData = JSON.parse(aiRes);
    return res.status(200).json({ aiResData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
});

app.post("/interact", async (req, res) => {
  try {
    const { history = [], message } = req.body;

    const historyText = history
      .map((entry) => `${entry.role.toUpperCase()}: ${JSON.stringify(entry.content)}`)
      .join("\n");

    const prompt = historyText
      ? `${manual}\n\n${historyText}\nUSER: ${JSON.stringify(message)}`
      : `${manual}\n\nUSER: ${JSON.stringify(message)}`;

    console.log(prompt)

    const aiRes = await aiCall(prompt);
    const aiResData = JSON.parse(aiRes);
    console.log(aiResData);
    return res.status(200).json({ aiResData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
});

// function generateUniqueSessionId() {
//   return Math.random().toString(36).substring(2) + Date.now().toString(36);
// }

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server running on port: ", port);
});
