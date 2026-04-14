// ── Exchange rate ──────────────────────────────────────────────────────
export const USD = 84;

// ── Pricing fallback date (last manual update of pricing-data.json) ────
// Update this string whenever pricing-data.json is edited.
export const PRICING_FALLBACK_DATE = '2026-04-14';

// ── Execution preference options (intake form) ─────────────────────────
// Third option ("Autonomous agent") is shown only for relevant user types.
export const EXEC_OPTIONS: Array<{ icon: string; label: string; desc: string; restrictTo?: string[] }> = [
  { icon: '⚡', label: 'One-time task',        desc: 'I need this done once, not repeatedly' },
  { icon: '🔄', label: 'Repeatable workflow',  desc: 'I want this to run on a schedule or trigger' },
  { icon: '🤖', label: 'Autonomous agent',     desc: 'I want AI to handle this end-to-end without me',
    restrictTo: ['Working Professional', 'CXO / Founder', 'Builder / Tinkerer'] },
];

// ── Platform data ─────────────────────────────────────────────────────
export const PLATDATA: Record<string, {
  free: string; paid: string; paidINR: string;
  paidUSD: number; verdict: string;
}> = {
  'Make.com':              { free:'1,000 ops/mo · 2 scenarios', paid:'$9/mo (Core)',        paidINR:'₹756/mo',    paidUSD:9,     verdict:'freemium' },
  'Zapier':                { free:'100 tasks/mo · unlimited Zaps', paid:'$19.99/mo (Starter)', paidINR:'₹1,679/mo', paidUSD:19.99, verdict:'limited'  },
  'n8n (self-hosted)':     { free:'Unlimited (Community Edition)', paid:'Cloud from $24/mo',    paidINR:'₹2,016/mo', paidUSD:0,     verdict:'freemium' },
  'Relevance AI':          { free:'200 Actions/mo + $2 credits',   paid:'$19/mo (Team)',        paidINR:'₹1,596/mo', paidUSD:19,    verdict:'freemium' },
  'Voiceflow':             { free:'2 agents · limited msgs',       paid:'$50/mo (Pro)',         paidINR:'₹4,200/mo', paidUSD:50,    verdict:'freemium' },
  'Langflow':              { free:'Open source · self-hosted',     paid:'Cloud varies',         paidINR:'Varies',    paidUSD:0,     verdict:'freemium' },
  'Vertex AI Agent Builder':{ free:'GCP trial $300 credits',       paid:'Pay-per-use GCP',      paidINR:'Pay-per-use',paidUSD:0,    verdict:'paid'     },
  'None (Direct LLM)':     { free:'No platform needed',           paid:'LLM API only',          paidINR:'LLM only',  paidUSD:0,     verdict:'freemium' },
};

// ── LLM pricing (April 2026) ───────────────────────────────────────────
export const LLMDATA: Record<string, {
  in: number; out: number; cliff: number | null; note: string;
}> = {
  'Claude Opus 4.6':       { in:5.00,  out:25.00, cliff:null,   note:'Flat pricing — no long-context premium' },
  'Claude Sonnet 4.6':     { in:3.00,  out:15.00, cliff:null,   note:'Flat pricing — no long-context premium' },
  'GPT-5.4':               { in:2.50,  out:15.00, cliff:272000, note:'2× pricing above 272K tokens'           },
  'GPT-5.4 Mini':          { in:0.75,  out:4.50,  cliff:null,   note:'Budget mid-tier'                        },
  'GPT-5.4 Nano':          { in:0.20,  out:1.25,  cliff:null,   note:'Ultra-budget'                           },
  'Gemini 3.1 Pro':        { in:2.00,  out:12.00, cliff:200000, note:'2× pricing above 200K tokens'           },
  'Gemini 2.5 Flash':      { in:0.15,  out:0.60,  cliff:null,   note:'Fast and cost-effective'                },
  'Gemini 3.1 Flash-Lite': { in:0.25,  out:1.50,  cliff:null,   note:'Ultra-budget 2026 model'                },
};

// ── Document payload sizes ─────────────────────────────────────────────
export const PAYLOAD: Record<string, { in: number; out: number }> = {
  'Short (1 page / ~500 words)':       { in:500,    out:300  },
  'Medium (5–20 pages)':               { in:8000,   out:1500 },
  'Long (50–200 pages)':               { in:80000,  out:4000 },
  'Very large (200+ pages / codebases)':{ in:400000, out:7000 },
};

// ── Task type colours ──────────────────────────────────────────────────
export const TCOL: Record<string, string> = {
  'Trigger':            '#4285F4',
  'Data Fetch':         '#1A73E8',
  'Research':           '#34A853',
  'Analysis':           '#9334E6',
  'Content Generation': '#F9AB00',
  'Decision':           '#EA4335',
  'Data Transform':     '#00897B',
  'Output':             '#5F6368',
};

