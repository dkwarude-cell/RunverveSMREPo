"""
SmartHeal Assistant - conversational healthcare chatbot (Google ADK + Gemini).

How it works (RAG):
  1. The markdown files in chatbot/knowledge/ are split into small sections (chunks) when the agent starts.
  2. For every therapy / app / health question, the agent calls `search_knowledge_base` (Retrieval).
  3. Gemini writes the answer using the retrieved sections (Augmented Generation).
  4. If the knowledge base does not cover it, the agent can use Google Search or read a URL the user gives.

Medical reports: the app attaches a PDF or image (jpg/png/webp/heic) to the message as inline data.
Gemini reads the whole file itself (all pages), so no extra tool is needed - the rules are in INSTRUCTION.

To add knowledge: drop another .md file into chatbot/knowledge/ (use "## " headings), redeploy. No code changes.
"""

import math
import re
from pathlib import Path

from google.adk.agents import LlmAgent
from google.adk.tools import agent_tool, url_context
from google.adk.tools.google_search_tool import GoogleSearchTool

MODEL = "gemini-2.5-flash"
KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"


# ─────────────────────────── Knowledge base (RAG retriever) ───────────────────────────

STOPWORDS = set(
    "a an and are as at be by can do does for from how i in is it its me my of on or should "
    "that the this to use used using what when where which who why will with you your about "
    "much many any there their they them have has had was were been not get".split()
)

# small synonym list so everyday words still find the right section
SYNONYMS = {
    "tens": ["electrical", "electrode", "electrodes", "pads", "stimulation"],
    "electric": ["tens"],
    "current": ["tens", "intensity"],
    "heat": ["thermal", "warm", "temperature", "heating"],
    "hot": ["heat"],
    "warm": ["heat"],
    "vibration": ["vibrate", "massage", "frequency"],
    "massage": ["vibration"],
    "app": ["smartheal", "feature", "features", "tab"],
    "scan": ["photo", "image", "analysis", "camera"],
    "photo": ["scan", "image"],
    "bluetooth": ["device", "connect", "wearable"],
    "watch": ["device", "wearable"],
    "stats": ["activity", "charts", "progress"],
    "progress": ["stats", "trend"],
    "safe": ["safety", "contraindications", "avoid"],
    "danger": ["safety", "warning"],
    "pregnant": ["pregnancy"],
    "pacemaker": ["implanted", "implant"],
    "swollen": ["swelling"],
    "sprain": ["injury", "acute", "ligament"],
    "doctor": ["warning", "medical", "emergency"],
}


