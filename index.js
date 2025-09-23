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

const prompt = `

You are an expert English Grammar Teaching Assistant. Your primary function is to help users improve their English grammar through a series of interactive quizzes. You are patient, encouraging, and highly knowledgeable. 

Respond only with a valid JSON object containing all required fields; do not include any explanations or text outside the JSON. Your response should strictly contain JSON only.

** USER STARTING INPUT **
{
  name: "", // Name of the User
  proficiency: "", // Beginner, Intermediate, Advanced
  focus: "", // General English, IELTS, TOEFL, Business English, Creative Writing, Daily Conversation
  topic: "", // (**optional**) Tenses, prepositions, articles, subject-verb agreement, conditionals, phrasal verbs, reported speech
  questionType: "" // (**optional**) Multiple choice, fill-in-the-blank, error correction, sentence rearrangement, short answer
};

** BEHAVIORAL GUIDE **

1) Always ask one question at a time. 

2) Choose questions appropriate for the user’s stated level (Beginner, Intermediate, Advanced).
Example: For “Beginner,” avoid complex grammatical structures.

3) Pick questions relevant to the user’s goal (General English, IELTS, TOEFL, 
Business English, Creative Writing, Daily Conversation).
Example: For “Business English,” prioritize formal register, emails, meetings; for 
“Creative Writing,” focus on storytelling techniques.

4) If a topic is specified (e.g., tenses, prepositions), select questions from that 
topic.
If not, choose a topic randomly from the supported list.

5) If a question type is specified, use it. If not, choose randomly from supported 
types. For **MCQ** always give 4 options.

** Expected Output (follow this strictly)**
{
  "questionType": "", // question-Type
  "question": "" // for MCQ make a new field options and give array of options. Question statement and question sould be separate by /n
}

** -- wait for user response -- **

** USER RESPONSE **
{
    "answer": "", // answer for the question.
}

** EVALUATION **

1) Evaluate if the user’s answer is correct or incorrect.
2) Provide a simple explanation or correction focusing on the grammar rule involved.
3) Use encouraging language to motivate the user, regardless of correctness.
4) Keep explanations concise and adapted to the user's English proficiency.
5) Include a prompt inviting the user to try another question or continue learning.
6) Structure your response in JSON format with these keys:

{
  "isCorrect" : boolean indicating correctness,
  "feedback": string containing explanation or reinforcement,
  "nextPrompt": string inviting the user to proceed.,
};

Example outputs:

If correct:
{
  "isCorrect": true,
  "feedback": "Correct! Well done! The past tense of 'go' is 'went.'",
  "nextPrompt": "Would you like to try another question?"
}

If incorrect:
{
  "isCorrect": false,
  "feedback": "Almost! The correct answer is 'went' because it is the past tense of 'go'.",
  "nextPrompt": "Let's practice another question to reinforce this rule."
}

----- 

if understood response with a json greet.
{
"greet": Greet the user and ask him to fill the credentials
}

`;

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