// ── Freemium verdict display ───────────────────────────────────────────
export const VDICT: Record<string, { color: string; bg: string; label: string }> = {
  'Freemium sufficient':                { color:'var(--ok)', bg:'var(--ok-bg)', label:'Free to start'             },
  'Freemium to start upgrade likely':   { color:'var(--wn)', bg:'var(--wn-bg)', label:'Start free, upgrade later'  },
  'Paid required':                      { color:'var(--er)', bg:'var(--er-bg)', label:'Paid subscription needed'    },
};

// ── Execution approach icons ───────────────────────────────────────────
export const AICONS: Record<string, string> = {
  'Direct LLM Usage':            '⚡',
  'LLM Skill / Prompt Template': '📋',
  'Scheduled Automation':        '🔄',
  'Full Autonomous Agent':       '🤖',
};

// ── Affiliate links ────────────────────────────────────────────────────
export const AFFILIATE_LINKS: Record<string, string> = {
  'Make.com':               'https://www.make.com/en/register?pc=blueprint',
  'Zapier':                 'https://zapier.com/?utm_source=blueprint',
  'n8n (self-hosted)':      'https://n8n.io/?utm_source=blueprint',
  'Relevance AI':           'https://relevanceai.com/?utm_source=blueprint',
  'Voiceflow':              'https://www.voiceflow.com/?utm_source=blueprint',
  'Langflow':               'https://www.langflow.org/?utm_source=blueprint',
  'Vertex AI Agent Builder':'https://cloud.google.com/products/agent-builder?utm_source=blueprint',
  'Claude Opus 4.6':        'https://www.anthropic.com/claude?utm_source=blueprint',
  'Claude Sonnet 4.6':      'https://www.anthropic.com/claude?utm_source=blueprint',
  'GPT-5.4':                'https://openai.com/api/?utm_source=blueprint',
  'GPT-5.4 Mini':           'https://openai.com/api/?utm_source=blueprint',
  'GPT-5.4 Nano':           'https://openai.com/api/?utm_source=blueprint',
  'Gemini 3.1 Pro':         'https://ai.google.dev/?utm_source=blueprint',
  'Gemini 2.5 Flash':       'https://ai.google.dev/?utm_source=blueprint',
  'Gemini 3.1 Flash-Lite':  'https://ai.google.dev/?utm_source=blueprint',
};

// ── Verification source links ──────────────────────────────────────────
export const VERIFY_LINKS: Record<string, { pricing: string; docs?: string }> = {
  'Make.com':               { pricing:'https://www.make.com/en/pricing',               docs:'https://www.make.com/en/help'         },
  'Zapier':                 { pricing:'https://zapier.com/pricing',                    docs:'https://help.zapier.com'              },
  'n8n (self-hosted)':      { pricing:'https://n8n.io/pricing',                        docs:'https://docs.n8n.io'                  },
  'Relevance AI':           { pricing:'https://relevanceai.com/pricing',               docs:'https://relevanceai.com/docs'         },
  'Voiceflow':              { pricing:'https://www.voiceflow.com/pricing',             docs:'https://docs.voiceflow.com'           },
  'Claude Opus 4.6':        { pricing:'https://www.anthropic.com/pricing',             docs:'https://docs.anthropic.com'           },
  'Claude Sonnet 4.6':      { pricing:'https://www.anthropic.com/pricing',             docs:'https://docs.anthropic.com'           },
  'GPT-5.4':                { pricing:'https://openai.com/api/pricing/',               docs:'https://platform.openai.com/docs'     },
  'GPT-5.4 Mini':           { pricing:'https://openai.com/api/pricing/',               docs:'https://platform.openai.com/docs'     },
  'Gemini 3.1 Pro':         { pricing:'https://ai.google.dev/pricing',                 docs:'https://ai.google.dev/docs'           },
  'Gemini 2.5 Flash':       { pricing:'https://ai.google.dev/pricing',                 docs:'https://ai.google.dev/docs'           },
};

// ── Loading tips ───────────────────────────────────────────────────────
export const TIPS: string[] = [
  '💡 Assign different LLMs per task — Claude for writing, Gemini for research, GPT for data.',
  '💡 Start with freemium platforms like Make.com before committing to paid plans.',
  '💡 A Full Autonomous Agent costs ~3× more than a scheduled workflow — choose wisely.',
  '💡 Claude has no long-context price cliff. GPT-5.4 doubles in cost above 272K tokens.',
  '💡 Most automations run fine on 100 runs/month — that is 3–4 executions per day.',
  '💡 Privacy-blocked tools don\'t have to stop your workflow — local models can fill the gap.',
  '💡 ROI compounds: a 30-minute daily task automated saves ~130 hours every year.',
  '💡 Gemini has native Google Search grounding — unmatched for real-time market research.',
  '💡 Structured JSON output from LLMs is far more reliable than free-text parsing.',
  '💡 A good system prompt is worth 10× a better model for repeatable business tasks.',
];

export const inrFmt = (usd: number): string =>
  '₹' + Math.round(usd * USD).toLocaleString('en-IN');
