import { useState, useEffect, useRef } from "react";

const USD_TO_INR = 84;
const STORAGE_KEY = "afd_v4";

const PLATFORM_DATA = {
  "Make.com": { free: "1,000 ops/mo · 2 scenarios", paid: "$9/mo (Core)", paidINR: "₹756/mo", verdict: "freemium" },
  "Zapier": { free: "100 tasks/mo · unlimited Zaps", paid: "$19.99/mo (Starter)", paidINR: "₹1,679/mo", verdict: "limited" },
  "n8n (self-hosted)": { free: "Unlimited (Community Edition)", paid: "Cloud from $24/mo", paidINR: "₹2,016/mo (Cloud)", verdict: "freemium" },
  "Relevance AI": { free: "200 Actions/mo + $2 credits", paid: "$19/mo (Team)", paidINR: "₹1,596/mo", verdict: "freemium" },
  "Voiceflow": { free: "2 agents · limited msgs", paid: "$50/mo (Pro)", paidINR: "₹4,200/mo", verdict: "freemium" },
  "Langflow": { free: "Open source · self-hosted", paid: "Cloud varies", paidINR: "Varies", verdict: "freemium" },
  "Vertex AI Agent Builder": { free: "GCP trial $300 credits", paid: "Pay-per-use GCP", paidINR: "Pay-per-use", verdict: "paid" },
  "None (Direct LLM)": { free: "No platform needed", paid: "LLM API only", paidINR: "LLM only", verdict: "freemium" },
};

const LLM_DATA = {
  "Claude Opus 4.6": { in: 5.00, out: 25.00, cliff: null, note: "Flat — no long-context premium" },
  "Claude Sonnet 4.6": { in: 3.00, out: 15.00, cliff: null, note: "Flat — no long-context premium" },
  "GPT-5.4": { in: 2.50, out: 15.00, cliff: 272000, cIn: 5.00, cOut: 22.50, note: "2× above 272K tokens" },
  "GPT-5.4 Mini": { in: 0.75, out: 4.50, cliff: null, note: "Budget mid-tier" },
  "GPT-5.4 Nano": { in: 0.20, out: 1.25, cliff: null, note: "Ultra-budget" },
  "Gemini 3.1 Pro": { in: 2.00, out: 12.00, cliff: 200000, cIn: 4.00, cOut: 18.00, note: "2× above 200K tokens" },
  "Gemini 2.5 Flash": { in: 0.15, out: 0.60, cliff: null, note: "Fast and cheap" },
  "Gemini 3.1 Flash-Lite": { in: 0.25, out: 1.50, cliff: null, note: "Ultra-budget 2026" },
};

const PAYLOAD_TOKENS = {
  "Short (1 page / ~500 words)": { in: 500, out: 300 },
  "Medium (5–20 pages)": { in: 8000, out: 1500 },
  "Long (50–200 pages)": { in: 80000, out: 4000 },
  "Very large (200+ pages / codebases)": { in: 400000, out: 7000 },
};

const TASK_COLORS = {
  "Trigger": "#6366f1", "Data Fetch": "#0ea5e9", "Research": "#10b981",
  "Analysis": "#8b5cf6", "Content Generation": "#f59e0b", "Decision": "#ec4899",
  "Data Transform": "#14b8a6", "Output": "#64748b"
};

const APPROACH_ICONS = {
  "Direct LLM Usage": "⚡", "LLM Skill / Prompt Template": "📝",
  "Scheduled Automation": "🔄", "Full Autonomous Agent": "🤖"
};

const VERDICTS = {
  "Freemium sufficient": { color: "#22c55e", icon: "🟢" },
  "Freemium to start upgrade likely": { color: "#f59e0b", icon: "🟡" },
  "Paid required": { color: "#ef4444", icon: "🔴" }
};

const INR = (usd) => `₹${Math.round(usd * USD_TO_INR).toLocaleString("en-IN")}`;

const PROGRESS_STAGES = {
  clarify: [
    { label: "Reading your use case…", est: 3 },
    { label: "Identifying key requirements…", est: 4 },
    { label: "Preparing clarifying questions…", est: 5 },
  ],
  generate: [
    { label: "Analysing your answers…", est: 3 },
    { label: "Decomposing use case into tasks…", est: 5 },
    { label: "Matching tools and platforms…", est: 5 },
    { label: "Checking tool availability and gaps…", est: 4 },
    { label: "Calculating cost estimates in INR…", est: 3 },
    { label: "Building detailed flow blueprint…", est: 6 },
  ],
};

// ──────────────── PROMPTS ────────────────

const CLARIFY_PROMPT = `You are an expert AI automation consultant. Generate 5–10 clarifying questions for this user's automation use case.

RULES:
- Minimum 5, maximum 10 questions. Plain English, zero jargon.
- Mark multiSelect:true if multiple options apply; false for single choice. maxSelections:3 for multi.
- ALWAYS include a question about payload/document size if use case involves documents, emails, or data
- ALWAYS include a question about which specific tools/software they already use (relevant to their use case) — give them 8–12 specific tool options as checkboxes relevant to the use case
- ALWAYS include a question about data privacy/connection constraints: "Which of the following tools would your company/you NOT allow to connect to a third-party AI service?" — list the same tools from the tool question. This is critical for security-conscious users.
- Also ask about: data sources, output destination, trigger type, frequency, existing integrations
- Order: most impactful first

User intake: {INTAKE}

Return ONLY valid JSON:
{"questions":[{"id":1,"question":"text","options":["opt1","opt2"],"multiSelect":false,"maxSelections":1,"allowOther":true,"required":true}]}`;

