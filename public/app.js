const $ = (id) => document.getElementById(id);
let currentStory = null;
const HISTORY_KEY = "wondertales.storyHistory.v1";

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
    const copyPrompt = document.createElement("button"); copyPrompt.className = "scene-copy";
    copyPrompt.textContent = "نسخ وصف المشهد";
    copyPrompt.addEventListener("click", () => copy(scene.visual || ""));
    item.append(heading, visual, narration, copyPrompt); root.append(item);
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
function storyText(language) {
  const part = currentStory?.[language]; if (!part) return "";
  return [part.narration || "", ...(part.scenes || []).map(x =>
    "المشهد " + x.number + "\nوصف بصري: " + (x.visual || "") + "\nالسرد: " + (x.narration || "") + "\nالحوار: " + (x.dialogue || "")
  )].join("\n\n");
}
function allStoryText(s = currentStory) {
  if (!s) return "";
  const old = currentStory; currentStory = s;
  const result = "WONDERTALES KIDS — " + (s.title_en || "") + "\n\n" + storyText("english") +
    "\n\nعالم الحكايات — " + (s.title_ar || "") + "\n\n" + storyText("arabic");
  currentStory = old; return result;
}
async function copy(value) {
  try { await navigator.clipboard.writeText(value); return true; }
  catch {
    const el = document.createElement("textarea"); el.value = value;
    document.body.append(el); el.select(); const ok = document.execCommand("copy"); el.remove(); return ok;
  }
}
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory() {
  if (!currentStory) return;
  const entry = { id: Date.now(), savedAt: new Date().toISOString(), idea: $("idea").value.trim(), story: currentStory };
  const history = [entry, ...getHistory().filter(x => x.story?.title_en !== entry.story.title_en)].slice(0, 15);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  $("saveState").textContent = "اتحفظت على الجهاز";
}
function renderHistory() {
  const root = $("historyList"); if (!root) return;
  root.replaceChildren();
  const history = getHistory();
  if (!history.length) { root.textContent = "الحلقات المحفوظة هتظهر هنا على نفس الجهاز."; return; }
  history.forEach(entry => {
    const row = document.createElement("div"); row.className = "history-item";
    const open = document.createElement("button"); open.className = "history-open";
    open.textContent = entry.story?.title_ar || entry.story?.title_en || "حلقة محفوظة";
    open.addEventListener("click", () => { $("idea").value = entry.idea || ""; renderStory(entry.story); });
    const date = document.createElement("small"); date.textContent = new Date(entry.savedAt).toLocaleDateString("ar-EG");
    row.append(open, date); root.append(row);
  });
}
function downloadText() {
  if (!currentStory) return;
  const blob = new Blob(["\uFEFF" + allStoryText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = "WonderTales-" + Date.now() + ".txt"; a.click();
  URL.revokeObjectURL(url);
}
$("generate").addEventListener("click", async () => {
  const idea = $("idea").value.trim();
  $("error").textContent = ""; $("saveState").textContent = "";
  if (idea.length < 3) { $("error").textContent = "اكتب فكرة القصة الأول."; return; }
  const btn = $("generate"); btn.disabled = true; btn.textContent = "جاري تأليف النسختين…";
  try {
    const response = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, age: $("age").value, style: $("style").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "تعذر إنشاء القصة.");
    renderStory(data.story);
  } catch (e) { $("error").textContent = e.message || "حدث خطأ غير متوقع."; }
  finally { btn.disabled = false; btn.textContent = "✦ أنشئ الحلقة باللغتين"; }
});
$("copyEn").addEventListener("click", () => copy(storyText("english")));
$("copyAr").addEventListener("click", () => copy(storyText("arabic")));
$("copyAll").addEventListener("click", () => copy(allStoryText()));
$("saveStory").addEventListener("click", saveHistory);
$("downloadStory").addEventListener("click", downloadText);
checkStatus(); renderHistory();
