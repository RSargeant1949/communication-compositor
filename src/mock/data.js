// Mock data — replace with live Microsoft Graph API calls.
// See ROADMAP.md items 2 & 3 for the full wiring plan.
// All content here is fictional and illustrative.
// Section naming convention: "Blocks - [Subject] - [Category]"

export const MOCK_SECTIONS = [
  {
    id: "s1",
    name: "Blocks - Gabriela - Health - Positive",
    pages: [
      { id:"p1", name:"Health update – Summary",   modified:"2026-04-15", snippet:"A brief overview of recent health developments…" },
      { id:"p2", name:"Health update – Treatment",  modified:"2026-04-16", snippet:"Treatment progressed through several stages…" },
      { id:"p3", name:"Health update – Recovery",   modified:"2026-04-17", snippet:"Recovery has been steady with encouraging signs…" },
      { id:"p4", name:"Health update – Prognosis",  modified:"2026-04-17", snippet:"The outlook is cautiously positive at this stage…" },
      { id:"p5", name:"Health update – Current",    modified:"2026-04-18", snippet:"As of now, things are stabilising and improving…" },
    ]
  },
  {
    id: "s2",
    name: "Blocks - Richard - Health - Positive",
    pages: [
      { id:"p6", name:"Hearing",  modified:"2026-04-15", snippet:"Hearing aids have made a significant difference…" },
      { id:"p7", name:"Eyes",     modified:"2026-04-16", snippet:"Vision corrected after a couple of fittings…" },
      { id:"p8", name:"General",  modified:"2026-03-20", snippet:null }, // null = lazy-load
    ]
  },
  {
    id: "s3",
    name: "Blocks - Richard - Work",
    pages: [
      { id:"p9",  name:"End of contracting",   modified:"2026-04-10", snippet:"After many years in IT contracting, winding down…" },
      { id:"p10", name:"Current projects",      modified:"2026-04-12", snippet:"Retirement hasn't meant slowing down at all…" },
      { id:"p11", name:"Working with AI tools", modified:"2026-04-18", snippet:"A significant amount of time now involves AI-assisted work…" },
    ]
  },
  {
    id: "s4",
    name: "Blocks - Shared - Travel",
    pages: [
      { id:"p12", name:"The camper van",      modified:"2026-03-15", snippet:"The van has opened up a new way of travelling…" },
      { id:"p13", name:"Future travel plans",  modified:"2026-02-20", snippet:"Plans are forming for a longer trip later in the year…" },
    ]
  },
];

export const MOCK_RECIPIENTS = {
  RecipientA: {
    label: "Recipient A",
    emails: ["recipient.a@example.com"],
    untick: [],
  },
  RecipientB: {
    label: "Recipient B (close friend — already knows backstory)",
    emails: ["recipient.b@example.com"],
    untick: ["p1", "p2"], // omit summary blocks for recipients who already know
  },
  Custom: {
    label: "Custom…",
    emails: [],
    untick: [],
  },
};
