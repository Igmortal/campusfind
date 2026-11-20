const ST = ["pending", "approved", "returned", "rejected"];
const main = $("#admin");
let rows = [];

function login(msg = "") {
  main.innerHTML = `<form id="lf" class="card"><h2>Admin sign in</h2>
<label for="em">Email</label><input id="em" type="email" required autocomplete="username">
<label for="pw">Password</label><input id="pw" type="password" required autocomplete="current-password">
<button class="btn dark">Sign in</button><p class="msg err" role="alert">${msg}</p></form>`;
  $("#lf").onsubmit = async e => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({ email: $("#em").value, password: $("#pw").value });
    error ? login("Wrong email or password.") : start();
  };
}

async function start() {
  const { data: s } = await db.auth.getSession();
  if (!s.session) return login();
  const { data: ok } = await db.rpc("is_admin");
  if (!ok) { await db.auth.signOut(); return login("This account is not an admin."); }
  dash();
}

function dash() {
  main.innerHTML = `<div class="bar"><label for="sf" style="position:absolute;left:-999px">Status</label>
<select id="sf"><option value="">All statuses</option>${ST.map(s => `<option>${s}</option>`).join("")}</select>
<button class="btn dark" id="nw">+ New record</button><button class="btn out" id="so">Sign out</button></div>
<p id="count" class="meta" aria-live="polite"></p><div id="rows" class="grid"></div>`;
  $("#sf").onchange = draw;
  $("#nw").onclick = () => edit({ type: "lost", status: "approved" });
  $("#so").onclick = async () => { await db.auth.signOut(); login(); };
  $("#rows").onclick = act;
  refresh();
}

async function refresh() {
  $("#rows").innerHTML = skel(3);
  const { data, error } = await db.from("reports").select("*").order("created_at", { ascending: false });
  if (error) { $("#rows").innerHTML = empty("Couldn't load records", esc(error.message)); return; }
  rows = data; draw();
}

const label = { approved: "Approve", returned: "Mark returned", rejected: "Reject" };
const row = r => `<article class="card item"><span class="tag ${esc(r.type)}">${esc(r.type)}</span> <span class="tag st-${esc(r.status)}">${esc(r.status)}</span>
<h3>${esc(r.item)}</h3><p class="meta">${esc(r.location)} · ${esc(r.date)}</p><p>${esc(r.description)}</p>
<p class="meta">Contact (private): ${esc(r.contact || "none given")}</p>
<div class="acts" data-id="${esc(r.id)}">${Object.keys(label).filter(s => s !== r.status).map(s => `<button data-a="${s}">${label[s]}</button>`).join("")}<button data-a="edit">Edit</button><button data-a="delete">Delete</button></div></article>`;

function draw() {
  const s = $("#sf").value, r = rows.filter(x => !s || x.status === s);
  $("#count").textContent = `${r.length} record${r.length === 1 ? "" : "s"}`;
  $("#rows").innerHTML = r.length ? r.map(row).join("") : empty("No records", "Nothing here for this filter.");
}

async function act(e) {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const id = b.parentElement.dataset.id, a = b.dataset.a;
  if (a === "edit") return edit(rows.find(r => String(r.id) === id));
  let res;
  if (a === "delete") { if (!confirm("Delete this record permanently?")) return; res = await db.from("reports").delete().eq("id", id); }
  else res = await db.from("reports").update({ status: a }).eq("id", id);
  res.error ? alert(res.error.message) : refresh();
}

function edit(r) {
  const d = document.createElement("dialog");
  const sel = (n, o, v) => `<select id="e-${n}" name="${n}">${o.map(x => `<option${x === v ? " selected" : ""}>${x}</option>`).join("")}</select>`;
  const f = (n, l, t = "text") => `<label for="e-${n}">${l}</label>` + (t === "area" ? `<textarea id="e-${n}" name="${n}" rows="3">${esc(r[n])}</textarea>` : `<input id="e-${n}" name="${n}" type="${t}" value="${esc(r[n])}">`);
  d.innerHTML = `<form><h2>${r.id ? "Edit" : "New"} record</h2>
<label for="e-type">Type</label>${sel("type", ["lost", "found"], r.type)}
${f("item", "Item")}${f("location", "Location")}${f("date", "Date", "date")}${f("description", "Description", "area")}${f("contact", "Contact (private)")}
<label for="e-status">Status</label>${sel("status", ST, r.status)}
<div class="btns" style="justify-content:flex-start"><button class="btn dark">Save</button><button type="button" class="btn out" id="cx">Cancel</button></div><p class="msg err" role="alert"></p></form>`;
  document.body.append(d); d.showModal();
  d.onclose = () => d.remove();
  $("#cx").onclick = () => d.close();
  d.querySelector("form").onsubmit = async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.target));
    Object.keys(v).forEach(k => { if (v[k] === "") v[k] = null; });
    const { error } = r.id ? await db.from("reports").update(v).eq("id", r.id) : await db.from("reports").insert(v);
    if (error) d.querySelector(".msg").textContent = error.message; else { d.close(); refresh(); }
  };
}

start();