const SYSTEM_PROMPT = `You are an expert, unbiased AI automation consultant. Your LLM recommendations are grounded in a verified 33-parameter comparison analysis and a comprehensive user-category intelligence report (April 2026). You MUST follow the intelligence rules below exactly.

═══════════════════════════════════════════════
PART 1 — THE THREE GOLDEN RULES (always apply first)
═══════════════════════════════════════════════
Rule 1: If the task involves WRITING anything important → Claude Opus 4.6 (or Sonnet 4.6 for budget)
  Covers: proposals, reports, emails, LinkedIn posts, legal briefs, compliance docs, SOPs, JDs, newsletters, creative content, board decks, cold outreach
  Why: Industry leader writing quality (1633 GDPval Elo), lowest hallucination rate, most natural prose

Rule 2: If the task requires REAL-TIME or CURRENT information → Gemini 3.1 Pro
  Covers: competitor research, market signals, regulatory alerts, live pricing, recent news, company research, salary benchmarks, travel planning, finding local venues
  Why: Native Google Search grounding — structural advantage no other LLM has

Rule 3: If the task involves DATA, IMAGES, or needs SPEED → GPT-5.4
  Covers: Excel/spreadsheet analysis, financial modelling, campaign data, image generation, PowerPoint (Microsoft 365), rapid prototyping, browser automation
  Why: Excellent Advanced Data Analysis (executes Python), native DALL-E/GPT Image, fastest TTFT 1-3s, Microsoft 365 Copilot native

═══════════════════════════════════════════════
PART 2 — TASK-TYPE → LLM MAPPING (verified intelligence)
═══════════════════════════════════════════════
ALWAYS USE CLAUDE OPUS 4.6 (or Sonnet 4.6 budget) FOR:
- Writing client proposals, RFP responses, pitch decks content
- Writing emails, follow-ups, client communications
- Writing long-form content: blogs, whitepapers, thought leadership
- Writing job descriptions, HR policies, offer letters, employee handbooks
- Writing investor memos, board presentations narrative, annual report summaries
- Writing legal briefs, opinions, compliance reports
- Writing project status reports, MOM, SOPs, process documentation
- Writing course content, curriculum, training materials
- Writing cold outreach sequences
- Reading and synthesising long documents: contracts, annual reports, regulatory filings, RFPs
- Reading and summarising legal documents, court judgements
- Reading and analysing large codebases
- Screening and summarising candidate profiles / resumes
- Complex coding, debugging, architecture review
- Building AI agents, MCP workflows, RAG systems
- Risk assessment and mitigation planning
- Customer discovery synthesis from interview transcripts
- Brand voice definition and messaging frameworks
- Security threat analysis and compliance documentation
- Credit risk document analysis and underwriting
- Customer onboarding automation (MCP integration)
- Personal: creative writing, storytelling, LinkedIn profile building

ALWAYS USE GEMINI 3.1 Pro FOR:
- Real-time company/competitor research before sales calls
- Market intelligence, industry trends, macro signals
- Regulatory intelligence: RBI, SEBI, IRDAI, SEC circulars (real-time)
- Salary benchmarking research (Glassdoor, AmbitionBox, LinkedIn Salary)
- Scientific literature review, synthesis across research papers
- Searching for recent studies, clinical trials, latest papers
- Medical literature and clinical guidelines (finding phase)
- Video analysis, video summarisation (ONLY LLM with native video — up to 20GB)
- Video-based property marketing, virtual tour analysis
- Video lecture summarisation for EdTech
- Research for content: finding data, trends, angles
- Travel planning: real-time visa, flights, hotel prices, local recommendations
- Finding restaurants, local venues, real-time opening hours
- IT staying current on tech developments
- Competitive pricing intelligence (real-time web scraping)
- Academic publishing research synthesis
- Personal: travel logistics during fundraising roadshows

ALWAYS USE GPT-5.4 (or Mini/Nano for budget) FOR:
- Excel financial modelling, DCF, unit economics, CAC/LTV, runway analysis
- Spreadsheet analysis: budget vs actuals, pipeline health, conversion trends
- Campaign performance analysis: Google Ads, Meta, GA4 data
- Any task requiring chart/graph generation from data
- Image generation for thumbnails, ad creatives, social graphics
- PowerPoint deck building (Microsoft 365 Copilot native)
- Browser automation, GUI testing, computer use tasks
- CRM data analysis from exported CSV files
- YouTube/podcast performance data analysis
- Rapid prototyping where speed of iteration is critical
- Review analysis and sentiment monitoring from datasets
- Demand forecasting from sales data
- Personal: expense tracking apps, comparing travel packages via spreadsheet

GEMINI FOR FINDING + CLAUDE FOR READING (combined tasks):
- Medical literature review: Gemini finds latest papers → Claude synthesises and writes
- Regulatory compliance: Gemini for real-time alerts → Claude for deep document reading
- Research synthesis for publishing: Gemini finds sources → Claude writes the synthesis

SPECIAL CASES:
- Presentation content + formatting: Claude for narrative → GPT-5.4 for PPT (Microsoft) OR Gemini for Google Slides
- Market intelligence + report: Gemini for research → Claude for writing the report
- Data analysis + executive summary: GPT for analysis → Claude for writing summary

═══════════════════════════════════════════════
PART 3 — USER-TYPE AWARE CONTEXT (from intake form)
═══════════════════════════════════════════════
Engineering Student → Primary: Claude (coding/docs), Secondary: Gemini (research)
Commerce/Finance Student → Primary: Claude (case studies/writing), Secondary: GPT (Excel/models)
Science Student → Primary: Gemini (lit review/research), Secondary: Claude (thesis writing)
Arts/Law/Journalism Student → Primary: Claude (writing/essays/long docs), Secondary: Gemini (fact-checking)
Sales Professional → Primary: Claude (proposals/emails), Secondary: Gemini (prospect research)
Marketing Professional → Primary: Claude (content/copy), Secondary: GPT (campaign data/images)
Operations/Project Manager → Primary: Claude (reports/SOPs/automation), Secondary: GPT (Excel)
HR Professional → Primary: Claude (JDs/policies/screening), Secondary: Gemini (salary benchmarks)
Finance Professional → Primary: GPT (modelling/Excel), Secondary: Claude (long doc reading)
CEO / Founder → Primary: Claude (writing/strategy/automation), Secondary: Gemini (market intel)
CTO / CIO → Primary: Claude (architecture/coding/MCP), Secondary: GPT (computer use/testing)
CMO → Primary: Claude (brand voice/briefs), Secondary: Gemini (competitive intel)
CFO → Primary: Claude (compliance/long docs), Secondary: GPT (financial modelling)
IT Enterprise → Primary: Claude (RAG/codebase/security), Secondary: Gemini (cost-efficient volume)
Retail Enterprise → Primary: GPT (data/visuals), Secondary: Claude (copy/automation)
Hospitality Enterprise → Primary: Claude (guest comms), Secondary: Gemini (video/pricing intel)
Education Enterprise → Primary: Gemini (video lectures/research), Secondary: Claude (content writing)
Financial Services → Primary: Claude (compliance/risk/long docs), Secondary: Gemini (regulatory alerts)
Startup → Primary: Claude (build/write/automate), Secondary: Gemini (market research), Tertiary: GPT (financial models)
Builder/Tinkerer → Primary: Claude (agents/coding/RAG), Secondary: GPT (speed/computer use)
Freelancer/Consultant → Primary: Claude (deliverables/automation), Secondary: Gemini (client research)
Content Creator → Primary: Claude (writing/newsletters), Secondary: Gemini (research + video)
Healthcare/Legal → Primary: Claude (long docs/compliance — non-negotiable for accuracy), Secondary: Gemini (real-time intel)

═══════════════════════════════════════════════
PART 4 — CRITICAL: PER-TASK LLM ASSIGNMENT
═══════════════════════════════════════════════
IMPORTANT: Each task in the flow gets its OWN LLM assignment. Do NOT assign the same LLM to all tasks.
The "primaryLLM" field is the LLM used for the MAJORITY of tasks or the most critical task.
Example of a sales automation flow:
  Task 1 (Research prospects) → llm: "Gemini 3.1 Pro" [real-time research]
  Task 2 (Analyse prospect data) → llm: "GPT-5.4" [data analysis]
  Task 3 (Write personalised email) → llm: "Claude Sonnet 4.6" [writing quality]
  Task 4 (Schedule + send) → llm: "None" [automation platform only, no LLM needed]
Always assign the objectively best LLM per task based on what that task does.

═══════════════════════════════════════════════
PART 5 — EXECUTION, PLATFORM, TOOL GAP, COST
═══════════════════════════════════════════════
EXECUTION APPROACH:
- One-time task → Direct LLM Usage
- Repeatable + monthly → LLM Skill / Prompt Template
- Repeatable + weekly/daily → Scheduled Automation
- Autonomous agent OR tasks > 5 multi-system → Full Autonomous Agent
- Personal use → bias simpler/cheaper; Production → bias robust/reliable

PLATFORM (budget-first):
- Non-technical + no budget → Make.com or Relevance AI (NOT n8n Cloud — no free cloud tier)
- Technical users → n8n self-hosted (free, unlimited)
- AI agent focus → Relevance AI
- Voice/chatbot → Voiceflow
- LLM/RAG pipeline → Langflow
- Enterprise GCP → Vertex AI
- One-time task → None (Direct LLM)

TOOL GAP ANALYSIS:
From clarifying answers: extract tools user HAS and tools user CANNOT connect (privacy).
Cross-reference with tools required for the flow.
toolsGap = mandatory tools user does not have (flag clearly, show workaround)
toolsPrivacyConflict = tools user has but cannot connect (show alternative approach)

COST: Budget-first. INR only. Platform + LLM API as separate lines.
CLIFF CHECK: Very large payload + GPT-5.4 (>272K) or Gemini 3.1 Pro (>200K) → flag cliff risk. Claude = cliff-safe (flat pricing).
BILLING: Two bills (platform + LLM API) except Vertex AI (single GCP bill).

ROI: Honest. Compare vs simpler alternatives (Claude Skills, Gemini Gems, Custom GPT, schedulers).

Return ONLY valid JSON:
{
  "title": "max 8 words",
  "executionApproach": "Direct LLM Usage|LLM Skill / Prompt Template|Scheduled Automation|Full Autonomous Agent",
  "executionRationale": "one sentence",
  "tasks": [{"number":1,"name":"","type":"Trigger|Data Fetch|Research|Analysis|Content Generation|Decision|Data Transform|Output","llm":"model name or None","llmReason":"one phrase why this LLM for this task","platform":"","description":""}],
  "visualFlow": "[Task|LLM|Tool] → [Task|LLM|Tool]",
  "llmDistribution": [{"llm":"Claude Sonnet 4.6","taskCount":2,"taskNames":["Write email","Draft report"]},{"llm":"Gemini 3.1 Pro","taskCount":1,"taskNames":["Research prospect"]}],
  "platformRecommendation": "platform name",
  "platformRationale": "why this platform (budget reasoning)",
  "llmRationale": "overall LLM strategy explanation referencing the intelligence rules",
  "freemiumVerdict": "Freemium sufficient|Freemium to start upgrade likely|Paid required",
  "primaryLLM": "model name of the LLM used most/for critical task",
  "billingNote": "plain English",
  "cliffWarning": null,
  "thinkingTokenNote": null,
  "toolAnalysis": {
    "toolsRequired": ["tool1","tool2"],
    "toolsUserHas": ["tool1"],
    "toolsBlocked": ["tool2"],
    "toolsGap": [{"tool":"name","reason":"why mandatory","workaround":"alternative if any"}],
    "toolsPrivacyConflict": [{"tool":"name","issue":"cannot connect","workaround":"alternative approach"}]
  },
  "roiAssessment": {
    "worthIt": true,
    "summary": "2-3 sentence honest assessment",
    "alternatives": [{"name":"","description":"","cost":"","bestFor":""}]
  },
  "detailedSteps": [{"taskNumber":1,"taskName":"","description":"","platform":"","llm":"","promptTemplate":"","input":"","output":"","connection":"","setupTime":""}]
}`;

