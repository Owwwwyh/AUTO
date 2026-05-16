# Receipt to Form

A small web app that extracts `merchant`, `date`, `total`, and `currency` from a receipt image using a generative AI vision model and pre-fills an editable form. Submissions are persisted to Postgres.

Built for the **TP Malaysia AI Intern build challenge**.

## Stack

- **Next.js 16** (App Router, TypeScript) deployed on **Vercel**
- **Vercel AI SDK v6** with **Google Gemini** (`gemini-2.5-flash`) for vision extraction
- **Zod** schema shared between the API, the form, and the model — `generateObject()` guarantees a typed response
- **Neon Postgres** + **Drizzle ORM** for persistence
- **Tailwind CSS** for styling, **Sonner** for toasts

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two keys below
npm run db:push              # creates the submissions table
npm run dev
```

Open <http://localhost:3000>.

### Required env vars

| Variable | Where to get it |
| --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | <https://aistudio.google.com/apikey> (free tier is plenty) |
| `DATABASE_URL` | Any Postgres connection string. Easiest: create a free Neon project at <https://neon.tech> |

On Vercel, both are auto-injected if you install the Neon and Google Gemini integrations from the Marketplace.

## Model and prompt

**Model:** `google/gemini-2.5-flash` via `@ai-sdk/google`, invoked through the AI SDK's `generateObject()` so the response is validated against a Zod schema (no JSON-parsing fragility).

**Schema** ([lib/schema.ts](lib/schema.ts)):

```ts
const ReceiptSchema = z.object({
  merchant: z.string(),     // store name as printed
  date: z.string(),         // YYYY-MM-DD
  total: z.number(),        // grand total, no symbol
  currency: z.string(),     // ISO 4217: MYR, USD, ...
});
```

**Prompt** ([lib/ai.ts](lib/ai.ts)):

> You are a receipt-parsing assistant. Extract the following fields from the receipt image:
> - merchant: store or merchant name exactly as printed
> - date: transaction date in ISO 8601 format (YYYY-MM-DD)
> - total: the grand total amount as a plain number with no currency symbol or thousands separators
> - currency: the ISO 4217 currency code (e.g. MYR, USD, SGD, EUR). If only a symbol is shown, infer the code (RM => MYR, $ => USD unless context suggests otherwise, € => EUR).
>
> If a field is missing or unreadable, give your best inference rather than refusing. Return only the structured fields.

## Project layout

```
app/
  page.tsx                  Main UI — uploader, editable form, recent submissions
  layout.tsx                Root layout + Toaster
  api/extract/route.ts      POST image → Gemini → typed receipt JSON
  api/submissions/route.ts  GET last 10 / POST new submission (validated with Zod)
lib/
  schema.ts                 Shared Zod schema and Receipt type
  ai.ts                     extractReceipt() — model call + prompt
  db.ts                     Drizzle client + submissions table definition
drizzle/0000_init.sql       Initial migration
```

## Deploy

1. Push to GitHub.
2. Import the repo on Vercel.
3. Add a Neon Postgres integration from the Marketplace (auto-sets `DATABASE_URL`), then add `GOOGLE_GENERATIVE_AI_API_KEY` under Project Settings → Environment Variables.
4. After first deploy, run `npm run db:push` against the production database (or apply `drizzle/0000_init.sql` from the Neon SQL editor).

## License

MIT
