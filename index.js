import { GoogleGenAI } from "@google/genai";
import express from "express";
import session from "express-session";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  session({
    secret: "24f1000209",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // keep false for localhost HTTP; true for HTTPS in prod
      sameSite: "lax", // or 'none' if using secure: true and HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    },
  })
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use((req, res, next) => {
  if (!req.session.chatKey) {
    req.session.chatKey = generateUniqueSessionId();
    req.session.messages = [];
  }
  next();
});

const googleApiKey = process.env.GOOGLEAPI;

const { models } = new GoogleGenAI({
  apiKey: googleApiKey,
});

async function aiCall(prompt) {
  const response = await models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  console.log(response.text);
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
    const manual = fs.readFileSync("./aiManual.txt", "utf-8");
    initializeChat(req);
    updateChat(req, "admin", manual);
    const prompt = JSON.stringify(req.session.messages);
    const aiRes = await aiCall(prompt);

    // updating the chat
    const aiResData = JSON.parse(aiRes);
    updateChat(req, "assistant", aiResData);
    console.log(req.session.messages);
    req.session.save();
    res.status(200).json({ aiResData });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error });
  }
});

app.post("/interact", async (req, res) => {
  try {
    const data = req.body;
    updateChat(req, "user", data);
    const prompt = JSON.stringify(req.session.messages);
    const aiRes = await aiCall(prompt);
    const aiResData = JSON.parse(aiRes);
    console.log(aiResData);
    updateChat(req, "assistant", aiResData);
    res.status(200).json({ aiResData });
  } catch (error) {
    res.status(500).json({ error });
    console.log(error);
  }
});

function generateUniqueSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server running on port: ", port);
});
