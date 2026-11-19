require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "40kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    provider: "NVIDIA",
    configured: Boolean(process.env.NVIDIA_API_KEY),
    model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct"
  });
});

app.post("/api/generate", async (req, res) => {
  const { idea, age = "4-8", style = "gentle adventure" } = req.body || {};
  if (typeof idea !== "string" || idea.trim().length < 3 || idea.length > 1000) {
    return res.status(400).json({ error: "اكتب فكرة للقصة من 3 إلى 1000 حرف." });
  }
  if (!process.env.NVIDIA_API_KEY) {
    return res.status(503).json({ error: "NVIDIA API غير مربوط بعد. أضف NVIDIA_API_KEY في متغيرات Railway." });
  }

  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
  const base = (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
  const system = [
    "You are WonderTales Studio, an expert children's story writer and bilingual adaptation editor.",
    "Create original, safe, age-appropriate stories for children. No frightening violence, dangerous instructions, or copyrighted characters.",
    "The recurring cast must remain visually consistent: Foxy is an orange fox with a green backpack; Bobo is a small blue dragon; Pip is a little yellow bird. Their home is Wonder Forest.",
    "Write a natural English version for WonderTales Kids and a separate simple Modern Standard Arabic version for عالم الحكايات. Do not translate mechanically.",
    "Return ONLY valid JSON with this schema: {title_en,title_ar,moral_en,moral_ar,characters:[{name,description}],english:{narration,scenes:[{number,visual,narration,dialogue}]},arabic:{narration,scenes:[{number,visual,narration,dialogue}]}}.",
    "Use 5 to 7 scenes. Each visual is a concise image/video prompt and preserves character appearance. Narration should be suitable for a 2-3 minute episode."
  ].join(" ");

  try {
    const upstream = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.NVIDIA_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: "Story idea: " + idea.trim() + "\nTarget age: " + age + "\nStyle: " + style }],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 5000,
        stream: false
      })
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      return res.status(502).json({ error: "NVIDIA API returned " + upstream.status + ". راجع اسم الموديل ومفتاح API وإتاحته." });
    }
    let payload;
    try { payload = JSON.parse(raw); } catch { return res.status(502).json({ error: "استجابة NVIDIA غير مفهومة." }); }
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: "NVIDIA لم تُرجع نص القصة." });
    const cleaned = content.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    let story;
    try { story = JSON.parse(cleaned); } catch { return res.status(502).json({ error: "تعذر قراءة القصة كبيانات منظمة. جرّب مرة أخرى." }); }
    return res.json({ ok: true, model, story });
  } catch (err) {
    console.error("Generation error:", err.message);
    return res.status(500).json({ error: "حصل خطأ أثناء الاتصال بخدمة NVIDIA." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log("WonderTales Studio listening on " + PORT));
