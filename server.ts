import "dotenv/config";
import express from "express";
import Groq from "groq-sdk";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  // Render provides the PORT dynamically. Default to 3000 for local dev.
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Initialize Groq inside the function to ensure process.env is ready
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // CORS is required to allow your Netlify frontend to access this Render backend
  app.use(cors());
  app.use(express.json());

  // Health check route
  app.get("/", (req, res) => {
    res.send("Campus AI Server is Running!");
  });

  // API route
  app.post("/api/chat", async (req, res) => {
    const { messages, systemInstruction } = req.body;

    try {
      console.log("Using Groq API fallback...");
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      console.log("Groq success!");
      return res.json({
        text: chatCompletion.choices[0]?.message?.content || "",
        provider: "groq",
      });
    } catch (groqError: any) {
      console.error("Groq API Error:", groqError.message || groqError);
      return res.status(500).json({
        error: "Groq API failed. Check Render Environment Variables.",
      });
    }
  });

  // Serve static files in production
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();