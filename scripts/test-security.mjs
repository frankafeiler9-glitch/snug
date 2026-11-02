// Security check: proves one couple can never see or change another couple's data.
//
// Run with:  npm run test:security
//
// It logs in as four test accounts in your Supabase project (creating them the
// first time; requires "Confirm email" to be OFF):
//   a1 + a2 → couple A      b1 → couple B (alone)      c1 → not in any couple
// Then it tries things that should be allowed or blocked and prints ✓ or ✗.
// Add checks here whenever a new table is added.

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = "snug-test-password";
if (!URL || !KEY) throw new Error("Missing Supabase settings. Is .env.local filled in?");

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${label}${!ok && detail ? `  (${detail})` : ""}`);
}

const newClient = () => createClient(URL, KEY, { auth: { persistSession: false } });

// Log in as a test person, creating the account the first time.
async function person(tag, name) {
  const client = newClient();
  const email = `snugtest.${tag}@gmail.com`;
  let { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) {
    ({ data, error } = await client.auth.signUp({ email, password: PASSWORD, options: { data: { display_name: name } } }));
    if (error || !data.session) throw new Error(`Could not create ${email}: ${error?.message ?? "no session (is Confirm email on?)"}`);
  }
  return { client, id: data.user.id, name };
}

async function coupleOf(p) {
  const { data } = await p.client.rpc("my_couple_id");
  return data;
}

// ─── Setup ──────────────────────────────────────────────────────────────
const a1 = await person("a1", "Ava");
const a2 = await person("a2", "Ari");
const b1 = await person("b1", "Ben");
const c1 = await person("c1", "Cal");

if (!(await coupleOf(a1))) await a1.client.rpc("create_couple", { space_name: "Test couple A" });
if (!(await coupleOf(a2))) {
  const { data: couple } = await a1.client.from("couples").select("invite_code").single();
  const { error } = await a2.client.rpc("join_couple", { code: couple.invite_code });
  if (error) throw new Error(`a2 could not join couple A: ${error.message}`);
}
if (!(await coupleOf(b1))) await b1.client.rpc("create_couple", { space_name: "Test couple B" });

const coupleA = await coupleOf(a1);
const coupleB = await coupleOf(b1);
console.log("Test accounts ready.\n");

// ─── Logged-out visitors ────────────────────────────────────────────────
const anon = newClient();
check("Logged-out visitor sees no couples", ((await anon.from("couples").select("*")).data ?? []).length === 0);
check("Logged-out visitor sees no profiles", ((await anon.from("profiles").select("*")).data ?? []).length === 0);
check("Logged-out visitor can't create a couple", Boolean((await anon.rpc("create_couple", {})).error));

// ─── Couples & members ──────────────────────────────────────────────────
const aSees = (await a1.client.from("couples").select("id")).data ?? [];
check("Couple A member sees exactly their own couple", aSees.length === 1 && aSees[0].id === coupleA);

const aMembers = (await a1.client.from("couple_members").select("user_id")).data ?? [];
check("Couple A member sees both partners", aMembers.length === 2);

const bSees = (await b1.client.from("couples").select("id")).data ?? [];
check("Couple B member can't see couple A", bSees.length === 1 && bSees[0].id === coupleB);

const bReadsA = (await b1.client.from("couple_members").select("*").eq("couple_id", coupleA)).data ?? [];
check("Couple B member can't see couple A's members", bReadsA.length === 0);

const rename = await b1.client.from("couples").update({ name: "hacked" }).eq("id", coupleA).select();
check("Couple B member can't rename couple A", (rename.data ?? []).length === 0);

const sneak = await c1.client.from("couple_members").insert({ couple_id: coupleA, user_id: c1.id });
check("Outsider can't add themselves to a couple directly", Boolean(sneak.error));

const badCode = await c1.client.rpc("join_couple", { code: "ZZZZZZ" });
check("Joining with a wrong code fails", Boolean(badCode.error));

const twice = await b1.client.rpc("create_couple", {});
check("Can't be in two couples at once", Boolean(twice.error));

const codeChange = await a1.client.from("couples").update({ invite_code: "AAAAAA" }).eq("id", coupleA).select();
check("Members can't set their own invite code", Boolean(codeChange.error) || (codeChange.data ?? []).length === 0);

const { data: aCouple } = await a1.client.from("couples").select("invite_code").single();
check("Invite code is cleared once both partners joined", aCouple?.invite_code === null);

// ─── Profiles ───────────────────────────────────────────────────────────
const aProfiles = ((await a1.client.from("profiles").select("id")).data ?? []).map((p) => p.id).sort();
check("Couple A member sees own + partner's profile only", JSON.stringify(aProfiles) === JSON.stringify([a1.id, a2.id].sort()));

const bProfiles = ((await b1.client.from("profiles").select("id")).data ?? []).map((p) => p.id);
check("Couple B member sees only their own profile", bProfiles.length === 1 && bProfiles[0] === b1.id);

const renamePartner = await a1.client.from("profiles").update({ display_name: "hacked" }).eq("id", a2.id).select();
check("You can't rename your partner", (renamePartner.data ?? []).length === 0);

// ─── Grocery list ───────────────────────────────────────────────────────
const marker = `test-item-${Date.now()}`;
const addA = await a1.client.from("grocery_items").insert({ name: marker, category: "dairy" }).select().single();
check("Member can add a grocery item (couple filled in automatically)", !addA.error && addA.data?.couple_id === coupleA, addA.error?.message);
const itemId = addA.data?.id;

const partnerSees = (await a2.client.from("grocery_items").select("id").eq("id", itemId)).data ?? [];
check("Partner sees the item", partnerSees.length === 1);

const outsiderSees = (await b1.client.from("grocery_items").select("id").eq("id", itemId)).data ?? [];
check("Other couple can't see the item", outsiderSees.length === 0);

const outsiderTicks = await b1.client.from("grocery_items").update({ is_checked: true }).eq("id", itemId).select();
check("Other couple can't tick it off", (outsiderTicks.data ?? []).length === 0);

const outsiderDeletes = await b1.client.from("grocery_items").delete().eq("id", itemId).select();
check("Other couple can't delete it", (outsiderDeletes.data ?? []).length === 0);

const plant = await b1.client.from("grocery_items").insert({ name: "sneaky", couple_id: coupleA });
check("Other couple can't add items to our list", Boolean(plant.error));

const tick = await a2.client.from("grocery_items").update({ is_checked: true }).eq("id", itemId).select().single();
check("Partner can tick it off, and we remember who did", tick.data?.checked_by === a2.id, tick.error?.message);

const cleanup = await a1.client.from("grocery_items").delete().eq("id", itemId).select();
check("Member can delete it", (cleanup.data ?? []).length === 1);

// ─── Calendar events ────────────────────────────────────────────────────
const when = { starts_at: "2030-01-01T18:00:00Z", ends_at: "2030-01-01T19:00:00Z" };
const ev = await a1.client.from("events").insert({ title: `test-event-${Date.now()}`, ...when, owner_id: a2.id }).select().single();
check("Member can add an event for their partner", !ev.error && ev.data?.couple_id === coupleA, ev.error?.message);
const evId = ev.data?.id;

check("Partner sees the event", ((await a2.client.from("events").select("id").eq("id", evId)).data ?? []).length === 1);
check("Other couple can't see the event", ((await b1.client.from("events").select("id").eq("id", evId)).data ?? []).length === 0);

const evEdit = await b1.client.from("events").update({ title: "hacked" }).eq("id", evId).select();
check("Other couple can't edit the event", (evEdit.data ?? []).length === 0);

const evDel = await b1.client.from("events").delete().eq("id", evId).select();
check("Other couple can't delete the event", (evDel.data ?? []).length === 0);

const evPlant = await b1.client.from("events").insert({ title: "sneaky", ...when, couple_id: coupleA });
check("Other couple can't add events to our calendar", Boolean(evPlant.error));

const evStranger = await a1.client.from("events").insert({ title: "for a stranger", ...when, owner_id: b1.id });
check("Can't make an event owned by someone outside the couple", Boolean(evStranger.error));

const evBackwards = await a1.client.from("events").insert({ title: "backwards", starts_at: when.ends_at, ends_at: when.starts_at });
check("Events can't end before they start", Boolean(evBackwards.error));

const evOurs = await a2.client.from("events").update({ owner_id: null }).eq("id", evId).select().single();
check("Partner can change it to 'ours'", evOurs.data?.owner_id === null, evOurs.error?.message);

check("Member can delete the event", ((await a1.client.from("events").delete().eq("id", evId).select()).data ?? []).length === 1);

// ─── Result ─────────────────────────────────────────────────────────────
console.log(failures === 0 ? "\nAll security checks passed 🎉" : `\n${failures} check(s) FAILED`);
process.exit(failures === 0 ? 0 : 1);
