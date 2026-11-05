# Matt Pocock Skills and Agent Workflow Evidence

## Honest usage record

This evidence file was prepared during the project follow-up. It distinguishes skill guidance from code that was actually generated or tested.

| Skill | Repository path | How its guidance was used | What it did not do |
|---|---|---|---|
| `to-spec` | [skills/engineering/to-spec](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec) | Synthesized the conversation and inspected code into `docs/PROJECT_PLAN.md`, including user roles, architecture, schema, risks, and acceptance criteria. | It did not create application code. The skill expects publishing a spec to a configured issue tracker; no tracker was configured, so the project plan is a local artifact instead. |
| `tdd` | [skills/engineering/tdd](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd) | Consulted its behavior-focused seam guidance when writing the acceptance checks in `docs/PROJECT_PLAN.md`. | The prior buyer/seller feature was not implemented as a strict red-green-refactor cycle, and this record does not claim otherwise. |

The skills were read from Matt Pocock's public `mattpocock/skills` repository during this follow-up. No skill was claimed to generate an artifact or code that it did not generate.

## Agent-assisted development record

1. **Requirements:** turn the supplied WS-101 defense rubric into a computer-parts buy/sell marketplace.
2. **Implementation:** create a Next.js App Router storefront with product imagery, search/category filtering, account dialogs, seller listing controls, and responsive styling.
3. **Backend setup:** configure Supabase Auth/client and write SQL for user profiles, roles, listings, signup profile creation, seller upgrade, and RLS.
4. **Debug/revision:** a live REST check showed `public.products` was absent. The page was revised to report the missing migration rather than imply the database was ready.
5. **Buyer data:** add private saved parts, persistent cart quantities, order history, and a database RPC that calculates order totals and writes item snapshots atomically. Checkout is an order request only; it does not collect payment.
6. **Validation:** `npm run lint` and `npm run build` passed after wiring the buyer/seller, saved items, cart, and order-request flows. Browser interaction verified the signup role choices; live database operations still require the migrations to be applied.
7. **Catalog:** add 28 starter products through a repeatable, ordered SQL migration as public read-only seed listings, without fabricating Auth accounts.
8. **Not yet verified:** applying all three migrations to the hosted project, real signup/email confirmation, persistent listing CRUD, separate-account RLS denial, saved/cart restoration, and order-request persistence. Complete these before claiming a live end-to-end database demo.

## Example development prompts

- “Create a computer-parts buy-and-sell website with images.”
- “No account for user and seller—make it full stack and rely on Supabase.”
- “Make checkout create an order request; do not collect real payment.”

## Student defense notes

- Explain which code was agent-assisted and personally verify the actual changed files before presenting.
- Demonstrate RLS in Supabase, not merely the frontend role checks.
- Do not show credentials. `.env.local` is private and ignored by Git.
- The current configured backend is hosted Supabase. The course rubric specifically asks for self-hosted Supabase with Docker; demonstrate the local Docker instance separately if required.
- Partsy order requests are not payment processing. Apply all migrations in timestamp order and verify persistence before the defense.