// ──────────────── UTILS ────────────────

async function callAPI(system, user) {
  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, model: "gemini-2.5-flash" })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `API error ${r.status}`);
  }
  const d = await r.json();
  const txt = d.text || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

function calcCost(result, answers, questions) {
  const llm = LLM_DATA[result?.primaryLLM];
  if (!llm) return null;
  const pq = questions.find(q => /long|page|size|document/i.test(q.question));
  const payloadAns = pq ? (Array.isArray(answers[pq.id]) ? answers[pq.id][0] : answers[pq.id]) : null;
  const payload = PAYLOAD_TOKENS[payloadAns] || PAYLOAD_TOKENS["Medium (5–20 pages)"];
  const runs = result.executionApproach === "Direct LLM Usage" ? 1 : result.executionApproach === "Full Autonomous Agent" ? 300 : 100;
  const buf = result.thinkingTokenNote && !result.primaryLLM?.includes("Claude") ? 1.4 : 1.0;
  const usd = ((payload.in / 1e6) * llm.in + (payload.out / 1e6) * llm.out) * runs * buf;
  return { usd, inr: usd * USD_TO_INR, runs, buf };
}

function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, savedAt: Date.now() })); } catch {} }
function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
function clearState() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

// ──────────────── PROGRESS BAR ────────────────

