/* ============================================================================
 *  Workplace Flourishing Survey — app.js (the survey engine)
 * ----------------------------------------------------------------------------
 *  Flow: Landing+Consent -> Participant -> items (one per screen, auto-advance)
 *        -> demographics (one per screen) -> submit -> thank-you
 *  - Mixed response scales, reverse keying, FAWS randomization
 *  - Mandatory by construction: selecting an answer auto-advances (~300ms);
 *    no Continue button on question screens. Back button always available.
 *  - No visible option numbers (values still stored internally for scoring).
 *  - Demographics harmonised with the printed paper form.
 *  - Accessible: radio groups, number-key + arrow shortcuts, focus management.
 *  - Local autosave + resume; section + final submission to Google Sheets.
 * ========================================================================== */
(function () {
  "use strict";

  const CFG = window.SURVEY_CONFIG;
  const LS_KEY = "wfs_survey_state_v3";
  const ADVANCE_MS = 300;

  /* ----------------------------------------------------------------- utils */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, attrs, children) => {
    const node = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] === true) node.setAttribute(k, "");
      else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  };
  const uid = () => "R-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seededShuffle(arr, seed) { const r = mulberry32(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function detectDevice() {
    const ua = navigator.userAgent, w = window.screen.width, h = window.screen.height;
    let type = "desktop";
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) type = "mobile";
    else if (/iPad|Tablet/i.test(ua)) type = "tablet";
    let browser = "Unknown";
    if (/Edg\//.test(ua)) browser = "Edge"; else if (/OPR\//.test(ua)) browser = "Opera";
    else if (/Chrome\//.test(ua)) browser = "Chrome"; else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Safari\//.test(ua)) browser = "Safari";
    return { deviceType: type, browser: browser, screen: w + "x" + h, viewport: window.innerWidth + "x" + window.innerHeight, userAgent: ua };
  }

  /* ---------------------------------------------------------------- state */
  let state = loadState();
  function freshState() {
    return {
      respondentId: uid(), seed: 0,
      startedAt: new Date().toISOString(), startMs: Date.now(),
      consent: false,
      participant: { fullName: "", prizeOptIn: null, email: "", mobile: "" },
      honeypot: "",
      responses: {}, timing: {}, attention: {}, demographics: {}, diligence: null,
      screenIndex: 0, submitted: false, device: detectDevice()
    };
  }
  function loadState() { try { const s = JSON.parse(localStorage.getItem(LS_KEY)); return s && s.respondentId ? s : null; } catch (e) { return null; } }
  function saveState() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} flashSave(); }
  let saveTimer = null;
  function flashSave() { const s = $("#saveStatus"); if (!s) return; s.textContent = "Progress saved"; clearTimeout(saveTimer); saveTimer = setTimeout(() => { s.textContent = ""; }, 1300); }

  /* ------------------------------------------------ build the screen list */
  let SCREENS = [], SCALE_ITEM_INDEX = {}, TOTAL_SCORED = 0, DEMO_INDEX = {};
  function buildScreens() {
    const screens = [];
    screens.push({ type: "welcome" });
    screens.push({ type: "participant" });

    // Randomize ONLY within a construct. Items from different constructs are
    // never intermixed. For FAWS (groupBy:"dim"), items are shuffled within
    // each sub-dimension and the sub-dimensions stay grouped & in order.
    const stream = [];
    CFG.blocks.forEach((block, bi) => {
      let items = block.items.slice();
      if (block.groupBy) {
        const order = [], buckets = {};
        block.items.forEach((it) => { const k = it[block.groupBy]; if (!(k in buckets)) { buckets[k] = []; order.push(k); } buckets[k].push(it); });
        items = [];
        order.forEach((k, gi) => {
          const g = block.randomizeItems ? seededShuffle(buckets[k], state.seed + bi * 101 + gi) : buckets[k];
          g.forEach((x) => items.push(x));
        });
      } else if (block.randomizeItems) {
        items = seededShuffle(items, state.seed + bi);
      }
      items.forEach((it) => stream.push({ type: "item", blockId: block.id, instruction: block.instruction || null, item: it }));
    });
    const checksByPos = {};
    (CFG.attentionChecks || []).forEach((c) => { checksByPos[c.insertAfterScaleItem] = c; });
    let scored = 0;
    stream.forEach((s) => {
      screens.push(s); scored++; SCALE_ITEM_INDEX[s.item.id] = scored;
      if (checksByPos[scored]) { screens.push({ type: "attention", check: checksByPos[scored] }); scored++; }
    });
    TOTAL_SCORED = scored;

    CFG.demographics.forEach((d, i) => { DEMO_INDEX[d.id] = i + 1; screens.push({ type: "demo", demo: d }); });
    screens.push({ type: "submit" });
    screens.push({ type: "thankyou" });
    return screens;
  }

  /* --------------------------------------------------- progress reporting */
  function milestoneFor(pct) { let lbl = ""; (CFG.progressMilestones || []).forEach((m) => { if (pct >= m.atPercent) lbl = m.label; }); return lbl; }
  function updateProgress(screen) {
    const header = $("#progressHeader");
    const show = screen.type === "item" || screen.type === "attention";
    header.hidden = !show; if (!show) return;
    let pos = 0;
    if (screen.type === "item") pos = SCALE_ITEM_INDEX[screen.item.id];
    else if (screen.type === "attention") pos = screen.check.insertAfterScaleItem + 1;
    const pct = Math.round((pos / TOTAL_SCORED) * 100);
    $("#progressCount").textContent = "Question " + pos + " of " + TOTAL_SCORED;
    $("#progressPct").textContent = pct + "%";
    $("#progressMilestone").textContent = milestoneFor(pct);
    $("#progressFill").style.width = pct + "%";
  }

  /* --------------------------------------------------- keyboard shortcuts */
  let keyHandler = null;
  function clearKeys() { if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; } }
  function bindKeys(maxN, selectFn) {
    clearKeys();
    keyHandler = function (e) {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= maxN) selectFn(n);
    };
    document.addEventListener("keydown", keyHandler);
  }

  /* ----------------------------------------------------------- rendering */
  let screenShownAt = 0;
  function render() {
    clearKeys();
    const screen = SCREENS[state.screenIndex]; if (!screen) return;
    updateProgress(screen);
    const app = $("#app"); app.innerHTML = ""; screenShownAt = Date.now();
    const node = ({
      welcome: renderWelcome, participant: renderParticipant,
      item: renderItem, attention: renderAttention, demo: renderDemo,
      submit: renderSubmit, thankyou: renderThankYou
    })[screen.type](screen);
    app.appendChild(el("div", { class: "screen" }, [node]));
    window.scrollTo(0, 0);
  }
  function go(delta) { const next = state.screenIndex + delta; if (next < 0 || next >= SCREENS.length) return; state.screenIndex = next; saveState(); render(); }

  /* -------- reusable auto-advancing choice screen -------- */
  function choiceCard(opts) {
    // opts: { eyebrow, instruction, text, labels, getValue(val->bool by index+1),
    //         isSelected(i), onChoose(i, advance), showBack }
    const group = el("div", { class: "options", role: "radiogroup" });
    group.setAttribute("aria-label", opts.text);
    let advancing = false;
    function choose(i) {
      if (advancing) return;
      Array.prototype.forEach.call(group.children, (o, idx) => { const on = idx === i; o.classList.toggle("selected", on); o.setAttribute("aria-checked", on ? "true" : "false"); });
      advancing = true; clearKeys();
      // gently fade the current screen out during the advance delay
      const scr = $("#app .screen"); if (scr) scr.classList.add("leaving");
      opts.onChoose(i, () => setTimeout(() => go(1), ADVANCE_MS));
    }
    opts.labels.forEach((label, i) => {
      const sel = opts.isSelected(i);
      const opt = el("button", { class: "option" + (sel ? " selected" : ""), type: "button", role: "radio" });
      opt.setAttribute("aria-checked", sel ? "true" : "false");
      opt.appendChild(el("span", { class: "dot" }));
      opt.appendChild(el("span", null, [label]));
      opt.addEventListener("click", () => choose(i));
      group.appendChild(opt);
    });
    const kids = [];
    if (opts.eyebrow) kids.push(el("p", { class: "eyebrow" }, [opts.eyebrow]));
    if (opts.instruction) kids.push(el("div", { class: "scale-instruction" }, [opts.instruction]));
    const h = el("p", { class: "q-text", tabindex: "-1" }, [opts.text]); kids.push(h);
    kids.push(group);
    if (opts.showBack) kids.push(el("div", { class: "nav" }, [el("button", { class: "btn-back", onclick: () => go(-1) }, ["← Back"])]));
    bindKeys(opts.labels.length, (n) => choose(n - 1));
    setTimeout(() => { try { h.focus(); } catch (e) {} }, 0);
    return el("div", { class: "card" }, kids);
  }

  /* -------- Landing + Consent -------- */
  function renderWelcome() {
    const r = CFG.study.researcher;
    const cb = el("input", { type: "checkbox", id: "consentBox" }); cb.checked = !!state.consent;
    const beginBtn = el("button", { class: "btn btn-primary", disabled: !state.consent, onclick: () => { if (cb.checked) { state.consent = true; saveState(); go(1); } } }, ["Begin"]);
    cb.addEventListener("change", () => { state.consent = cb.checked; beginBtn.disabled = !cb.checked; });

    const cards = el("div", { class: "info-grid" }, [
      el("div", { class: "info-card" }, [el("div", { class: "ic" }, ["⏱️"]), el("div", { class: "it" }, ["About " + CFG.study.estimatedMinutes + " minutes"]), el("div", { class: "id" }, ["One short question at a time."])]),
      el("div", { class: "info-card" }, [el("div", { class: "ic" }, ["🔒"]), el("div", { class: "it" }, ["Confidential"]), el("div", { class: "id" }, ["Your answers are anonymous and used only for research."])]),
      el("div", { class: "info-card" }, [el("div", { class: "ic" }, ["✋"]), el("div", { class: "it" }, ["Voluntary"]), el("div", { class: "id" }, ["You can stop at any time."])]),
      el("div", { class: "info-card" }, [el("div", { class: "ic" }, ["🎓"]), el("div", { class: "it" }, ["Academic study"]), el("div", { class: "id" }, [r.institution])])
    ]);

    const researcher = el("div", { class: "researcher-card" }, [
      el("div", { class: "rc-label" }, ["Conducted by"]),
      el("div", { class: "rc-name" }, [r.name]),
      el("div", { class: "rc-sub" }, [(r.designation ? r.designation + " · " : "") + r.institution]),
      el("a", { class: "rc-email", href: "mailto:" + r.email }, [r.email])
    ]);

    const kids = [
      el("span", { class: "hero-badge" }, ["Research Study"]),
      el("h1", { class: "hero-title" }, [CFG.study.title]),
      el("p", { class: "hero-sub" }, [CFG.study.subtitle + " Your honest answers will help researchers better understand well-being at work."]),
      cards
    ];
    if (CFG.incentive && CFG.incentive.enabled) {
      kids.push(el("div", { class: "prize-banner" }, [
        el("div", { class: "pe" }, ["🎁"]),
        el("div", null, [el("div", { class: "pt" }, [CFG.incentive.headline]), el("div", { class: "pd" }, [CFG.incentive.short + " Optional — we'll ask on the next screen."])])
      ]));
    }
    kids.push(researcher);
    kids.push(el("label", { class: "consent-check" }, [cb, el("span", null, ["I am 18 or older and I agree to take part in this study."])]));
    kids.push(el("div", { class: "nav" }, [beginBtn]));
    return el("div", { class: "card" }, kids);
  }

  /* -------- Participant info -------- */
  function renderParticipant() {
    const p = state.participant;
    const nameInput = el("input", { type: "text", id: "fullName", value: p.fullName || "", placeholder: "Your full name", autocomplete: "name" });
    const nameErr = el("div", { class: "error-text", id: "nameErr" }); nameErr.style.display = "none";
    const hp = el("input", { type: "text", class: "hp", tabindex: "-1", autocomplete: "off", value: state.honeypot || "" });
    const contactWrap = el("div", { id: "contactWrap" });
    const continueBtn = el("button", { class: "btn btn-primary", disabled: true }, ["Continue"]);

    function valid() {
      if (!nameInput.value.trim()) return false;
      if (p.prizeOptIn == null) return false;
      if (p.prizeOptIn === true) {
        const email = $("#email", contactWrap), mob = $("#mobile", contactWrap);
        const okEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
        const okMob = mob && mob.value.replace(/\D/g, "").length >= 7;
        if (!okEmail || !okMob) return false;
      }
      return true;
    }
    function refresh() { continueBtn.disabled = !valid(); }
    function renderContact() {
      contactWrap.innerHTML = "";
      if (p.prizeOptIn === true) {
        const email = el("input", { type: "email", id: "email", value: p.email || "", placeholder: "name@example.com", autocomplete: "email" });
        const mob = el("input", { type: "tel", id: "mobile", value: p.mobile || "", placeholder: "Mobile number", autocomplete: "tel" });
        email.addEventListener("input", refresh); mob.addEventListener("input", refresh);
        contactWrap.appendChild(el("div", { class: "field" }, [el("label", null, ["Email address ", el("span", { class: "required-star" }, ["*"])]), email]));
        contactWrap.appendChild(el("div", { class: "field" }, [el("label", null, ["Mobile number ", el("span", { class: "required-star" }, ["*"])]), mob]));
      }
      refresh();
    }
    const yesBtn = el("button", { class: "option" + (p.prizeOptIn === true ? " selected" : ""), type: "button" }, [el("span", { class: "dot" }), el("span", null, ["Yes, enter me"])]);
    const noBtn = el("button", { class: "option" + (p.prizeOptIn === false ? " selected" : ""), type: "button" }, [el("span", { class: "dot" }), el("span", null, ["No, thanks"])]);
    function setOpt(v) { p.prizeOptIn = v; yesBtn.classList.toggle("selected", v === true); noBtn.classList.toggle("selected", v === false); renderContact(); saveState(); }
    yesBtn.addEventListener("click", () => setOpt(true)); noBtn.addEventListener("click", () => setOpt(false));
    nameInput.addEventListener("input", () => { nameErr.style.display = "none"; refresh(); });
    renderContact();

    continueBtn.addEventListener("click", () => {
      if (!valid()) return;
      p.fullName = nameInput.value.trim(); state.honeypot = hp.value;
      if (p.prizeOptIn === true) { p.email = $("#email", contactWrap).value.trim(); p.mobile = $("#mobile", contactWrap).value.trim(); }
      else { p.email = ""; p.mobile = ""; }
      saveState(); flushPartial("participant"); go(1);
    });

    return el("div", { class: "card" }, [
      el("p", { class: "eyebrow" }, ["Before we start"]),
      el("h1", { class: "q-text" }, ["A couple of quick details"]),
      el("div", { class: "field" }, [el("label", null, ["Full name ", el("span", { class: "required-star" }, ["*"])]), nameInput, nameErr]),
      hp,
      el("div", { class: "field" }, [el("label", null, ["Would you like to be entered into the optional ₹1,000 thank-you draw?"]), el("div", { class: "choice-row" }, [yesBtn, noBtn])]),
      contactWrap,
      el("p", { class: "muted-note" }, ["If you enter, your contact details are kept separate from your answers and used only for the draw."]),
      el("div", { class: "nav" }, [el("button", { class: "btn-back", onclick: () => go(-1) }, ["← Back"]), continueBtn])
    ]);
  }

  /* -------- Item / Attention (auto-advance, no numbers) -------- */
  function renderItem(s) {
    const it = s.item, sc = CFG.responseScales[it.scale];
    return choiceCard({
      instruction: s.instruction, text: it.text, labels: sc.anchors, showBack: true,
      isSelected: (i) => state.responses[it.id] === i + 1,
      onChoose: (i, advance) => { state.responses[it.id] = i + 1; state.timing[it.id] = Date.now() - screenShownAt; saveState(); advance(); }
    });
  }
  function renderAttention(s) {
    const c = s.check, sc = CFG.responseScales[c.scale];
    return choiceCard({
      text: c.text, labels: sc.anchors, showBack: true,
      isSelected: (i) => state.attention[c.id] === i + 1,
      onChoose: (i, advance) => { state.attention[c.id] = i + 1; state.timing[c.id] = Date.now() - screenShownAt; saveState(); flushPartial("attention"); advance(); }
    });
  }

  /* -------- Demographics: one per screen (cards auto-advance, text + Continue) -------- */
  function renderDemo(s) {
    const d = s.demo, pos = DEMO_INDEX[d.id], total = CFG.demographics.length;
    const eyebrow = "About you · " + pos + " of " + total;
    if (d.type === "text") {
      const input = el("input", { type: "text", id: "demo_" + d.id, value: state.demographics[d.id] || "", placeholder: "Type your answer", autocomplete: "organization-title" });
      const nextBtn = el("button", { class: "btn btn-primary", disabled: !(state.demographics[d.id] || "").trim() }, ["Continue"]);
      function commitAndGo() { const v = input.value.trim(); if (!v) return; state.demographics[d.id] = v; saveState(); go(1); }
      input.addEventListener("input", () => { state.demographics[d.id] = input.value; nextBtn.disabled = !input.value.trim(); saveState(); });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); commitAndGo(); } });
      nextBtn.addEventListener("click", commitAndGo);
      setTimeout(() => { try { input.focus(); } catch (e) {} }, 0);
      return el("div", { class: "card" }, [
        el("p", { class: "eyebrow" }, [eyebrow]),
        el("p", { class: "q-text" }, [d.label]),
        el("div", { class: "field" }, [input]),
        el("div", { class: "nav" }, [el("button", { class: "btn-back", onclick: () => go(-1) }, ["← Back"]), nextBtn])
      ]);
    }
    return choiceCard({
      eyebrow: eyebrow, text: d.label, labels: d.options, showBack: true,
      isSelected: (i) => state.demographics[d.id] === d.options[i],
      onChoose: (i, advance) => { state.demographics[d.id] = d.options[i]; saveState(); advance(); }
    });
  }

  /* -------- Submit + Thank-you -------- */
  function renderSubmit() {
    const statusBox = el("p", { class: "muted-note" }, ["Saving your responses…"]);
    const card = el("div", { class: "card center" }, [el("div", { class: "big-emoji" }, ["⏳"]), el("p", { class: "q-text" }, ["Finishing up"]), statusBox]);
    submitFinal(statusBox);
    return card;
  }
  function renderThankYou() {
    const r = CFG.study.researcher;
    return el("div", { class: "card center" }, [
      el("div", { class: "big-emoji" }, ["🌳"]),
      el("h1", { class: "q-text" }, ["Thank you."]),
      el("p", { class: "lead" }, ["Your responses have been successfully recorded."]),
      el("p", { class: "muted-note" }, ["If you entered the draw, we'll use your contact details only to notify winners."]),
      el("p", { class: "muted-note" }, [r.name + " · " + (r.designation ? r.designation + ", " : "") + r.institution + " · ", el("a", { class: "rc-email", href: "mailto:" + r.email }, [r.email])])
    ]);
  }

  /* --------------------------------------------------- scoring & quality */
  function computeScores() {
    const byConstruct = {};
    CFG.blocks.forEach((block) => {
      const vals = [];
      block.items.forEach((it) => {
        let v = state.responses[it.id]; if (v == null) return;
        if (it.reverse) { const max = CFG.responseScales[it.scale].anchors.length; v = (max + 1) - v; }
        vals.push(v);
      });
      if (vals.length) { const sum = vals.reduce((a, b) => a + b, 0); byConstruct[block.construct] = { sum: sum, mean: +(sum / vals.length).toFixed(3), n: vals.length }; }
    });
    return byConstruct;
  }
  function computeQuality() {
    const q = CFG.quality;
    const orderedIds = SCREENS.filter((s) => s.type === "item").map((s) => s.item.id);
    const rawSeq = orderedIds.map((id) => state.responses[id]).filter((v) => v != null);
    let longest = 0, run = 0, prev = null;
    rawSeq.forEach((v) => { if (v === prev) run++; else { run = 1; prev = v; } if (run > longest) longest = run; });
    const all = rawSeq.slice();
    const mean = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
    const sd = all.length ? Math.sqrt(all.reduce((a, b) => a + (b - mean) * (b - mean), 0) / all.length) : 0;
    const times = Object.values(state.timing).map((m) => m / 1000).filter((x) => x > 0); times.sort((a, b) => a - b);
    const medianTime = times.length ? times[Math.floor(times.length / 2)] : 0;
    const tooFast = times.filter((t) => t < q.minSecondsPerItem).length;
    const tooFastProp = times.length ? tooFast / times.length : 0;
    let attScore = 0; const attDetail = {};
    (CFG.attentionChecks || []).forEach((c) => { const passed = state.attention[c.id] === c.correctValue; attDetail[c.id] = passed; if (passed) attScore++; });
    const totalChecks = (CFG.attentionChecks || []).length;
    const answered = rawSeq.length, expected = orderedIds.length;
    const demoDone = CFG.demographics.every((d) => { const v = state.demographics[d.id]; return v != null && String(v).trim() !== ""; });
    const complete = answered >= expected && demoDone;
    let score = 100;
    (CFG.attentionChecks || []).forEach((c) => { if (!attDetail[c.id]) score -= 35; });
    if (medianTime && medianTime < q.minSecondsPerItem) score -= 25;
    if (tooFastProp > q.tooFastProportionFlag) score -= 15;
    if (longest >= q.longstringHardFlag) score -= 25; else if (longest >= q.longstringFlag) score -= 15;
    if (sd < q.minResponseSD) score -= 20;
    if (!complete) score -= 30;
    score = Math.max(0, Math.min(100, score));
    const totalSeconds = Math.round((Date.now() - state.startMs) / 1000);
    const eligible = !!(state.participant.prizeOptIn === true && complete && (!q.requireBothAttentionChecks || attScore === totalChecks) && score >= q.passingQualityScore && !state.honeypot);
    return {
      startTime: state.startedAt, endTime: new Date().toISOString(), totalSeconds: totalSeconds,
      medianSecondsPerItem: +medianTime.toFixed(2), tooFastCount: tooFast, tooFastProportion: +tooFastProp.toFixed(3),
      longestStraightLine: longest, responseSD: +sd.toFixed(3),
      attentionScore: attScore, attentionTotal: totalChecks, attentionDetail: attDetail,
      diligenceSelfReport: state.diligence, itemsAnswered: answered, itemsExpected: expected,
      complete: complete, honeypotTriggered: !!state.honeypot, qualityScore: score, prizeEligible: eligible, device: state.device
    };
  }

  /* ----------------------------------------------------------- submission */
  function buildPayload(action) {
    return {
      action: action, sharedSecret: (CFG.backend && CFG.backend.sharedSecret) || "",
      respondentId: state.respondentId, seed: state.seed, consent: state.consent,
      participant: state.participant, responses: state.responses, attention: state.attention,
      demographics: state.demographics, diligence: state.diligence, timing: state.timing,
      scores: computeScores(), quality: computeQuality()
    };
  }
  function backendConfigured() { return CFG.backend && CFG.backend.appsScriptUrl && /^https?:\/\//.test(CFG.backend.appsScriptUrl); }
  async function postToBackend(payload) {
    if (!backendConfigured()) { console.log("[DEMO MODE] would send:", payload.action, payload.respondentId); return { ok: true, demo: true }; }
    const res = await fetch(CFG.backend.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    return res.json().catch(() => ({ ok: res.ok }));
  }
  function flushPartial(phase) { try { const payload = buildPayload("save"); payload.phase = phase; postToBackend(payload).catch(() => {}); } catch (e) {} }
  async function submitFinal(statusBox) {
    state.submitted = true; saveState();
    const payload = buildPayload("submit"); let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try { const r = await postToBackend(payload); ok = r && (r.ok !== false); } catch (e) { ok = false; }
      if (!ok) await new Promise((res) => setTimeout(res, 1200));
    }
    if (statusBox) statusBox.textContent = ok ? "Saved." : "Saved on this device.";
    if (ok && backendConfigured()) { try { localStorage.removeItem(LS_KEY); } catch (e) {} }
    setTimeout(() => go(1), 600);
  }

  /* ------------------------------------------------------------- boot up */
  function boot() {
    if (!CFG) { $("#app").innerHTML = "<div class='card'>Configuration not loaded. Please check config.js.</div>"; return; }
    const resuming = !!(state && !state.submitted && (Object.keys(state.responses).length > 0 || state.consent));
    if (!state) state = freshState();
    if (!state.seed) state.seed = hashStr(state.respondentId);
    state.device = detectDevice();
    SCREENS = buildScreens();
    if (state.screenIndex >= SCREENS.length) state.screenIndex = 0;
    saveState();
    if (resuming && state.screenIndex > 1) {
      $("#app").innerHTML = "";
      $("#app").appendChild(el("div", { class: "screen" }, [el("div", { class: "card center" }, [
        el("div", { class: "big-emoji" }, ["↩️"]),
        el("h1", { class: "q-text" }, ["Welcome back"]),
        el("p", { class: "lead" }, ["You have a survey in progress on this device. Continue where you left off?"]),
        el("div", { class: "nav" }, [
          el("button", { class: "btn-back", onclick: () => { localStorage.removeItem(LS_KEY); state = freshState(); state.seed = hashStr(state.respondentId); SCREENS = buildScreens(); saveState(); render(); } }, ["Start over"]),
          el("button", { class: "btn btn-primary", onclick: () => render() }, ["Continue"])
        ])
      ])]));
    } else { render(); }
  }
  window.addEventListener("beforeunload", function (e) { if (state && !state.submitted && Object.keys(state.responses).length > 0) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("DOMContentLoaded", boot);
})();
