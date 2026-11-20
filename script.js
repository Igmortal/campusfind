const CFG = window.CAMPUSFIND; // put your keys in config.js, not here
const db = window.supabase.createClient(CFG.supabaseUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, ""), CFG.supabaseKey.trim());
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Shared header + footer (one place to edit for every page)
const pages = [["index.html", "Home"], ["lost.html", "Report Lost"], ["found.html", "Report Found"], ["reports.html", "Browse Reports"]];
const here = location.pathname.split("/").pop() || "index.html";
document.body.insertAdjacentHTML("afterbegin", `<a class="skip" href="#main">Skip to content</a>
<header class="nav"><a class="brand" href="index.html">Campus<span>Find</span></a>
<button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="menu">☰</button>
<nav id="menu" aria-label="Main">${pages.map(([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav></header>`);
document.body.insertAdjacentHTML("beforeend", `<footer><div class="wrap"><p><b>CampusFind</b> – Your College Lost &amp; Found Portal</p>
<p>A Bachelor of Design college project · Built with HTML, CSS, JavaScript &amp; Supabase · <a href="admin.html" style="color:#cfe3fa">Admin</a></p></div></footer>`);
$(".burger").onclick = e => e.currentTarget.setAttribute("aria-expanded", $("#menu").classList.toggle("open"));

// Data + rendering helpers (public site only shows admin-approved reports)
const COLS = "id,created_at,item,type,location,date,description,status"; // contact is never sent to the public
async function load(limit) {
  let q = db.from("reports").select(COLS).eq("status", "approved").order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q; if (error) throw error; return data;
}
const card = r => `<article class="card item"><span class="tag ${esc(r.type)}">${esc(r.type)}</span><h3>${esc(r.item)}</h3>
<p class="meta">${esc(r.location)} · ${esc(r.date)}</p><p>${esc(r.description)}</p><a class="claim" href="mailto:${esc(CFG.deskEmail)}?subject=${encodeURIComponent((r.type === "lost" ? "I found: " : "Claim: ") + r.item)}">${r.type === "lost" ? "I found this" : "This is mine"}</a></article>`;
const skel = n => '<div class="card skel" aria-hidden="true"></div>'.repeat(n);
const empty = (t, d) => `<div class="empty"><div>🔎</div><h3>${t}</h3><p>${d}</p></div>`;
const fail = () => empty("Couldn't load reports", "Please check your connection and Supabase settings, then refresh.");

// Home: recent items + search
const rec = $("#recent");
if (rec) {
  rec.innerHTML = skel(3);
  load(6).then(d => rec.innerHTML = d.length ? d.map(card).join("") : empty("No reports yet", "Be the first to report a lost or found item.")).catch(() => rec.innerHTML = fail());
}
const hs = $("#hs");
if (hs) hs.onsubmit = e => { e.preventDefault(); location.href = "reports.html?q=" + encodeURIComponent($("#hq").value.trim()); };

// Reports page: live search + filter
const list = $("#list");
if (list) {
  let all = [];
  const run = () => {
    const q = $("#q").value.toLowerCase(), t = $("#t").value;
    const r = all.filter(x => (!t || x.type === t) && [x.item, x.location, x.description].join(" ").toLowerCase().includes(q));
    $("#count").textContent = `${r.length} report${r.length === 1 ? "" : "s"} found`;
    list.innerHTML = r.length ? r.map(card).join("") : empty("Nothing matches yet", "Try different words, or report the item so others can help.");
  };
  $("#q").value = new URLSearchParams(location.search).get("q") || "";
  $("#bar").addEventListener("input", run); $("#bar").addEventListener("change", run);
  list.innerHTML = skel(6);
  load().then(d => { all = d; run(); }).catch(() => list.innerHTML = fail());
}

// Lost / Found report form (page decides type via <body data-type>)
const fw = $("#fw"), T = document.body.dataset.type;
if (fw) {
  const L = T === "lost";
  fw.innerHTML = `<form id="rf" class="card">
<label for="item">Item name</label><input id="item" name="item" required maxlength="80" placeholder="${L ? "e.g. Black backpack" : "e.g. Blue water bottle"}">
<label for="location">${L ? "Where did you last see it?" : "Where did you find it?"}</label><input id="location" name="location" required maxlength="100" placeholder="e.g. Library, 2nd floor">
<label for="date">Date</label><input id="date" name="date" type="date" required max="${new Date().toISOString().slice(0, 10)}">
<label for="description">Description</label><textarea id="description" name="description" rows="4" required maxlength="500" placeholder="Colour, brand, marks. Don't include phone numbers."></textarea>
<label for="contact">Your email or phone</label><input id="contact" name="contact" required maxlength="100" aria-describedby="ch"><p id="ch" class="meta">Private: only moderators can see this, so we can reach you about a match.</p>
<button class="btn dark" id="sb">Submit report</button><p id="msg" role="status" aria-live="polite" class="msg"></p></form>`;
  $("#rf").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, b = $("#sb"), m = $("#msg"), fd = new FormData(f);
    b.disabled = true; b.textContent = "Submitting…"; m.className = "msg"; m.textContent = "";
    const row = { type: T };
    ["item", "location", "date", "description", "contact"].forEach(k => row[k] = String(fd.get(k)).trim());
    const { error } = await db.from("reports").insert(row);   // status defaults to 'pending' in the database
    b.disabled = false; b.textContent = "Submit report";
    if (error) { console.error("Supabase insert error:", error); m.className = "msg err"; m.textContent = "Couldn't save: " + error.message; return; }
    f.reset(); m.className = "msg ok"; m.textContent = "Thank you! Your report was submitted and will appear once a moderator approves it.";
  };
}