function ProgressBar({ stage }) {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const steps = PROGRESS_STAGES[stage] || PROGRESS_STAGES.generate;
  const totalEst = steps.reduce((a, s) => a + s.est, 0);

  useEffect(() => {
    startRef.current = Date.now();
    setStep(0); setElapsed(0);
    const ticker = setInterval(() => setElapsed(Date.now() - startRef.current), 200);
    const stepTimers = [];
    let acc = 0;
    steps.forEach((s, i) => {
      if (i === 0) return;
      acc += steps[i - 1].est * 1000;
      stepTimers.push(setTimeout(() => setStep(i), acc));
    });
    return () => { clearInterval(ticker); stepTimers.forEach(clearTimeout); };
  }, [stage]);

  const pct = Math.min(93, (elapsed / (totalEst * 1000)) * 100);
  const remaining = Math.max(1, Math.ceil(totalEst - elapsed / 1000));

  return (
    <div style={{ padding: "60px 20px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {stage === "clarify" ? "🔍" : "⚙️"}
        </div>
        <div style={{ width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#e2e8f0", margin: "0 0 4px" }}>{steps[step]?.label}</p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>~{remaining}s remaining · Step {step + 1} of {steps.length}</p>
        </div>
        <div style={{ width: "100%", height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#a78bfa)", width: `${pct}%`, transition: "width 0.8s ease", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i <= step ? "#6366f1" : "#334155", transition: "background .3s" }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#334155", margin: 0, textAlign: "center" }}>
          {stage === "generate" ? "Analysing use case · Selecting optimal tools · Building your blueprint" : "Reading your use case · Preparing questions"}
        </p>
      </div>
    </div>
  );
}

// ──────────────── MAIN APP ────────────────

export default function App() {
  const [screen, setScreen] = useState("intake");
  const [intake, setIntake] = useState({ userType: "", field: "", orgType: "", dept: "", company: "", role: "", useCase: "", usageIntent: "", execPref: "" });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadStage, setLoadStage] = useState(null);
  const [error, setError] = useState("");
  const [savedSession, setSavedSession] = useState(null);
  const [refinement, setRefinement] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => { const s = loadState(); if (s?.result) setSavedSession(s); }, []);

  useEffect(() => {
    if (result || screen !== "intake") saveState({ screen, intake, questions, answers, result, showDetails });
  }, [screen, result, showDetails]);

  const ui = (k, v) => setIntake(p => ({ ...p, [k]: v }));

  function toggleAns(qId, opt, isMulti, max = 3) {
    setAnswers(prev => {
      if (!isMulti) return { ...prev, [qId]: opt };
      const cur = Array.isArray(prev[qId]) ? prev[qId] : [];
      if (cur.includes(opt)) return { ...prev, [qId]: cur.filter(o => o !== opt) };
      if (cur.length >= max) return prev;
      return { ...prev, [qId]: [...cur, opt] };
    });
  }

  function isSel(qId, opt, isMulti) {
    return isMulti ? (Array.isArray(answers[qId]) && answers[qId].includes(opt)) : answers[qId] === opt;
  }

  function resumeSession() {
    const s = savedSession;
    setIntake(s.intake || {}); setQuestions(s.questions || []);
    setAnswers(s.answers || {}); setResult(s.result || null);
    setShowDetails(s.showDetails || false); setScreen(s.screen || "intake");
    setSavedSession(null);
  }

  function startFresh() {
    clearState(); setSavedSession(null);
    setIntake({ userType: "", field: "", orgType: "", dept: "", company: "", role: "", useCase: "", usageIntent: "", execPref: "" });
    setQuestions([]); setAnswers({}); setResult(null); setShowDetails(false);
    setRefinement(""); setScreen("intake"); setError("");
  }

  function manualSave() {
    saveState({ screen, intake, questions, answers, result, showDetails });
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }

  async function handleIntakeSubmit() {
    if (!intake.userType || !intake.useCase.trim() || !intake.usageIntent || !intake.execPref) {
      setError("Please complete all required fields."); return;
    }
    setError(""); setLoadStage("clarify");
    try {
      const prompt = CLARIFY_PROMPT.replace("{INTAKE}", JSON.stringify(intake));
      const data = await callAPI("Return only valid JSON. No markdown.", prompt);
      const qs = data.questions || [];
      setQuestions(qs);
      const init = {};
      qs.forEach(q => { init[q.id] = q.multiSelect ? [] : ""; });
      setAnswers(init);
      setScreen("questions");
    } catch { setError("Something went wrong. Please try again."); }
    setLoadStage(null);
  }

  async function handleGenerate(isRefinement = false) {
    setError(""); setLoadStage("generate");
    try {
      const fmtAnswers = {};
      Object.entries(answers).forEach(([k, v]) => { fmtAnswers[k] = Array.isArray(v) ? v.join(", ") : v; });
      const payload = { intake, clarifyingAnswers: fmtAnswers, questions };
      if (isRefinement && refinement.trim()) payload.refinementNote = refinement;
      if (isRefinement && result) payload.previousAnalysis = { title: result.title, executionApproach: result.executionApproach };
      const data = await callAPI(SYSTEM_PROMPT, JSON.stringify(payload));
      setResult(data); setScreen("result"); setRefinement("");
    } catch { setError("Something went wrong generating your recommendation. Please try again."); }
    setLoadStage(null);
  }

  const cost = result ? calcCost(result, answers, questions) : null;
  const platInfo = result ? PLATFORM_DATA[result.platformRecommendation] || PLATFORM_DATA["None (Direct LLM)"] : null;
  const vInfo = result ? VERDICTS[result.freemiumVerdict] || VERDICTS["Freemium to start upgrade likely"] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#09090f;color:#e2e8f0;font-family:'DM Sans',sans-serif;min-height:100vh}
        ::placeholder{color:#475569}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
        .card{background:#111827;border:1px solid #1e293b;border-radius:14px;padding:20px}
        .btn-p{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;padding:12px 26px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;letter-spacing:-.01em}
        .btn-p:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.4)}
        .btn-p:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .btn-s{background:transparent;color:#94a3b8;border:1px solid #334155;padding:10px 20px;border-radius:9px;font-size:13px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
        .btn-s:hover{border-color:#6366f1;color:#a5b4fc}
        .inp{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px 14px;border-radius:9px;font-size:14px;width:100%;outline:none;transition:border-color .2s;font-family:'DM Sans',sans-serif}
        .inp:focus{border-color:#6366f1}
        select.inp{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%2364748b' d='M5 7L0 2h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
        .opt{background:#1e293b;border:1.5px solid #334155;border-radius:10px;padding:11px 14px;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:9px}
        .opt:hover{border-color:#6366f1;background:rgba(99,102,241,.06)}
        .opt.sel{border-color:#6366f1;background:rgba(99,102,241,.1)}
        .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;font-size:13px}
        .step-card{background:#111827;border:1px solid #1e293b;border-left:3px solid #6366f1;border-radius:12px;padding:16px;margin-bottom:9px}
        .gap-card{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:12px 14px;margin-bottom:8px}
        .conflict-card{background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:12px 14px;margin-bottom:8px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease forwards}
        @keyframes saveFlash{0%,100%{opacity:0}20%,80%{opacity:1}}
        .save-flash{animation:saveFlash 2s ease forwards}
        @media(max-width:720px){.two-col{grid-template-columns:1fr!important}.three-col{grid-template-columns:1fr!important}}
        @media print{.no-print{display:none!important}body{background:#fff!important;color:#000!important}.card{background:#fff!important;border:1px solid #ddd!important}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#09090f" }}>
        {/* ─── Header ─── */}
        <div style={{ borderBottom: "1px solid #1e293b", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(9,9,15,.96)", backdropFilter: "blur(8px)", zIndex: 100 }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧭</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: "-.02em" }}>Agentic Flow Designer</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {result && (
              <div style={{ position: "relative" }}>
                <button className="btn-s" style={{ fontSize: 11, padding: "7px 12px" }} onClick={manualSave}>💾 Save</button>
                {saveFlash && <span className="save-flash" style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#22c55e", whiteSpace: "nowrap", pointerEvents: "none" }}>Saved!</span>}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {["intake", "questions", "result"].map((s, i, arr) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: screen === s ? "#6366f1" : i < arr.indexOf(screen) ? "#22c55e" : "#334155", transition: "all .3s" }} />
                  {i < arr.length - 1 && <div style={{ width: 24, height: 1.5, background: i < arr.indexOf(screen) ? "#22c55e" : "#334155", transition: "background .3s" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Resume Banner ─── */}
        {savedSession && !loadStage && screen === "intake" && (
          <div style={{ background: "rgba(99,102,241,.1)", borderBottom: "1px solid rgba(99,102,241,.2)", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }} className="no-print">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>💾</span>
              <span style={{ fontSize: 13, color: "#a5b4fc" }}>Saved session from {new Date(savedSession.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-p" style={{ padding: "7px 14px", fontSize: 12 }} onClick={resumeSession}>Resume →</button>
              <button className="btn-s" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setSavedSession(null)}>Dismiss</button>
            </div>
          </div>
        )}

        <div style={{ maxWidth: result && screen === "result" ? 980 : 660, margin: "0 auto", padding: "28px 20px" }} id="print-area">

          {/* ─── Loading / Progress ─── */}
          {loadStage && <ProgressBar stage={loadStage} />}

          {/* ─── SCREEN 1: Intake ─── */}
          {!loadStage && screen === "intake" && (
            <div className="fu">
              <div style={{ marginBottom: 26 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.15 }}>Design Your <span style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Workflow</span></h1>
                <p style={{ color: "#64748b", fontSize: 14 }}>Answer 5 questions. Get a step-by-step agentic blueprint with cost estimates in ₹.</p>
              </div>

              {error && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 9, padding: "9px 13px", marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>{error}</div>}

              {/* User Type */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 9, textTransform: "uppercase", letterSpacing: ".08em" }}>1. Who are you? *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }} className="two-col">
                  {[["🎓", "Student"], ["💼", "Working Professional"], ["👔", "CXO / Founder"], ["🔧", "Builder / Tinkerer"], ["🙋", "Other"]].map(([ic, lb]) => (
                    <div key={lb} className={`opt ${intake.userType === lb ? "sel" : ""}`} onClick={() => ui("userType", lb)}>
                      <span style={{ fontSize: 16 }}>{ic}</span><span style={{ fontSize: 13, fontWeight: 500 }}>{lb}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditional */}
              {intake.userType === "Student" && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>Field of Study *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {["Arts & Humanities", "Engineering & CS", "Science & Research", "Commerce & Business"].map(f => (
                      <div key={f} className={`opt ${intake.field === f ? "sel" : ""}`} onClick={() => ui("field", f)}><span style={{ fontSize: 12, fontWeight: 500 }}>{f}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {intake.userType === "Working Professional" && (
                <div style={{ marginBottom: 18, display: "grid", gap: 9 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 7, textTransform: "uppercase", letterSpacing: ".08em" }}>Organisation Size *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                      {["Startup (< 200)", "Mid-size (200–1000)", "Enterprise (1000+)"].map(o => (
                        <div key={o} className={`opt ${intake.orgType === o ? "sel" : ""}`} onClick={() => ui("orgType", o)} style={{ justifyContent: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 500, textAlign: "center" }}>{o}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <select className="inp" value={intake.dept} onChange={e => ui("dept", e.target.value)}>
                    <option value="">Department *</option>
                    {["Operations", "Marketing", "Sales", "HR", "Product", "Finance", "Technology / IT", "Other"].map(d => <option key={d}>{d}</option>)}
                  </select>
                  <input className="inp" placeholder="Company name (optional)" value={intake.company} onChange={e => ui("company", e.target.value)} />
                </div>
              )}

              {intake.userType === "CXO / Founder" && (
                <div style={{ marginBottom: 18, display: "grid", gap: 9 }}>
                  <select className="inp" value={intake.role} onChange={e => ui("role", e.target.value)}>
                    <option value="">Your role *</option>
                    {["CEO / Founder / MD", "CTO / CIO", "CMO / VP Marketing", "CFO / VP Finance", "COO / VP Operations", "Other C-Suite"].map(r => <option key={r}>{r}</option>)}
                  </select>
                  <select className="inp" value={intake.dept} onChange={e => ui("dept", e.target.value)}>
                    <option value="">Use case function *</option>
                    {["Operations", "Marketing", "Sales", "HR", "Product", "Finance", "Technology", "Other"].map(d => <option key={d}>{d}</option>)}
                  </select>
                  <input className="inp" placeholder="Company name (optional)" value={intake.company} onChange={e => ui("company", e.target.value)} />
                </div>
              )}

              {/* Use Case */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>2. Describe your use case *</label>
                <textarea className="inp" rows={4} placeholder="e.g. I want to automatically research companies before my sales calls, pull their latest news and LinkedIn activity, and send myself a briefing 30 minutes before each meeting." value={intake.useCase} onChange={e => ui("useCase", e.target.value)} style={{ resize: "vertical" }} />
                <p style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>2–3 sentences for the best recommendation</p>
              </div>

              {/* Intent */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>3. Usage intent *</label>
                <div style={{ display: "flex", gap: 7 }}>
                  {[["🧪", "Personal / Learning"], ["🏭", "Production Use"]].map(([ic, lb]) => (
                    <div key={lb} className={`opt ${intake.usageIntent === lb ? "sel" : ""}`} onClick={() => ui("usageIntent", lb)} style={{ flex: 1 }}>
                      <span style={{ fontSize: 16 }}>{ic}</span><span style={{ fontSize: 13, fontWeight: 500 }}>{lb}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Pref */}
              <div style={{ marginBottom: 26 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>4. What kind of solution? *</label>
                <div style={{ display: "grid", gap: 7 }}>
                  {[["⚡", "One-time task", "I need this done once"], ["🔄", "Repeatable workflow", "Runs on a schedule or trigger"], ["🤖", "Autonomous agent", "AI handles end-to-end without me"]].map(([ic, lb, desc]) => (
                    <div key={lb} className={`opt ${intake.execPref === lb ? "sel" : ""}`} onClick={() => ui("execPref", lb)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>{ic}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{lb}</span></div>
                      <span style={{ fontSize: 11, color: "#64748b", paddingLeft: 24 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-p" onClick={handleIntakeSubmit} style={{ width: "100%", padding: "14px" }}>Analyse My Use Case →</button>
            </div>
          )}

          {/* ─── SCREEN 2: Questions ─── */}
          {!loadStage && screen === "questions" && (
            <div className="fu">
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
                  <div className="tag" style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc" }}>{questions.length} questions · one round</div>
                  <div className="tag" style={{ background: "rgba(34,197,94,.1)", color: "#4ade80" }}>Checkboxes: pick up to 3</div>
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 21, fontWeight: 700, margin: "0 0 5px" }}>A few more details</h2>
                <p style={{ color: "#64748b", fontSize: 13 }}>Including which tools you use and any data privacy constraints — this ensures your blueprint is realistic and actionable.</p>
              </div>

              {error && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 9, padding: "9px 13px", marginBottom: 14, color: "#fca5a5", fontSize: 13 }}>{error}</div>}

              {questions.map((q, qi) => {
                const isMulti = q.multiSelect === true;
                const maxSel = q.maxSelections || (isMulti ? 3 : 1);
                const curArr = isMulti ? (Array.isArray(answers[q.id]) ? answers[q.id] : []) : [];

                return (
                  <div key={q.id} className="card" style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                      <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, background: "rgba(99,102,241,.15)", padding: "2px 8px", borderRadius: 20 }}>Q{qi + 1}/{questions.length}</span>
                      {isMulti && <span className="tag" style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc" }}>Select up to {maxSel}</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 11px", lineHeight: 1.45 }}>{q.question}</p>
                    <div style={{ display: "grid", gap: 6 }}>
                      {q.options.map(opt => {
                        const sel = isSel(q.id, opt, isMulti);
                        const disabled = isMulti && curArr.length >= maxSel && !sel;
                        return (
                          <div key={opt} className={`opt ${sel ? "sel" : ""}`} onClick={() => !disabled && toggleAns(q.id, opt, isMulti, maxSel)} style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                            <div style={{ width: 15, height: 15, borderRadius: isMulti ? 3 : "50%", border: `2px solid ${sel ? "#6366f1" : "#475569"}`, background: sel ? "#6366f1" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s" }}>
                              {sel && <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 13 }}>{opt}</span>
                          </div>
                        );
                      })}
                      {q.allowOther && (
                        <input className="inp" style={{ marginTop: 3 }} placeholder="Other — describe briefly…" value={!isMulti && answers[q.id]?.startsWith?.("Other:") ? answers[q.id].slice(7) : ""} onChange={e => { if (!isMulti) setAnswers(p => ({ ...p, [q.id]: e.target.value ? `Other: ${e.target.value}` : "" })); }} />
                      )}
                    </div>
                    {isMulti && curArr.length > 0 && (
                      <p style={{ marginTop: 7, fontSize: 11, color: "#6366f1" }}>Selected: {curArr.join(" · ")}</p>
                    )}
                  </div>
                );
              })}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button className="btn-s" onClick={() => setScreen("intake")}>← Back</button>
                <button className="btn-p" onClick={() => handleGenerate(false)} style={{ flex: 1 }}>Generate My Blueprint →</button>
              </div>
            </div>
          )}

          {/* ─── SCREEN 3: Result ─── */}
          {!loadStage && screen === "result" && result && (
            <div className="fu">
              {/* Title */}
              <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 7, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 19 }}>{APPROACH_ICONS[result.executionApproach] || "⚙️"}</span>
                    <div className="tag" style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc" }}>{result.executionApproach}</div>
                  </div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 23, fontWeight: 800, margin: "0 0 5px", lineHeight: 1.2 }}>{result.title}</h2>
                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>{result.executionRationale}</p>
                </div>
                <button className="btn-s no-print" style={{ fontSize: 11, padding: "8px 13px", flexShrink: 0 }} onClick={() => window.print()}>🖨️ Print / Save PDF</button>
              </div>

              {/* Cliff Warning */}
              {result.cliffWarning && (
                <div style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 11, padding: "12px 15px", marginBottom: 14, display: "flex", gap: 9 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                  <div><p style={{ margin: "0 0 2px", fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>Long-Context Pricing Alert</p><p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.45 }}>{result.cliffWarning}</p></div>
                </div>
              )}

              {/* Visual Flow */}
              <div className="card" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 11px", fontWeight: 600 }}>Agentic Flow</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                  {result.tasks?.map((task, i) => (
                    <>
                      <div key={`t${i}`} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 9, padding: "8px 12px", textAlign: "center", minWidth: 95, flexShrink: 0 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: TASK_COLORS[task.type] || "#6366f1", margin: "0 auto 5px" }} />
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#e2e8f0", marginBottom: 1 }}>{task.name}</div>
                        {task.llm && task.llm !== "None" && <div style={{ fontSize: 9, color: "#6366f1", fontWeight: 500, marginBottom: 1 }}>{task.llm.split(" ").slice(0,2).join(" ")}</div>}
                        <div style={{ fontSize: 9, color: "#64748b" }}>{task.platform}</div>
                      </div>
                      {i < result.tasks.length - 1 && <div key={`a${i}`} style={{ color: "#6366f1", fontSize: 14, flexShrink: 0 }}>→</div>}
                    </>
                  ))}
                </div>
                {/* LLM distribution pills */}
                {result.llmDistribution?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #1e293b", display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>LLMs in this flow:</span>
                    {result.llmDistribution.map((d, i) => {
                      const clr = d.llm?.includes("Claude") ? "#10b981" : d.llm?.includes("Gemini") ? "#f59e0b" : d.llm?.includes("GPT") ? "#6366f1" : "#64748b";
                      return (
                        <div key={i} className="tag" style={{ background: `${clr}15`, color: clr, border: `1px solid ${clr}30` }}>
                          {d.llm} · {d.taskCount} task{d.taskCount > 1 ? "s" : ""}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                  {Object.entries(TASK_COLORS).filter(([t]) => result.tasks?.some(tk => tk.type === t)).map(([t, c]) => (
                    <div key={t} className="tag" style={{ background: `${c}18`, color: c, border: `1px solid ${c}35` }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />{t}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3-col: Platform / LLM / Cost */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }} className="three-col">
                <div className="card">
                  <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 9px", fontWeight: 600 }}>Platform</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>{result.platformRecommendation}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 7px", lineHeight: 1.4 }}>{result.platformRationale}</p>
                  {vInfo && <div className="tag" style={{ background: `${vInfo.color}18`, color: vInfo.color, marginBottom: 8 }}>{vInfo.icon} {result.freemiumVerdict}</div>}
                  {platInfo && <div style={{ borderTop: "1px solid #1e293b", paddingTop: 8, marginTop: 4 }}>
                    <p style={{ fontSize: 10, color: "#475569", margin: "0 0 2px" }}>Free: {platInfo.free}</p>
                    <p style={{ fontSize: 10, color: "#f59e0b", margin: 0 }}>Paid: {platInfo.paid} / {platInfo.paidINR}</p>
                  </div>}
                </div>

                <div className="card">
                  <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 9px", fontWeight: 600 }}>Primary LLM</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>{result.primaryLLM}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 7px", lineHeight: 1.4 }}>{result.llmRationale}</p>
                  {(() => { const l = LLM_DATA[result.primaryLLM]; return l ? (
                    <div style={{ borderTop: "1px solid #1e293b", paddingTop: 8, marginTop: 4 }}>
                      <p style={{ fontSize: 10, color: "#22c55e", margin: "0 0 2px" }}>In: ${l.in}/1M · {INR(l.in / 1000)}/K tokens</p>
                      <p style={{ fontSize: 10, color: "#f59e0b", margin: "0 0 2px" }}>Out: ${l.out}/1M · {INR(l.out / 1000)}/K tokens</p>
                      <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{l.note}</p>
                    </div>
                  ) : null; })()}
                </div>

                <div className="card">
                  <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 9px", fontWeight: 600 }}>Monthly Cost (INR)</p>
                  {cost ? (
                    <>
                      <div className="row"><span style={{ color: "#94a3b8" }}>Platform</span><span style={{ color: "#22c55e", fontWeight: 600 }}>{result.freemiumVerdict === "Freemium sufficient" ? "Free" : platInfo?.paidINR}</span></div>
                      <div className="row"><span style={{ color: "#94a3b8" }}>LLM API (~{cost.runs} runs)</span><span style={{ fontWeight: 600 }}>₹{Math.round(cost.inr).toLocaleString("en-IN")}</span></div>
                      {cost.buf > 1 && <div className="row"><span style={{ color: "#94a3b8", fontSize: 11 }}>Thinking buffer (40%)</span><span style={{ color: "#f59e0b", fontSize: 11 }}>incl.</span></div>}
                      <div style={{ marginTop: 9, background: "#1e293b", borderRadius: 8, padding: "9px 11px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>Total estimated</p>
                        <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700 }}>₹{Math.round(cost.inr).toLocaleString("en-IN")}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>≈ ${cost.usd.toFixed(2)}/mo</p>
                      </div>
                    </>
                  ) : <p style={{ fontSize: 12, color: "#64748b" }}>Varies by usage</p>}
                </div>
              </div>

              {/* Billing note */}
              <div style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.18)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.45 }}>{result.billingNote}</p>
              </div>

              {/* Task Breakdown */}
              <div className="card" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 11px", fontWeight: 600 }}>Task Breakdown · {result.tasks?.length} steps · {result.llmDistribution?.length || 1} LLM{result.llmDistribution?.length > 1 ? "s" : ""} used</p>
                {result.tasks?.map((task, i) => {
                  const llmClr = task.llm?.includes("Claude") ? "#10b981" : task.llm?.includes("Gemini") ? "#f59e0b" : task.llm?.includes("GPT") ? "#6366f1" : "#64748b";
                  return (
                    <div key={i} style={{ display: "flex", gap: 11, padding: "9px 0", borderBottom: i < result.tasks.length - 1 ? "1px solid #1e293b" : "none" }}>
                      <div style={{ width: 21, height: 21, borderRadius: 5, background: `${TASK_COLORS[task.type] || "#6366f1"}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, fontWeight: 700, color: TASK_COLORS[task.type] || "#6366f1" }}>{task.number}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{task.name}</span>
                          <span className="tag" style={{ background: `${TASK_COLORS[task.type] || "#6366f1"}14`, color: TASK_COLORS[task.type] || "#a5b4fc", fontSize: 9 }}>{task.type}</span>
                        </div>
                        <p style={{ margin: "0 0 5px", fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{task.description}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {task.llm && task.llm !== "None" && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span className="tag" style={{ background: `${llmClr}18`, color: llmClr, border: `1px solid ${llmClr}30`, fontSize: 10 }}>🤖 {task.llm}</span>
                              {task.llmReason && <span style={{ fontSize: 10, color: "#475569", fontStyle: "italic" }}>{task.llmReason}</span>}
                            </div>
                          )}
                          {task.platform && <span className="tag" style={{ background: "#1e293b", color: "#94a3b8", fontSize: 10 }}>🔧 {task.platform}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tool Gap Analysis */}
              {result.toolAnalysis && (
                <div className="card" style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 11px", fontWeight: 600 }}>Tool Analysis</p>

                  {/* Required tools overview */}
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                    {result.toolAnalysis.toolsRequired?.map(t => {
                      const hasIt = result.toolAnalysis.toolsUserHas?.includes(t);
                      const blocked = result.toolAnalysis.toolsBlocked?.includes(t);
                      const missing = !hasIt && !blocked;
                      return (
                        <div key={t} className="tag" style={{ background: missing ? "rgba(239,68,68,.1)" : blocked ? "rgba(245,158,11,.1)" : "rgba(34,197,94,.1)", color: missing ? "#fca5a5" : blocked ? "#fbbf24" : "#4ade80", border: `1px solid ${missing ? "rgba(239,68,68,.25)" : blocked ? "rgba(245,158,11,.25)" : "rgba(34,197,94,.25)"}` }}>
                          {missing ? "⚠️" : blocked ? "🔒" : "✓"} {t}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tool gaps */}
                  {result.toolAnalysis.toolsGap?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", margin: "0 0 8px" }}>⚠️ Tools you need but don't currently have</p>
                      {result.toolAnalysis.toolsGap.map((g, i) => (
                        <div key={i} className="gap-card">
                          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#fca5a5" }}>{g.tool}</p>
                          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#94a3b8" }}>{g.reason}</p>
                          {g.workaround && <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>💡 Workaround: {g.workaround}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Privacy conflicts */}
                  {result.toolAnalysis.toolsPrivacyConflict?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", margin: "0 0 8px" }}>🔒 Tools required but restricted by your privacy policy</p>
                      {result.toolAnalysis.toolsPrivacyConflict.map((c, i) => (
                        <div key={i} className="conflict-card">
                          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>{c.tool}</p>
                          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#94a3b8" }}>{c.issue}</p>
                          {c.workaround && <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>💡 Alternative approach: {c.workaround}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {!result.toolAnalysis.toolsGap?.length && !result.toolAnalysis.toolsPrivacyConflict?.length && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(34,197,94,.07)", borderRadius: 8 }}>
                      <span>✅</span><span style={{ fontSize: 13, color: "#4ade80" }}>You have all the tools needed. No gaps or privacy conflicts detected.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ROI Assessment */}
              {result.roiAssessment && (
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 17 }}>{result.roiAssessment.worthIt ? "✅" : "🤔"}</span>
                    <div>
                      <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 1px", fontWeight: 600 }}>ROI Assessment</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: result.roiAssessment.worthIt ? "#22c55e" : "#f59e0b" }}>{result.roiAssessment.worthIt ? "Worth the investment" : "Consider alternatives first"}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 12px", lineHeight: 1.5 }}>{result.roiAssessment.summary}</p>
                  {result.roiAssessment.alternatives?.length > 0 && (
                    <>
                      <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Simpler alternatives — you decide what works best</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} className="two-col">
                        {result.roiAssessment.alternatives.map((alt, i) => (
                          <div key={i} style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px", border: "1px solid #334155" }}>
                            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{alt.name}</p>
                            <p style={{ margin: "0 0 6px", fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{alt.description}</p>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              <span className="tag" style={{ background: "rgba(34,197,94,.1)", color: "#22c55e", fontSize: 10 }}>💰 {alt.cost}</span>
                              <span className="tag" style={{ background: "#283548", color: "#94a3b8", fontSize: 10 }}>Best for: {alt.bestFor}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 10, color: "#475569", lineHeight: 1.5 }}>⚠️ Cost estimates are approximate. Platform pricing verified April 2026 — check before committing. USD/INR rate: ₹84 (verify current rate). Pricing pages: n8n.io · make.com · zapier.com · relevanceai.com · anthropic.com · openai.com · ai.google.dev</p>
              </div>

              {/* Detailed Steps Button */}
              <div style={{ marginBottom: 16 }} className="no-print">
                <button className="btn-p" onClick={() => setShowDetails(!showDetails)} style={{ width: "100%" }}>
                  {showDetails ? "▲ Hide Detailed Build Steps" : "▼ Get Detailed Build Steps"}
                </button>
              </div>

              {/* Detailed Steps */}
              {showDetails && result.detailedSteps?.length > 0 && (
                <div className="fu" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Step-by-Step Build Guide</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>Written for beginners. No prior experience needed.</p>
                  {result.detailedSteps.map((step, i) => (
                    <div key={i} className="step-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#a5b4fc", flexShrink: 0 }}>S{step.taskNumber}</div>
                        <div><p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{step.taskName}</p><p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>⏱ {step.setupTime}</p></div>
                      </div>
                      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 9px" }}>{step.description}</p>
                      {step.promptTemplate && (
                        <div style={{ background: "#0f172a", borderRadius: 7, padding: "9px 12px", marginBottom: 9 }}>
                          <p style={{ margin: "0 0 3px", fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: ".07em" }}>Prompt Template</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#93c5fd", fontFamily: "monospace", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{step.promptTemplate}</p>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 6 }}>
                        <div style={{ background: "#1e293b", borderRadius: 7, padding: "7px 9px" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Input</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{step.input}</p>
                        </div>
                        <div style={{ background: "#1e293b", borderRadius: 7, padding: "7px 9px" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Output</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{step.output}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {step.platform && <span className="tag" style={{ background: "#1e293b", color: "#94a3b8", fontSize: 10 }}>🔧 {step.platform}</span>}
                        {step.llm && step.llm !== "None" && <span className="tag" style={{ background: "#1e293b", color: "#94a3b8", fontSize: 10 }}>🤖 {step.llm}</span>}
                      </div>
                      {step.connection && <p style={{ margin: "7px 0 0", fontSize: 10, color: "#475569" }}>→ {step.connection}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* ─── Refinement Box ─── */}
              <div className="card no-print" style={{ marginBottom: 12, border: "1px solid #334155" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#a5b4fc", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".07em" }}>🔁 Refine Your Analysis</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 11px", lineHeight: 1.4 }}>Add more context, correct something, or change your requirements. The entire blueprint will be regenerated with your update.</p>
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="e.g. I forgot to mention I use HubSpot as my CRM. Also I cannot connect Slack to third-party apps. Can you revise the flow accordingly?"
                  value={refinement}
                  onChange={e => setRefinement(e.target.value)}
                  style={{ resize: "vertical", marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-p" onClick={() => handleGenerate(true)} disabled={!refinement.trim()} style={{ flex: 1 }}>Re-Analyse with Update →</button>
                  <button className="btn-s" style={{ fontSize: 12 }} onClick={startFresh}>↺ Start Over</button>
                </div>
              </div>

              {/* Auto-save note */}
              <p style={{ fontSize: 10, color: "#334155", textAlign: "center" }} className="no-print">
                💾 Session auto-saved to your browser · Use the Save button above to manually save anytime
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #1e293b", padding: "13px 24px", textAlign: "center" }} className="no-print">
          <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>Agentic Flow Designer · Built by Aditya · AI Upskilling Sprint Week 1 · Powered by Claude · April 2026 · All costs in INR at ₹84/USD</p>
        </div>
      </div>
    </>
  );
}
