#!/usr/bin/env node
/* Reads the saved chat log: what visitors asked, what the chat answered, and what it cost.
   The log is only reachable with the database's credentials, so this runs on my machine,
   never on the site.

   Copy DATABASE_PUBLIC_URL from the Postgres service's Variables tab on Railway, then:

       DATABASE_PUBLIC_URL="postgresql://..." node tools/chat-log.mjs          # last 7 days
       DATABASE_PUBLIC_URL="postgresql://..." node tools/chat-log.mjs 30       # last 30 days
       DATABASE_PUBLIC_URL="postgresql://..." node tools/chat-log.mjs 30 --json > chats.json

   Railway's Postgres service also has a Data tab for browsing the chat_messages table. */

import pg from "pg";

// Per million tokens. Models not listed here are shown without a cost.
const PRICES = {
  "claude-haiku-4-5": { input: 1, output: 5 },
};

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const days = Number.parseInt(args.find((arg) => /^\d+$/.test(arg)) ?? "7", 10);

const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_PUBLIC_URL to the Postgres URL from Railway (see the top of this file).");
  process.exit(1);
}

// The public URL crosses the internet, so the connection is encrypted. Railway signs its
// Postgres certificates itself, so they can't be checked against a public CA.
const host = new URL(url).hostname;
const local = host === "localhost" || host === "127.0.0.1";
const client = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
await client.connect();

let rows;
try {
  ({ rows } = await client.query(
    `SELECT id, created_at, conversation, visitor, page, question, reply, outcome,
            model, input_tokens, output_tokens
       FROM chat_messages
      WHERE created_at >= now() - make_interval(days => $1)
      ORDER BY created_at, id`,
    [days],
  ));
} catch (err) {
  // 42P01: the table is created with the first saved question.
  if (err.code === "42P01") rows = [];
  else throw err;
} finally {
  await client.end();
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

if (rows.length === 0) {
  console.log(`No questions in the last ${days} day${days === 1 ? "" : "s"}.`);
  process.exit(0);
}

// One block per conversation, ordered by when it started.
const conversations = new Map();
for (const row of rows) {
  const key = row.conversation || `row-${row.id}`;
  if (!conversations.has(key)) conversations.set(key, []);
  conversations.get(key).push(row);
}

const stamp = (date) => date.toISOString().slice(0, 16).replace("T", " ");
const indent = (text) => text.replace(/\n/g, "\n     ");

for (const turns of conversations.values()) {
  const first = turns[0];
  const count = `${turns.length} question${turns.length === 1 ? "" : "s"}`;
  console.log(`\n── ${stamp(first.created_at)} UTC · ${first.page} · visitor ${first.visitor} · ${count}`);
  for (const turn of turns) {
    console.log(`  Q  ${indent(turn.question)}`);
    if (turn.reply) console.log(`  A  ${indent(turn.reply)}`);
    else console.log(`     (${turn.outcome}: no AI answer)`);
  }
}

const outcomes = {};
let input = 0;
let output = 0;
let cost = 0;
for (const row of rows) {
  outcomes[row.outcome] = (outcomes[row.outcome] || 0) + 1;
  input += row.input_tokens || 0;
  output += row.output_tokens || 0;
  const price = PRICES[row.model];
  if (price) cost += ((row.input_tokens || 0) * price.input + (row.output_tokens || 0) * price.output) / 1e6;
}

const visitors = new Set(rows.map((row) => row.visitor)).size;
console.log(`\nLast ${days} day${days === 1 ? "" : "s"}: ${rows.length} questions, ${conversations.size} conversations, ` +
  `${visitors} visitor hashes (these reset on each deploy)`);
console.log(`Outcomes: ${Object.entries(outcomes).map(([name, n]) => `${name} ${n}`).join(", ")}`);
console.log(`Tokens: ${input.toLocaleString()} in, ${output.toLocaleString()} out · about $${cost.toFixed(4)}`);