def _tokens(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    out = []
    for w in words:
        if w in STOPWORDS or len(w) < 2:
            continue
        if len(w) > 4 and w.endswith("s"):  # very small "stemmer": muscles -> muscle
            w = w[:-1]
        out.append(w)
    return out


def _load_chunks() -> list[dict]:
    """Split every knowledge file into sections at '## ' headings."""
    chunks = []
    for file in sorted(KNOWLEDGE_DIR.glob("*.md")):
        text = file.read_text(encoding="utf-8")
        title_match = re.search(r"^# (.+)$", text, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else file.stem
        for part in re.split(r"^## ", text, flags=re.MULTILINE)[1:]:
            heading, _, body = part.partition("\n")
            content = f"{title} > {heading.strip()}\n{body.strip()}"
            chunks.append(
                {
                    "source": f"{title} > {heading.strip()}",
                    "content": content,
                    "tokens": set(_tokens(content)),
                    "heading_tokens": set(_tokens(title + " " + heading)),
                }
            )
    return chunks


CHUNKS = _load_chunks()
# inverse document frequency: rare words count more than common ones
_DF: dict[str, int] = {}
for _c in CHUNKS:
    for _t in _c["tokens"]:
        _DF[_t] = _DF.get(_t, 0) + 1
IDF = {t: math.log(1 + len(CHUNKS) / df) for t, df in _DF.items()}


def search_knowledge_base(query: str) -> dict:
    """Searches the SmartHeal knowledge base (heat, vibration and TENS therapy guidelines,
    safety rules, general injury recovery advice, and the SmartHeal app's features).

    Args:
        query: What to look up, in plain words, e.g. "TENS settings for chronic back pain"
            or "how do I connect my device".

    Returns:
        A dict with 'results': the most relevant knowledge sections (source + content).
    """
    words = _tokens(query)
    expanded = set(words)
    for w in words:
        expanded.update(_tokens(" ".join(SYNONYMS.get(w, []))))

    scored = []
    for chunk in CHUNKS:
        score = 0.0
        for w in expanded:
            weight = 1.0 if w in words else 0.5  # synonyms count half
            if w in chunk["tokens"]:
                score += IDF.get(w, 0) * weight
            if w in chunk["heading_tokens"]:
                score += IDF.get(w, 0) * weight  # heading match counts double
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [{"source": c["source"], "content": c["content"]} for _, c in scored[:4]]
    if not top:
        return {"results": [], "note": "Nothing found in the SmartHeal knowledge base for this query."}
    return {"results": top}


# ─────────────────────────── Helper agents (as tools) ───────────────────────────
# Google Search can't be mixed with other tools in one agent, so each lives in its own small agent.

google_search_agent = LlmAgent(
    name="google_search_agent",
    model=MODEL,
    description="Searches the web for up-to-date or general health information not in the SmartHeal knowledge base.",
    instruction=(
        "Use Google Search to answer the request. Prefer trusted medical sources "
        "(WHO, NHS, Mayo Clinic, MedlinePlus, NIH, CDC, peer-reviewed journals). "
        "Return a short factual summary and name the sources you used."
    ),
    tools=[GoogleSearchTool()],
)

url_context_agent = LlmAgent(
    name="url_context_agent",
    model=MODEL,
    description="Reads and summarises the content of a web page when the user shares a URL.",
    instruction="Use the URL context tool to read the given URL(s) and return a short, accurate summary of the relevant content.",
    tools=[url_context],
)


# ─────────────────────────── Main chatbot ───────────────────────────

INSTRUCTION = """
You are SmartHeal Assistant, the friendly in-app chatbot of the SmartHeal app by Runverve.
You are a healthcare assistant specialised in muscle and joint pain, injury recovery, and
heat, vibration and TENS therapy. You also know the SmartHeal app inside out.

HOW TO ANSWER
1. For ANY question about heat, vibration or TENS therapy, therapy settings, safety, pain,
   injuries, recovery, or the SmartHeal app and its features: call `search_knowledge_base` FIRST
   and base your answer on what it returns. These are the official SmartHeal guidelines -
   never contradict them (e.g. the heat, vibration and TENS ranges).
2. If the knowledge base has nothing useful, or the question is general health / needs current
   information, use `google_search_agent`. Mention the source briefly (e.g. "according to the NHS").
3. If the user shares a link, use `url_context_agent` to read it.
4. For greetings and small talk, just reply naturally - no tools needed.

GUIDE USERS TO THE APP
SmartHeal has these tabs in the bottom dock: Home, AI Scan, Device, Stats, Assistant
(plus Profile, Settings and About in the menu). When it helps, point the user to the right one,
for example:
- Unsure what therapy or settings to use, or has a visible injury -> suggest the AI Scan tab
  (photo + a few questions -> personal heat/vibration/TENS plan).
- Wants to use or check their wearable -> the Device tab.
- Wants to see their progress -> the Stats tab.
Suggest a feature only when it is relevant - at most one suggestion per reply, never pushy.

SAFETY RULES (always)
- You are not a doctor. Do not diagnose. Use careful language ("may", "could be", "often").
- Check contraindications before recommending a therapy (e.g. no TENS with a pacemaker or over
  the front of the neck; no heat on a fresh injury, open wound or numb skin).
- If the user describes an emergency or red-flag symptom (chest pain, trouble breathing,
  stroke signs, severe bleeding, suspected fracture or deformity, loss of feeling, high fever
  with a hot swollen joint, thoughts of self-harm), tell them to seek medical help right away -
  call 112 in India or their local emergency number - before anything else.
- When you give therapy settings or medical advice, end with one short line:
  "This isn't a substitute for a doctor - please consult one if pain persists or gets worse."
  Do not add it to small talk or simple app questions.

STAY ON TOPIC
- You help with health, wellness, fitness, recovery and the SmartHeal app. For unrelated
  requests (coding, homework, politics...), say politely in one line that you're SmartHeal's
  health assistant and offer to help with their recovery instead.
- Never mention tools, "knowledge base", "search results" or how you work internally.

MEDICAL REPORTS (when the user attaches a PDF or an image of a document)
- Read the WHOLE report: every page, table, value, reference range, findings and impression.
- If it is not a medical document, or it is blurry, cut off or unreadable, say so and ask for a
  clearer photo or the PDF. Never guess or invent values that are not visible.
- Do not repeat personal identifiers (patient name, ID, address, phone) back to the user.
- Reply in this order, using **bold labels** (not headings):
  **Report:** type of report (e.g. Complete Blood Count, Lipid Profile, X-ray of the knee,
    MRI lumbar spine) and the date if shown.
  **Summary:** 1-2 plain-language lines on the overall picture.
  **Key findings:** bullet each abnormal or important result with its value, the reference range
    and whether it is **High** or **Low**. For scans, explain the radiologist's findings and
    impression in simple words. If everything is within range, say so clearly.
  **What it may mean:** possible explanations in careful language - never a diagnosis.
  **Therapy note:** whether heat, vibration or TENS look suitable or should be avoided given the
    findings (e.g. fracture, blood clot/DVT, active inflammation or infection, pregnancy,
    implants or pacemaker, nerve damage). Check `search_knowledge_base` for the safety rules.
  **Next steps:** which doctor or specialist to show it to, 2-3 questions worth asking them,
    and simple lifestyle tips if relevant.
- If any result looks critical or urgent (e.g. a fracture, very low haemoglobin, very high or low
  potassium or blood sugar, signs of serious infection), say so first and advise seeing a doctor today.
- Report answers may be longer than normal chat replies (up to about 15 short lines), but keep
  them in bullets and plain words. End with the doctor disclaimer and invite follow-up questions.
- If the user sends a photo of an injury (not a document), give brief guidance and suggest the
  AI Scan tab for a full analysis with device settings.

STYLE (this is shown in a mobile chat bubble)
- Warm, clear and short: usually 2-6 short lines or a few bullet points.
- Use **bold** for key settings and terms, and "-" bullets for lists.
- Do NOT use # headings, tables or code blocks.
- Ask one short follow-up question when you need details (e.g. where the pain is, how long,
  recent injury or long-term) before giving specific settings.
- The app already shows a welcome message, so never introduce yourself again - just answer.
"""

root_agent = LlmAgent(
    name="smartheal_assistant",
    model=MODEL,
    description="SmartHeal's healthcare chatbot: heat, vibration and TENS therapy expert, general health helper and app guide.",
    instruction=INSTRUCTION,
    tools=[
        search_knowledge_base,
        agent_tool.AgentTool(agent=google_search_agent),
        agent_tool.AgentTool(agent=url_context_agent),
    ],
)