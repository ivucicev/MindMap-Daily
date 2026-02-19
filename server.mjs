import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const getClient = () => {
  if (!apiKey) {
    const error = new Error("Server missing OPENAI_API_KEY");
    error.status = 500;
    throw error;
  }
  return new OpenAI({ apiKey });
};

app.post("/api/interest-suggestions", async (req, res) => {
  try {
    const currentInterests = Array.isArray(req.body?.currentInterests) ? req.body.currentInterests : [];
    if (currentInterests.length === 0) return res.json([]);

    const client = getClient();
    const prompt = `Based on these interests: ${currentInterests.join(", ")}, suggest 5 related areas of study, books, or niche topics.
Focus on high-growth fields, psychological frameworks, or influential books.
Return JSON as: {"suggestions": ["item1", "item2", "..."]}.`;

    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a helpful assistant. Always respond with JSON." },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    res.json(Array.isArray(parsed?.suggestions) ? parsed.suggestions : []);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).send("Failed to generate suggestions.");
  }
});

app.post("/api/lesson", async (req, res) => {
  try {
    const { targetCategory, allInterests, previousLesson } = req.body || {};
    if (!targetCategory || !Array.isArray(allInterests)) {
      return res.status(400).send("Invalid request.");
    }

    const client = getClient();
    const prompt = `Generate a daily micro-lesson for the category: "${targetCategory}".

CORE MISSION:
The "content" and "practicalApplication" MUST focus 100% on "${targetCategory}". Do NOT mention or blend in other interests like ${allInterests.filter(i => i !== targetCategory).join(", ")} inside the main content.

INTERDISCIPLINARY CONNECTION (Separate Section):
Only in the "connectionToPrevious" field, briefly explain how this topic might tangentially relate to the previous lesson: "${previousLesson?.title || "None"}".

REQUIREMENTS:
- Title: Catchy and academic.
- Content: Deep-dive into a specific concept of ${targetCategory}.
- Practical Application: How to use this specific ${targetCategory} concept in real life.
- Connection: A separate bridge to the previous theme.

Return JSON with keys: title, category, content, practicalApplication, connectionToPrevious, sourceMaterial (string, can be empty).`;

    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a helpful assistant. Always respond with JSON." },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    res.json({
      ...data,
      categoryRef: targetCategory,
      id: Math.random().toString(36).substring(7),
      date: new Date().toLocaleDateString()
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).send("Failed to generate lesson.");
  }
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).send("Not found");
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`MindMap server listening on ${port}`);
});
