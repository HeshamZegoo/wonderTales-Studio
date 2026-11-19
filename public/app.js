const $ = (id) => document.getElementById(id);
let currentStory = null;
async function checkStatus() {
  try {
    const r = await fetch("/api/status");
    const s = await r.json();
    $("apiState").textContent = s.configured ? "NVIDIA متصل · " + s.model : "بانتظار ربط NVIDIA";
    $("apiState").style.color = s.configured ? "#62d6d0" : "#ffd17a";
  } catch { $("apiState").textContent = "الخادم غير متاح"; }
}
function showScenes(target, scenes) {
  const root = $(target); root.replaceChildren();
  (scenes || []).forEach((scene) => {
    const item = document.createElement("div"); item.className = "scene";
    const heading = document.createElement("b"); heading.textContent = "المشهد " + scene.number;
    const visual = document.createElement("p"); visual.textContent = "🎬 " + (scene.visual || "");
    const narration = document.createElement("p"); narration.textContent = scene.narration || "";
    item.append(heading, visual, narration); root.append(item);
  });
}
function renderStory(s) {
  currentStory = s;
  $("titleEn").textContent = s.title_en || "WonderTales Kids";
  $("titleAr").textContent = s.title_ar || "عالم الحكايات";
  $("moralEn").textContent = s.moral_en || "";
  $("moralAr").textContent = s.moral_ar || "";
  $("narrationEn").textContent = s.english?.narration || "";
  $("narrationAr").textContent = s.arabic?.narration || "";
  showScenes("scenesEn", s.english?.scenes);
  showScenes("scenesAr", s.arabic?.scenes);
  $("results").hidden = false;
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("generate").addEventListener("click", async () => {
  const idea = $("idea").value.trim();
  $("error").textContent = "";
  if (idea.length < 3) { $("error").textContent = "اكتب فكرة القصة الأول."; return; }
  const btn = $("generate"); btn.disabled = true; btn.textContent = "جاري تأليف النسختين…";
  try {
    const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, age: $("age").value, style: $("style").value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "تعذر إنشاء القصة.");
    renderStory(data.story);
  } catch (e) { $("error").textContent = e.message || "حدث خطأ غير متوقع."; }
  finally { btn.disabled = false; btn.textContent = "✦ أنشئ الحلقة باللغتين"; }
});
function storyText(language) {
  const part = currentStory?.[language]; if (!part) return "";
  return [part.narration || "", ...(part.scenes || []).map(x => "المشهد " + x.number + "\n" + (x.visual || "") + "\n" + (x.narration || ""))].join("\n\n");
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { const el = document.createElement("textarea"); el.value = text; document.body.append(el); el.select(); const ok = document.execCommand("copy"); el.remove(); return ok; }
}
$("copyEn").addEventListener("click", () => copy(storyText("english")));
$("copyAr").addEventListener("click", () => copy(storyText("arabic")));
$("copyAll").addEventListener("click", () => copy("ENGLISH\n" + storyText("english") + "\n\nالعربية\n" + storyText("arabic")));
checkStatus();
