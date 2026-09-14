import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini if key exists
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "MeowLinux" });
});

// AI Mentor endpoint (Commander Whiskers)
app.post("/api/mentor", async (req, res) => {
  try {
    const { message, currentChallenge, terminalHistory, userCommand } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not configured
      const fallbackTips: Record<string, string> = {
        "pwd": "🐾 *Purr!* `pwd` stands for **Print Working Directory**. It tells you where your paws currently sit in the Linux filesystem hierarchy!",
        "ls": "🐾 *Meow!* Use `ls -la` to list all files, including hidden dotfiles (`.bashrc`), along with file permissions, owner, and sizes!",
        "cd": "🐾 *Head-bump!* `cd` changes directory. `cd ..` climbs up one branch, while `cd ~` or just `cd` leaps right back home to `/home/meow`.",
        "cat": "🐾 *Purr-fection!* `cat` (Concatenate) prints the contents of a file to your terminal screen. Try `cat /etc/os-release` or `cat secret.txt`!",
        "chmod": "🐾 *Scratch alert!* `chmod` modifies file permissions. Remember the octal paws: `4=read`, `2=write`, `1=execute`. So `chmod 755` gives `rwxr-xr-x`!",
        "grep": "🐾 *Hunter vision!* `grep` filters text matching a pattern. E.g., `grep -i 'error' /var/log/syslog` or pipe with `ps aux | grep nginx`.",
        "ps": "🐾 *Sniffing out processes!* `ps aux` displays every running process with user, PID, %CPU, %MEM, and command!",
        "kill": "🐾 *Pounce!* `kill -9 <PID>` sends SIGKILL to immediately terminate an unresponsive runaway process.",
        "tar": "🐾 *Wrapping yarn balls!* `tar -czvf archive.tar.gz /path` creates a compressed tape archive; `tar -xzvf archive.tar.gz` extracts it!",
        "systemctl": "🐾 *Catdministrator control!* `systemctl status <service>` inspects service state. Use `start`, `stop`, `restart`, `enable` for full control.",
      };

      const cmdFirstWord = userCommand ? userCommand.trim().split(" ")[0] : "";
      const relevantFallback = fallbackTips[cmdFirstWord] ||
        `🐾 **Commander Whiskers says:** "Keep your claws sharp! For challenge **${currentChallenge?.title || 'LPIC Challenge'}**: ${currentChallenge?.objective || 'Follow the task instructions'}. Try running \`help\` in the terminal or review the hints tab!"`;

      res.json({
        response: relevantFallback,
        isFallback: true,
      });
      return;
    }

    const systemInstruction = `You are Commander Whiskers, an elite feline Linux Master SysAdmin and Chief LPIC Proctor for MeowLinux.
You mentor human students through hands-on Linux terminal challenges based on LPIC certifications (Linux Essentials, LPIC-1 101/102, LPIC-2, LPIC-3).
Style & Tone:
- Enthusiastic, encouraging, wise, with charming subtle cat metaphors (paws, claws, cat-nap, purr, yarn, head-bumps).
- Technically rigorous and strictly accurate regarding Linux commands, flags, POSIX standards, file permissions, and LPIC exam best practices.
- Give constructive guidance, explain what commands do, explain flags, or diagnose mistakes from their terminal history.
- Do NOT just spit the exact answer immediately if they ask for a hint; guide them with the logic first, then provide example syntax. If they ask directly "how do I solve this?", provide the full command with breakdown.
- Keep responses concise (under 200 words), formatted cleanly with markdown bolding and backticks for commands.`;

    const prompt = `Current Mission: ${currentChallenge?.title || "Free Sandbox"}
LPIC Track: ${currentChallenge?.lpicLevel || "Linux General"}
Mission Objective: ${currentChallenge?.objective || "Exploring Linux"}
Target File/State: ${currentChallenge?.verificationTarget || "N/A"}
User's Last Command: ${userCommand || "None yet"}
Recent Terminal History:
${Array.isArray(terminalHistory) ? terminalHistory.slice(-4).map((h: any) => `$ ${h.cmd}\n${h.output}`).join("\n") : "None"}

Student Question or Context:
"${message || "Can you give me guidance on this challenge and explain the key LPIC concept?"}"`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = result.text || "🐾 *Mew!* I am contemplating the Linux kernel. Try inspecting the challenge objectives again!";
    res.json({
      response: responseText,
      isFallback: false,
    });
  } catch (error: any) {
    console.error("Mentor API error:", error);
    res.status(500).json({
      error: "Mentor is taking a quick cat-nap.",
      response: "🐾 *Mrow!* Commander Whiskers got momentarily distracted by a laser pointer. Review your challenge objective or run `help` to see available commands!",
      isFallback: true,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MeowLinux server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
