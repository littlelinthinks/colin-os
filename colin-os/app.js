/* ============================================================
   Colin OS · Wiser 风格 PWA 微学习应用
   模块：路由/TABBAR · 智库双模速读(优先级/收藏/状态) · 诊所 · 间隔重复闪卡
        知识库(快速记录/阅读日志/决策日志/复盘引擎/知识图谱) · 我的仪表盘
        全局搜索 · AI 助手 · 内容导出 · 悬浮 TTS 播放器 · 离线缓存
   ============================================================ */
(function () {
  "use strict";

  /* ================= 工具 ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* 去 emoji 防真机豆腐块 */
  function noEmoji(s) {
    try {
      return String(s).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2700}-\u{27BF}]/gu, "").trim();
    } catch (e) { return String(s); }
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function dstr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function todayStr() { return dstr(new Date()); }
  function addDaysStr(n) { var d = new Date(); d.setDate(d.getDate() + n); return dstr(d); }
  function LSget(k, def) { try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
  function LSset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function fetchJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function download(name, mime, text) {
    try {
      var b = new Blob([text], { type: mime });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    } catch (e) { toast("导出失败：" + e.message); }
  }

  /* ================= 内联 SVG 图标（防 emoji 豆腐块） ================= */
  function svg(inner, vb) {
    return '<svg viewBox="' + (vb || "0 0 24 24") + '" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>";
  }
  var IC = {
    library: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    clinic: svg('<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6.5 7.3 10.9 16.2M17.5 7.3 13.1 16.2M7 6h10"/>'),
    cards: svg('<rect x="7" y="3" width="13" height="15" rx="3"/><path d="M4 7v11a3 3 0 0 0 3 3h9"/>'),
    knowledge: svg('<path d="M12 3a5 5 0 0 1 5 5c0 1.6-.8 3-2 4 2.5.8 4 2.5 4 5a6.5 6.5 0 0 1-13 0c0-2.5 1.5-4.2 4-5-1.2-1-2-2.4-2-4a5 5 0 0 1 4-5z"/><path d="M12 10v9"/>'),
    os: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    flame: svg('<path d="M12 2s5.5 4.8 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 9.6 7.5 7.8 8.6 6.4c.4 1.3 1.2 2.4 2.4 3C10.7 7.2 11.3 4.4 12 2z" fill="#D4AF37" stroke="none"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    play: svg('<path d="M8 5v14l11-7z" stroke="none"/>'),
    pause: svg('<rect x="7" y="5" width="3.5" height="14" rx="1" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" stroke="none"/>'),
    headset: svg('<path d="M4 15a8 8 0 0 1 16 0"/><rect x="3" y="15" width="4" height="6" rx="2"/><rect x="17" y="15" width="4" height="6" rx="2"/>'),
    check: svg('<path d="m4 12 5 5L20 7"/>'),
    redo: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    right: svg('<path d="m9 6 6 6-6 6"/>'),
    bolt: svg('<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>'),
    ear: svg('<path d="M4 12a8 8 0 1 1 16 0c0 4-2.5 5-4 7-1 1.3-1.5 3-3.5 3"/><circle cx="12" cy="12" r="3"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="var(--accent-gold)" stroke="none"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    ai: svg('<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'),
    export: svg('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 19h16"/>'),
    graph: svg('<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7 7.3 10.5 16M17 7.3 13.5 16M7.2 6h9.6"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    note: svg('<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>'),
    scale: svg('<path d="M12 4v16M6 8h12"/><path d="M6 8 3.5 14h5z"/><path d="M18 8l-2.5 6h5z"/>'),
    clipboard: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4"/><path d="M9 11h6M9 15h4"/>'),
    trash: svg('<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>'),
    star: svg('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    send: svg('<path d="M4 12l16-7-7 16-2.5-7z"/>')
  };

  /* ================= 主题管理（☀️/🌙） ================= */
  function applyTheme(theme) {
    document.documentElement.classList.remove("dark-theme", "light-theme");
    document.documentElement.classList.add(theme === "dark" ? "dark-theme" : "light-theme");
    try { localStorage.setItem("colinOS_theme", theme); } catch (e) {}
  }
  function toggleTheme() {
    var isDark = document.documentElement.classList.contains("dark-theme");
    applyTheme(isDark ? "light" : "dark");
  }

  /* ================= Confetti 打卡特效 ================= */
  function confettiBurst() {
    var c = document.createElement("canvas");
    c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:700";
    document.body.appendChild(c);
    var ctx = c.getContext("2d");
    var W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    var colors = ["#C5A059", "#D8B977", "#1F2937", "#6B7280", "#ffffff"];
    var ps = [];
    for (var i = 0; i < 130; i++) {
      ps.push({
        x: W / 2, y: H * 0.42,
        vx: (Math.random() - 0.5) * 13, vy: Math.random() * -13 - 4,
        g: 0.28 + Math.random() * 0.22, s: 4 + Math.random() * 6,
        c: colors[i % colors.length], r: Math.random() * 6
      });
    }
    var t0 = Date.now();
    (function loop() {
      var t = Date.now() - t0;
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      ps.forEach(function (p) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r -= 0.02;
        if (p.r > 0.4) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(p.r, 0.5), 0, 7); ctx.fill(); }
        if (p.y < H + 30) alive = true;
      });
      if (t < 1500 && alive) requestAnimationFrame(loop); else c.remove();
    })();
  }

  /* ================= 每日打卡（Streak + 历史） ================= */
  /* 同一天只 +1，卡片完成 / 微行动全完成 / 记阅读日志 均触发 */
  function dayCheckIn() {
    var st = LSget("colinOS_streak", { count: 0, last: null });
    var t = todayStr();
    if (st.last !== t) {
      var y = addDaysStr(-1);
      st.count = (st.last === y) ? (st.count || 0) + 1 : 1;
      st.last = t;
      LSset("colinOS_streak", st);
      var his = LSget("colinOS_checkins", []);
      if (his.indexOf(t) === -1) { his.push(t); LSset("colinOS_checkins", his.slice(-400)); }
      refreshStreakMini();
      toast("打卡成功 · 已连续 " + st.count + " 天");
    }
  }

  /* ================= 模块：Atoms 微行动（Wiser → 2 分钟微行动） ================= */
  var Atoms = (function () {
    function load() { return LSget("colin_todays_actions", { date: todayStr(), items: [] }); }
    function save(a) { LSset("colin_todays_actions", a); }
    function ensureFresh() {
      var a = load();
      if (a.date !== todayStr()) { a = { date: todayStr(), items: [] }; save(a); }
      return a;
    }
    function idOf(title, steps) { return "act-" + hashStr(title + "|" + (steps || []).join("|")); }

    function toggle(title, steps) {
      steps = steps || [];
      var id = idOf(title, steps);
      var a = ensureFresh();
      var existing = a.items.filter(function (it) { return it.id === id; })[0];
      var claimed;
      if (existing) { a.items = a.items.filter(function (it) { return it.id !== id; }); claimed = false; }
      else { a.items.push({ id: id, title: title, steps: steps, done: false }); claimed = true; }
      save(a);
      window.dispatchEvent(new CustomEvent("colin:atoms-changed", { detail: { title: title, claimed: claimed } }));
      return claimed;
    }
    function has(title, steps) { return ensureFresh().items.some(function (it) { return it.id === idOf(title, steps); }); }
    function list() { return ensureFresh().items; }
    function setDone(i, done) {
      var a = ensureFresh(); if (!a.items[i]) return;
      a.items[i].done = done; save(a);
      if (done) {
        var total = (LSget("colinOS_totalActions", 0) || 0) + 1; LSset("colinOS_totalActions", total);
        confettiBurst();
      }
      /* 全部完成 → 今日连胜 +1 */
      if (a.items.length && a.items.every(function (it) { return it.done; })) dayCheckIn();
      refreshStreakMini();
    }
    function removeAt(i) { var a = ensureFresh(); a.items.splice(i, 1); save(a); }
    function resetToday() { save({ date: todayStr(), items: [] }); }
    return {
      toggle: toggle, has: has, list: list, setDone: setDone, removeAt: removeAt, resetToday: resetToday, load: load
    };
  })();
  window.ColinAtoms = Atoms;

  /* ================= 模块：Vault 知识库数据层（localStorage） =================
     笔记(想法/金句/问题/证据) · 阅读日志 · 决策日志 · 复盘 · 收藏书单 · 在读状态 */
  var Vault = (function () {
    function notes() { return LSget("colinOS_notes", []); }
    function saveNotes(v) { LSset("colinOS_notes", v); changed(); }
    function addNote(n) {
      var list = notes();
      var item = { id: "nt-" + Date.now() + "-" + Math.floor(Math.random() * 999), type: n.type || "idea", text: String(n.text || "").trim(), bookId: n.bookId || null, bookTitle: n.bookTitle || "", ts: Date.now() };
      if (!item.text) return null;
      list.unshift(item); saveNotes(list.slice(0, 800));
      return item;
    }
    function delNote(id) { saveNotes(notes().filter(function (n) { return n.id !== id; })); }
    function readlog() { return LSget("colinOS_readlog", []); }
    function addReadLog(l) {
      var list = readlog();
      var item = { id: "rl-" + Date.now(), date: l.date || todayStr(), bookId: l.bookId || null, bookTitle: l.bookTitle || "", minutes: Math.max(0, Number(l.minutes) || 0), note: String(l.note || "").trim(), ts: Date.now() };
      list.unshift(item); LSset("colinOS_readlog", list.slice(0, 500));
      changed();
      dayCheckIn(); /* 记阅读日志也算当日打卡 */
      return item;
    }
    function decisions() { return LSget("colinOS_decisions", []); }
    function addDecision(d) {
      var list = decisions();
      var item = { id: "dc-" + Date.now(), date: d.date || todayStr(), title: String(d.title || "").trim(), options: d.options || [], choice: d.choice || "", rationale: String(d.rationale || "").trim(), result: "", ts: Date.now() };
      if (!item.title) return null;
      list.unshift(item); LSset("colinOS_decisions", list.slice(0, 300)); changed();
      return item;
    }
    function setDecisionResult(id, result) {
      var list = decisions();
      list.forEach(function (d) { if (d.id === id) d.result = String(result || "").trim(); });
      LSset("colinOS_decisions", list); changed();
    }
    function reviews() { return LSget("colinOS_reviews", []); }
    function addReview(r) {
      var list = reviews();
      var item = { id: "rv-" + Date.now(), period: r.period || "week", text: String(r.text || "").trim(), ts: Date.now() };
      if (!item.text) return null;
      list.unshift(item); LSset("colinOS_reviews", list.slice(0, 100)); changed();
      return item;
    }
    function collections() { return LSget("colinOS_collections", []); }
    function saveCollections(v) { LSset("colinOS_collections", v); changed(); }
    function ensureCollection(name) {
      var list = collections();
      var c = list.filter(function (x) { return x.name === name; })[0];
      if (!c) { c = { id: "cl-" + Date.now(), name: name, bookIds: [], ts: Date.now() }; list.push(c); saveCollections(list); }
      return c;
    }
    function toggleFav(bookId, collectionId) {
      var list = collections();
      list.forEach(function (c) {
        if (c.id === collectionId) {
          c.bookIds = c.bookIds || [];
          var i = c.bookIds.indexOf(bookId);
          if (i === -1) c.bookIds.push(bookId); else c.bookIds.splice(i, 1);
        }
      });
      saveCollections(list);
    }
    function isFav(bookId) { return collections().some(function (c) { return (c.bookIds || []).indexOf(bookId) !== -1; }); }
    function bookStatusMap() { return LSget("colinOS_bookStatus", {}); }
    function setBookStatus(bookId, status) {
      var m = bookStatusMap();
      if (status) m[bookId] = status; else delete m[bookId];
      LSset("colinOS_bookStatus", m); changed();
    }
    function changed() { window.dispatchEvent(new CustomEvent("colin:vault-changed")); }
    function allData() {
      return {
        exportedAt: new Date().toISOString(),
        streak: LSget("colinOS_streak", { count: 0, last: null }),
        checkins: LSget("colinOS_checkins", []),
        totalActions: LSget("colinOS_totalActions", 0) || 0,
        bookStatus: bookStatusMap(),
        collections: collections(),
        notes: notes(),
        readlog: readlog(),
        decisions: decisions(),
        reviews: reviews()
      };
    }
    return {
      notes: notes, addNote: addNote, delNote: delNote,
      readlog: readlog, addReadLog: addReadLog,
      decisions: decisions, addDecision: addDecision, setDecisionResult: setDecisionResult,
      reviews: reviews, addReview: addReview,
      collections: collections, ensureCollection: ensureCollection, toggleFav: toggleFav, isFav: isFav,
      bookStatusMap: bookStatusMap, setBookStatus: setBookStatus,
      allData: allData
    };
  })();
  window.ColinVault = Vault;

  /* ================= 数据 ================= */
  var DATA = { books: null, models: null, principles: null, pillars: null };

  /* ================= 应用状态 ================= */
  var state = {
    tab: "library",
    lib: { q: "", cat: "", open: null, filter: "all" },
    kn: { seg: "notes", noteType: "all" },
    panesRendered: {},
    ai: { msgs: [], busy: false },
    install: { deferred: null, dismissed: LSget("colinOS_installDismissed", 0) }
  };
  var SR_STEPS = [1, 3, 7, 14, 30];
  var NOTE_TYPES = { idea: "想法", quote: "金句", question: "问题", evidence: "证据" };

  /* ================= 壳渲染：Header / TabBar ================= */
  function streakCount() { return (LSget("colinOS_streak", { count: 0, last: null }) || {}).count || 0; }

  function renderHeader() {
    var el = $("#os-header");
    el.innerHTML =
      '<div class="os-brand">' +
        '<img src="/colin-os/icons/icon-192.png" alt="Colin OS">' +
        '<div class="bt"><b>COLIN OS</b><em>15-MIN WISDOM</em></div>' +
      "</div>" +
      '<div class="h-actions">' +
        '<div class="streak-mini" id="streak-mini" style="display:' + (streakCount() > 0 ? "flex" : "none") + '">' +
          IC.flame + "<span>" + streakCount() + " 天</span></div>" +
        '<button class="h-btn" id="gsearch-btn" aria-label="全局搜索">' + IC.search + "</button>" +
        '<button class="theme-toggle" id="theme-btn" aria-label="切换浅色/暗色主题">' + IC.sun + IC.moon + "</button>" +
      "</div>";
    $("#theme-btn").addEventListener("click", toggleTheme);
    $("#gsearch-btn").addEventListener("click", openGlobalSearch);
  }
  function refreshStreakMini() {
    var m = $("#streak-mini");
    if (!m) return renderHeader();
    if (streakCount() > 0) { m.style.display = "flex"; m.innerHTML = IC.flame + "<span>" + streakCount() + " 天</span>"; }
  }

  var TABS = [
    { key: "library", label: "智库", icon: IC.library },
    { key: "clinic", label: "诊所", icon: IC.clinic },
    { key: "cards", label: "闪卡", icon: IC.cards },
    { key: "knowledge", label: "知识", icon: IC.knowledge },
    { key: "os", label: "我的", icon: IC.os }
  ];
  function renderTabbar() {
    var el = $("#tabbar");
    el.innerHTML = TABS.map(function (t) {
      return '<button class="tab-btn' + (t.key === state.tab ? " on" : "") + '" data-tab="' + t.key + '" aria-label="' + t.label + '">' +
        t.icon + "<span>" + t.label + "</span>" + '<i class="tdot"></i></button>';
    }).join("");
    $$(".tab-btn", el).forEach(function (b) {
      b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
    });
  }

  function setTab(tab, silent) {
    if (!TABS.some(function (t) { return t.key === tab; })) tab = "library";
    state.tab = tab;
    $$(".tabpane").forEach(function (p) { p.hidden = (p.id !== "pane-" + tab); });
    $$(".tab-btn").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
    if (!silent) {
      try { history.replaceState(null, "", tab === "library" ? "/" : "/?tab=" + tab); } catch (e) {}
    }
    window.scrollTo({ top: 0 });
    if (!state.panesRendered[tab]) { state.panesRendered[tab] = true; renderPane(tab); }
    if (tab === "cards") Cards.refresh();
    if (tab === "knowledge") renderKnowledge();
    if (tab === "os") renderOSPane();
  }

  function renderPane(tab) {
    if (tab === "library") renderLibrary();
    if (tab === "clinic") renderClinic();
    if (tab === "cards") Cards.mount();
  }

  /* ================= 模块：智库 Library（优先级 / 收藏 / 状态 / 折叠） ================= */
  /* 折叠分组状态：localStorage 持久化；首次使用默认展开第一个分类 */
  function libOpen() {
    if (!state.lib.open) {
      var saved = LSget("colinOS_libOpen", null);
      if (saved && typeof saved === "object") { state.lib.open = saved; }
      else {
        state.lib.open = {};
        var books = DATA.books.books || [];
        if (books.length) { var first = noEmoji(books[0].category); if (first) state.lib.open[first] = true; }
      }
    }
    return state.lib.open;
  }

  function renderLibrary() {
    var pane = $("#pane-library");
    var books = DATA.books.books || [];
    var pillars = DATA.pillars.essays || [];

    pane.innerHTML =
      '<div class="view-head"><h1>Colin <span>智库</span></h1>' +
        "<p>" + books.length + " 本精选图书 · 15 分钟速读拆解 · 4 大基石专栏</p></div>" +
      '<div class="searchbar"><input id="lib-q" type="text" placeholder="搜索书名 / 作者 / 关键词…" value="' + esc(state.lib.q) + '">' + IC.search.replace("<svg", '<svg class="sicon"') + "</div>" +
      '<div class="chip-row" id="lib-filters">' +
        [["all", "全部 " + books.length], ["p1", "优先读"], ["reading", "在读"], ["done", "已读完"], ["fav", "我的收藏"]].map(function (c) {
          return '<button class="chip' + (state.lib.filter === c[0] ? " on" : "") + '" data-f="' + c[0] + '">' + c[1] + "</button>";
        }).join("") +
      "</div>" +
      '<div id="lib-books"></div>' +
      '<div class="sec-row"><h2>四大基石<i>专栏</i></h2><span>' + pillars.length + " 个体系</span></div>" +
      '<div class="grid-auto" id="lib-pillars">' +
        pillars.map(function (p, i) {
          return '<div class="cardx tap" data-pillar="' + i + '">' +
            '<span class="cat">' + esc(noEmoji(p.pillar)) + "</span>" +
            "<h3>" + esc(noEmoji(p.title)) + '<span class="en">' + esc(p.pillarEn || "") + "</span></h3>" +
            '<div class="desc">' + esc(noEmoji(p.style || "")) + "</div>" +
            '<div class="meta"><span>深度长文 · 1-3-1 漏斗解构</span><span class="go">开始阅读 →</span></div>' +
          "</div>";
        }).join("") +
      "</div>";

    var qEl = $("#lib-q", pane);
    qEl.addEventListener("input", function () { state.lib.q = qEl.value; drawBooks(); });
    $$("#lib-filters .chip", pane).forEach(function (b) {
      b.addEventListener("click", function () {
        state.lib.filter = b.getAttribute("data-f");
        $$("#lib-filters .chip", pane).forEach(function (x) { x.classList.toggle("on", x === b); });
        drawBooks();
      });
    });
    /* 事件委托：折叠头 / 全部展开收起 / 图书卡（body 重渲染无需重绑） */
    $("#lib-books", pane).addEventListener("click", function (e) {
      var head = e.target.closest(".lib-sec-head");
      if (head) {
        var cat = head.getAttribute("data-cat");
        var map = libOpen();
        map[cat] = !map[cat];
        LSset("colinOS_libOpen", map);
        drawBooks();
        return;
      }
      var tgl = e.target.closest("[data-liball]");
      if (tgl) {
        var want = tgl.getAttribute("data-liball") === "1";
        var om = libOpen(), cs = [];
        (DATA.books.books || []).forEach(function (b) { var c = noEmoji(b.category); if (c && cs.indexOf(c) === -1) cs.push(c); });
        cs.forEach(function (c) { om[c] = want; });
        LSset("colinOS_libOpen", om);
        drawBooks();
        return;
      }
      var card = e.target.closest("[data-book]");
      if (card) {
        if (e.target.closest("[data-listen]")) return;
        openBook(Number(card.getAttribute("data-book")));
      }
    });
    $$("[data-pillar]", pane).forEach(function (el) {
      el.addEventListener("click", function () { openPillar(Number(el.getAttribute("data-pillar"))); });
    });
    drawBooks();
  }

  function statusChip(b) {
    var st = Vault.bookStatusMap()[b.id];
    if (st === "reading") return '<span class="pbadge reading">在读</span>';
    if (st === "done") return '<span class="pbadge done">已读完</span>';
    return "";
  }
  function priBadge(b) {
    if (b.priority === 1) return '<span class="pbadge p1">优先读</span>';
    if (b.priority === 2) return '<span class="pbadge p2">推荐</span>';
    return "";
  }

  function bookCard(b) {
    return '<div class="cardx tap" data-book="' + b.id + '">' +
      '<span class="cat">' + esc(noEmoji(b.category)) + priBadge(b) + statusChip(b) + "</span>" +
      "<h3>" + esc(noEmoji(b.title)) + '<span class="en">' + esc(b.en_title || "") + "</span></h3>" +
      '<div class="desc">' + esc(b.summary || "") + "</div>" +
      '<div class="meta"><span>文 / ' + esc(noEmoji(b.author || "")) + "</span>" +
        '<span class="go" data-listen="' + b.id + '">' + "15 分钟速读 →</span></div>" +
    "</div>";
  }

  function libFilterMatch(b) {
    var f = state.lib.filter;
    if (f === "p1") return b.priority === 1;
    if (f === "reading") return Vault.bookStatusMap()[b.id] === "reading";
    if (f === "done") return Vault.bookStatusMap()[b.id] === "done";
    if (f === "fav") return Vault.isFav(b.id);
    return true;
  }

  function drawBooks() {
    var host = $("#lib-books"); if (!host) return;
    var q = state.lib.q.trim().toLowerCase();
    var all = DATA.books.books || [];
    var match = function (b) {
      if (q) {
        var hay = (b.title + " " + (b.en_title || "") + " " + (b.author || "") + " " + (b.summary || "") + " " + (b.models_linked || []).join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return libFilterMatch(b);
    };

    /* 搜索态 / 筛选态：跨分类平铺结果 */
    if (q || state.lib.filter !== "all") {
      var list = all.filter(match);
      if (!list.length) {
        host.innerHTML = '<div class="cardx" style="text-align:center;color:var(--muted)">没有匹配的图书，换个关键词或筛选条件试试。</div>';
        return;
      }
      var label = q ? "搜索结果" : ({ p1: "优先读", reading: "在读", done: "已读完", fav: "我的收藏" })[state.lib.filter];
      host.innerHTML =
        '<div class="sec-row"><h2>' + label + '<i>' + (q ? "检索" : "筛选") + '</i></h2><span>' + list.length + " 本</span></div>" +
        '<div class="grid-auto">' + list.map(bookCard).join("") + "</div>";
      return;
    }

    /* 默认态：按分类折叠分组（收起的组不渲染卡片，1000 本也不卡） */
    var cats = [];
    all.forEach(function (b) { var c = noEmoji(b.category); if (c && cats.indexOf(c) === -1) cats.push(c); });
    var openMap = libOpen();
    var anyOpen = cats.some(function (c) { return openMap[c]; });
    var html = '<div class="sec-row"><h2>精选<i>图书</i></h2><span style="display:flex;align-items:center;gap:8px">' +
      "<span>" + all.length + " 本 · 15 分钟/本</span>" +
      '<button class="lib-toggle" data-liball="' + (anyOpen ? "0" : "1") + '">' + (anyOpen ? "收起全部" : "展开全部") + "</button></span></div>";
    html += cats.map(function (c) {
      var items = all.filter(function (b) { return noEmoji(b.category) === c; });
      var isOpen = !!openMap[c];
      return '<section class="lib-sec' + (isOpen ? " open" : "") + '" data-sec="' + esc(c) + '">' +
        '<div class="lib-sec-head" data-cat="' + esc(c) + '">' +
          '<span class="nm">' + esc(c) + "</span>" +
          '<span class="cnt">' + items.length + " 本</span>" +
          '<span class="chev">▾</span>' +
        "</div>" +
        '<div class="lib-sec-body">' + (isOpen ? '<div class="grid-auto">' + items.map(bookCard).join("") + "</div>" : "") + "</div>" +
      "</section>";
    }).join("");
    host.innerHTML = html;
  }

  /* ---------- 图书详情：15 分钟 / 完整 双视图 + 收藏 / 状态 / 记笔记 ---------- */
  var readerCtx = null;

  function openBook(id) {
    var b = (DATA.books.books || []).filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    readerCtx = { type: "book", item: b, mode: "s15" };
    openSheet(
      '<h2 class="stitle">' + esc(noEmoji(b.title)) + "</h2>" +
      '<div class="ssub">文 / ' + esc(noEmoji(b.author || "")) + " · " + esc(noEmoji(b.category)) + "</div>" +
      bookActions(b) +
      '<div class="seg" id="rd-seg">' +
        '<button data-m="s15" class="on">15 分钟核心提炼</button>' +
        '<button data-m="full">完整拆解</button>' +
      "</div>" +
      '<div id="rd-body"></div>'
    );
    bindBookActions(b);
    $$("#rd-seg button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        readerCtx.mode = btn.getAttribute("data-m");
        $$("#rd-seg button").forEach(function (x) { x.classList.toggle("on", x === btn); });
        drawReader();
      });
    });
    drawReader();
  }

  function bookActions(b) {
    var st = Vault.bookStatusMap()[b.id] || "";
    var fav = Vault.isFav(b.id);
    return '<div class="bk-acts">' +
      '<button class="bact' + (st === "reading" ? " on" : "") + '" data-bact="reading">' + IC.clock.replace("<svg", '<svg width="14" height="14"') + "在读</button>" +
      '<button class="bact' + (st === "done" ? " on" : "") + '" data-bact="done">' + IC.check.replace("<svg", '<svg width="14" height="14"') + "读完</button>" +
      '<button class="bact' + (fav ? " on" : "") + '" data-bact="fav">' + IC.star.replace("<svg", '<svg width="14" height="14"') + "收藏</button>" +
      '<button class="bact" data-bact="note">' + IC.note.replace("<svg", '<svg width="14" height="14"') + "记笔记</button>" +
    "</div>";
  }

  function bindBookActions(b) {
    $$("[data-bact]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-bact");
        if (a === "reading" || a === "done") {
          var cur = Vault.bookStatusMap()[b.id];
          Vault.setBookStatus(b.id, cur === a ? null : a);
          toast(cur === a ? "已取消标记" : (a === "reading" ? "已标记为在读" : "恭喜读完 · 已记录"));
        } else if (a === "fav") {
          openCollectionPicker(b);
          return;
        } else if (a === "note") {
          openCapture({ bookId: b.id, bookTitle: noEmoji(b.title), type: "idea" });
          return;
        }
        /* 刷新按钮态 */
        $$("[data-bact]").forEach(function (x) {
          var k = x.getAttribute("data-bact");
          if (k === "reading" || k === "done") x.classList.toggle("on", Vault.bookStatusMap()[b.id] === k);
          if (k === "fav") x.classList.toggle("on", Vault.isFav(b.id));
        });
        if (state.tab === "library") drawBooks();
      });
    });
  }

  function openCollectionPicker(b) {
    var cols = Vault.collections();
    var html = '<h2 class="stitle">加入书单</h2><div class="ssub">《' + esc(noEmoji(b.title)) + "》</div>" +
      '<div class="pick-list">' +
      cols.map(function (c) {
        var inIt = (c.bookIds || []).indexOf(b.id) !== -1;
        return '<button class="pick-item' + (inIt ? " on" : "") + '" data-col="' + c.id + '">' +
          IC.check.replace("<svg", '<svg width="15" height="15"') + "<span>" + esc(c.name) + "</span><i>" + (c.bookIds || []).length + " 本</i></button>";
      }).join("") +
      "</div>" +
      '<div class="pick-new"><input id="new-col" type="text" placeholder="新建书单名称…"><button id="new-col-ok">创建</button></div>';
    openSheet(html);
    $$("[data-col]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        Vault.toggleFav(b.id, btn.getAttribute("data-col"));
        btn.classList.toggle("on");
        if (state.tab === "library") drawBooks();
      });
    });
    var inp = $("#new-col");
    function create() {
      var name = (inp.value || "").trim();
      if (!name) { toast("请输入书单名称"); return; }
      var c = Vault.ensureCollection(name);
      Vault.toggleFav(b.id, c.id);
      closeSheet();
      toast("已加入书单「" + name + "」");
      if (state.tab === "library") drawBooks();
    }
    $("#new-col-ok").addEventListener("click", create);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") create(); });
  }

  function bookText15(b) {
    var t = "15 分钟核心提炼。" + (b.summary || "") + " " + (b.insights || []).slice(0, 2).join(" ");
    return t;
  }
  function bookTextFull(b) {
    return (b.summary || "") + " " + (b.insights || []).join(" ");
  }

  function drawReader() {
    var host = $("#rd-body"); if (!host || !readerCtx) return;
    var b = readerCtx.item;
    var is15 = readerCtx.mode === "s15";
    var insights = (b.insights || []);
    var pts = is15 ? insights.slice(0, 2) : insights;
    var txt = is15 ? bookText15(b) : bookTextFull(b);
    host.innerHTML =
      '<div class="reader">' +
        '<div class="rmeta"><span>预计 <b>' + (is15 ? "15" : "25+") + ' 分钟</b></span><span>' + (is15 ? "极简提炼 · 通勤可读" : "全量拆解 · 深度阅读") + "</span></div>" +
        '<div class="lede">' + esc(b.summary || "") + "</div>" +
        "<h4>" + (is15 ? "两大核心要点" : "全部核心要点 · " + insights.length + " 条") + "</h4>" +
        '<ul class="pts">' + pts.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
        '<h4>关联思维模型</h4>' +
        '<div class="mtagrow">' + (b.models_linked || []).map(function (m) { return '<span class="mtag">' + esc(noEmoji(m)) + "</span>"; }).join("") + "</div>" +
        (!is15 ?
          '<h4>延伸链接</h4><div class="mtagrow">' +
            (b.links && b.links.douban ? '<a class="mtag" href="' + esc(b.links.douban) + '" target="_blank" rel="noopener">豆瓣</a>' : "") +
            (b.links && b.links.goodreads ? '<a class="mtag" href="' + esc(b.links.goodreads) + '" target="_blank" rel="noopener">Goodreads</a>' : "") +
            (b.links && b.links.article ? '<a class="mtag" href="' + esc(b.links.article) + '" target="_blank" rel="noopener">专栏长文</a>' : "") +
          "</div>" : "") +
        '<button class="mcta" id="rd-listen" style="margin-top:18px;display:flex;align-items:center;justify-content:center;gap:8px">' +
          IC.headset.replace("<svg", '<svg width="17" height="17" style="stroke:#0b0b0f;fill:none;stroke-width:2"') +
          "边听边读 · 播放" + (is15 ? "15 分钟" : "完整") + "讲义</button>" +
      "</div>";
    $("#rd-listen").addEventListener("click", function () {
      Player.start((is15 ? "15 分钟提炼 · " : "完整拆解 · ") + noEmoji(b.title), "Colin OS · " + noEmoji(b.category), txt);
    });
  }

  /* ---------- 专栏详情：15 分钟 / 完整 ---------- */
  function openPillar(idx) {
    var p = (DATA.pillars.essays || [])[idx];
    if (!p) return;
    readerCtx = { type: "pillar", item: p, mode: "s15" };
    openSheet(
      '<h2 class="stitle">' + esc(noEmoji(p.title)) + "</h2>" +
      '<div class="ssub">' + esc(noEmoji(p.pillar)) + " · " + esc(noEmoji(p.style || "")) + "</div>" +
      '<div class="seg" id="rd-seg">' +
        '<button data-m="s15" class="on">15 分钟核心提炼</button>' +
        '<button data-m="full">完整拆解</button>' +
      "</div>" +
      '<div id="rd-body"></div>'
    );
    $$("#rd-seg button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        readerCtx.mode = btn.getAttribute("data-m");
        $$("#rd-seg button").forEach(function (x) { x.classList.toggle("on", x === btn); });
        drawPillarReader();
      });
    });
    drawPillarReader();
  }

  function pillarText15(p) {
    var h = p.hero || {};
    return "15 分钟核心提炼。" + (h.quote || "") + " " + (h.layers || []).map(function (l) { return l.who + "：" + l.text; }).join(" ") + " 行动：" + (h.action || "");
  }
  function pillarTextFull(p) {
    var out = [pillarText15(p)];
    var secs = p.sections || {};
    ["intro", "core", "sublime"].forEach(function (k) {
      var s = secs[k]; if (!s) return;
      out.push(s.heading || "");
      (s.blocks || []).forEach(function (b) { out.push(b.text || ""); });
      (s.subsections || []).forEach(function (sub) {
        out.push(sub.heading || "");
        (sub.blocks || []).forEach(function (b) { out.push(b.text || ""); });
      });
    });
    return out.join(" ");
  }

  function renderBlocks(blocks) {
    return (blocks || []).map(function (b) {
      if (b.type === "quote") return '<div class="lede">' + esc(b.text) + "</div>";
      return '<p style="font-size:14px;line-height:1.9;margin-bottom:10px;overflow-wrap:anywhere">' + esc(b.text) + "</p>";
    }).join("");
  }

  function drawPillarReader() {
    var host = $("#rd-body"); if (!host || !readerCtx) return;
    var p = readerCtx.item;
    var is15 = readerCtx.mode === "s15";
    var h = p.hero || {};
    var secs = p.sections || {};
    var html = '<div class="reader">' +
      '<div class="rmeta"><span>预计 <b>' + (is15 ? "15" : "45+") + " 分钟</b></span><span>" + (is15 ? "极简提炼" : "1-3-1 漏斗全量解构") + "</span></div>" +
      '<div class="lede">"' + esc(h.quote || "") + '"</div>';
    if (is15) {
      html += "<h4>三层互证</h4><ul class='pts'>" +
        (h.layers || []).map(function (l) { return "<li><b>" + esc(noEmoji(l.who)) + "</b> — " + esc(l.text) + "</li>"; }).join("") + "</ul>" +
        "<h4>今日微行动</h4><ul class='pts'><li>" + esc(noEmoji(h.action || "")) + "</li></ul>";
    } else {
      var intro = secs.intro || {}, core = secs.core || {}, sub = secs.sublime || {};
      html += "<h4>" + esc(noEmoji(intro.heading || "引子")) + "</h4>" + renderBlocks(intro.blocks);
      html += "<h4>" + esc(noEmoji(core.heading || "核心")) + "</h4>";
      (core.subsections || []).forEach(function (s) {
        html += '<p style="font-weight:800;color:var(--gold-soft);margin:12px 0 8px">' + esc(noEmoji(s.heading || "")) + "</p>" + renderBlocks(s.blocks);
      });
      html += "<h4>" + esc(noEmoji(sub.heading || "升华")) + "</h4>" + renderBlocks(sub.blocks);
      var ab = sub.actionBox;
      if (ab) {
        html += "<h4>" + esc(noEmoji(ab.title || "行动沙箱")) + "</h4><ul class='pts'>" +
          (ab.items || []).map(function (it) {
            return "<li><b>" + esc(noEmoji(it.label)) + "</b> — " + esc(it.desc) + "<br><span style='color:var(--gold-soft)'>→ " + esc(it.action) + "</span></li>";
          }).join("") + "</ul>";
      }
    }
    html += '<button class="mcta" id="rd-listen" style="margin-top:18px;display:flex;align-items:center;justify-content:center;gap:8px">' +
      IC.headset.replace("<svg", '<svg width="17" height="17" style="stroke:#0b0b0f;fill:none;stroke-width:2"') +
      "边听边读 · 播放" + (is15 ? "15 分钟" : "完整") + "讲义</button></div>";
    host.innerHTML = html;
    $("#rd-listen").addEventListener("click", function () {
      Player.start((is15 ? "15 分钟提炼 · " : "完整拆解 · ") + noEmoji(p.pillar), "Colin OS · 基石专栏", is15 ? pillarText15(p) : pillarTextFull(p));
    });
  }

  /* ================= 模块：诊所 Clinic（复用 v6 组件） ================= */
  function renderClinic() {
    var pane = $("#pane-clinic");
    if (pane.querySelector("mental-model-latticework")) return;
    pane.innerHTML =
      '<div class="view-head"><h1>决策<span>诊所</span></h1>' +
        "<p>200 思维模型 · 痛点检索 · L1 / L2 / L3 阶梯解密</p></div>" +
      '<mental-model-latticework src="/data/mental-models-200-v7-tiered.json"></mental-model-latticework>';
  }

  /* ================= 模块：闪卡 Cards（间隔重复） ================= */
  var Cards = (function () {
    var flipped = false, queue = [], idx = 0, answered = 0;

    function srState() { return LSget("colinOS_sr", { cards: {}, day: null, done: false }); }
    function srSave(s) { LSset("colinOS_sr", s); }

    function buildPool() {
      var pool = [];
      (DATA.principles.principles || []).forEach(function (p) {
        pool.push({
          kind: "pr", id: "pr-" + p.id,
          cat: noEmoji(p.category), person: noEmoji(p.person),
          frontTag: "金句", frontQ: p.quote, frontSub: "",
          backLogic: (p.tags || []).join(" · "),
          backActs: p.action_checklist || []
        });
      });
      (DATA.models.models || []).forEach(function (m) {
        pool.push({
          kind: "md", id: "md-" + m.id,
          cat: noEmoji(m.category), person: noEmoji(m.name),
          frontTag: "痛点", frontQ: m.pain_point, frontSub: m.name,
          backLogic: m.definition,
          backActs: String(m.methodology || "").split(/[；;]/).filter(Boolean).slice(0, 4)
        });
      });
      return pool;
    }

    /* 每日 3 张：优先到期 → 新卡（按日期种子确定性抽取，同一天刷新不变）→ 保底已学 */
    function buildToday(pool) {
      var s = srState();
      var t = todayStr();
      var due = [], fresh = [], seen = [];
      pool.forEach(function (c) {
        var st = s.cards[c.id];
        if (!st) fresh.push(c);
        else if (st.next <= t) due.push(c);
        else seen.push(c);
      });
      due.sort(function (a, b) { return s.cards[a.id].next < s.cards[b.id].next ? -1 : 1; });
      var rng = mulberry32(hashStr("colin-os-" + t));
      /* 洗牌新卡池（确定性） */
      for (var i = fresh.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var tmp = fresh[i]; fresh[i] = fresh[j]; fresh[j] = tmp;
      }
      var prDue = due.filter(function (c) { return c.kind === "pr"; });
      var mdDue = due.filter(function (c) { return c.kind === "md"; });
      var prNew = fresh.filter(function (c) { return c.kind === "pr"; });
      var pick = [];
      function take(arr, n) { while (n-- > 0 && arr.length) pick.push(arr.shift()); }
      take(prDue, 1); take(mdDue, 1);          /* 1 原则 + 1 模型优先 */
      take(prNew, 1);                           /* 再补 1 条新原则 */
      while (pick.length < 3) {
        var rest = [].concat(due, fresh, seen).filter(function (c) { return pick.indexOf(c) === -1; });
        if (!rest.length) break;
        pick.push(rest[Math.floor(rng() * rest.length)]);
      }
      return pick.slice(0, 3).map(function (c) { return c.id; });
    }

    function todayQueue() {
      var pool = buildPool();
      var byId = {};
      pool.forEach(function (c) { byId[c.id] = c; });
      var s = srState();
      if (s.day !== todayStr()) {
        s = { cards: s.cards, day: todayStr(), done: false };
        s.queue = buildToday(pool);
        srSave(s);
      }
      return (s.queue || []).map(function (id) { return byId[id]; }).filter(Boolean);
    }

    function answer(cardId, remembered) {
      var s = srState();
      var st = s.cards[cardId] || { reps: 0, int: 0, next: todayStr(), last: null };
      if (remembered) {
        st.reps = (st.reps || 0) + 1;
        st.int = SR_STEPS[Math.min(st.reps - 1, SR_STEPS.length - 1)];
      } else {
        st.reps = 0; st.int = 1;
      }
      st.last = todayStr();
      st.next = addDaysStr(st.int);
      s.cards[cardId] = st;
      answered++;
      if (answered >= (s.queue || []).length && (s.queue || []).length) {
        s.done = true;
        checkIn();
      }
      srSave(s);
    }

    function checkIn() {
      dayCheckIn();
    }

    /* ---------- 渲染 ---------- */
    function mount() {
      var pane = $("#pane-cards");
      if (!pane.getAttribute("data-mounted")) {
        pane.setAttribute("data-mounted", "1");
        pane.innerHTML = '<div id="atoms-host"></div><div id="fc-host"></div>';
      }
      refreshAtoms();
      refresh();
    }

    /* 默认微行动：从今日间隔重复卡池派生（用户未领取时展示） */
    function microActionsDefault() {
      var q = todayQueue().slice();
      var out = [];
      q.forEach(function (c) {
        var steps = (c.backActs || []).filter(Boolean);
        if (steps.length) out.push({ title: c.person || c.frontSub || "微行动", steps: steps });
      });
      return out.slice(0, 3);
    }

    function refreshAtoms() {
      var host = $("#atoms-host"); if (!host) return;
      Atoms.load(); /* 触发隔天重置 */
      var items = Atoms.list();
      var html = '<div class="atoms-panel"><div class="atoms-head"><div class="ttl">' + IC.flame + '今日待办微行动</div>' +
        '<div class="cnt" id="atoms-cnt"></div></div>';
      if (items.length) {
        html += items.map(function (it, i) {
          return '<div class="atom-item' + (it.done ? " done" : "") + '">' +
            '<div class="atom-check" data-check="' + i + '">' + IC.check + '</div>' +
            '<div class="atom-body"><div class="at">' + esc(noEmoji(it.title)) + '</div>' +
            (it.steps && it.steps.length ? '<div class="as">' + esc(it.steps.slice(0, 2).join(" · ")) + '</div>' : '') +
            '</div><div class="atom-x" data-x="' + i + '">×</div></div>';
        }).join("");
      } else {
        var defs = microActionsDefault();
        if (defs.length) {
          html += '<div class="atoms-empty">尚未领取 · 系统据间隔重复为你推荐 <b>' + defs.length + '</b> 条微行动：</div>';
          html += defs.map(function (d, i) {
            return '<div class="atom-item"><div class="atom-check" data-defclaim="' + i + '" style="cursor:pointer">' + IC.bolt + '</div>' +
              '<div class="atom-body"><div class="at">' + esc(noEmoji(d.title)) + '</div>' +
              (d.steps && d.steps.length ? '<div class="as">' + esc(d.steps.slice(0, 2).join(" · ")) + '</div>' : '') +
              '</div></div>';
          }).join("");
        } else {
          html += '<div class="atoms-empty">今日微行动清单空空如也 · 去<b>智库 / 诊所</b>领取一个 2 分钟微行动吧</div>';
        }
      }
      html += '</div>';
      host.innerHTML = html;
      var cnt = $("#atoms-cnt");
      if (cnt) cnt.textContent = items.length ? (items.filter(function (it) { return it.done; }).length + "/" + items.length + " 完成") : "";
      $$("[data-check]", host).forEach(function (el) {
        el.addEventListener("click", function () {
          var i = Number(el.getAttribute("data-check"));
          Atoms.setDone(i, !Atoms.list()[i].done);
          refreshAtoms();
        });
      });
      $$("[data-x]", host).forEach(function (el) {
        el.addEventListener("click", function () {
          Atoms.removeAt(Number(el.getAttribute("data-x")));
          refreshAtoms();
        });
      });
      $$("[data-defclaim]", host).forEach(function (el) {
        el.addEventListener("click", function () {
          var d = microActionsDefault()[Number(el.getAttribute("data-defclaim"))];
          if (d) window.ColinAtoms.toggle(d.title, d.steps);
          refreshAtoms();
        });
      });
    }

    function refresh() {
      var host = $("#fc-host"); if (!host) return;
      var streak = streakCount();
      var s = srState();
      queue = todayQueue();
      if (!queue.length) {
        host.innerHTML = '<div class="fc-wrap"><div class="fc-done"><div class="big">' + IC.cards.replace("<svg", '<svg width="60" height="60" style="stroke:var(--gold);fill:none;stroke-width:1.4"') + "</div><h3>闪卡库准备中</h3><p>数据载入后再来打卡</p></div></div>";
        return;
      }
      if (s.done && (answered === 0 || answered >= queue.length)) {
        host.innerHTML =
          '<div class="fc-wrap"><div class="fc-done">' +
            '<div class="big">' + IC.flame.replace("<svg", '<svg width="58" height="58"') + "</div>" +
            "<h3>今日 3 张已完成</h3>" +
            '<p>已连续打卡 <b style="color:var(--gold)">' + streak + "</b> 天 · 明天准时来复习</p>" +
            '<p style="margin-top:6px;font-size:11.5px;color:var(--muted-2)">间隔重复已排期：1 → 3 → 7 → 14 → 30 天</p>' +
          "</div></div>";
        return;
      }
      if (answered >= queue.length) answered = 0;
      idx = Math.min(idx, queue.length - 1);
      drawCard();
    }

    function drawCard() {
      var host = $("#fc-host"); if (!host) return;
      var c = queue[idx];
      flipped = false;
      host.innerHTML =
        '<div class="fc-wrap">' +
          '<div class="view-head" style="text-align:center;margin-bottom:10px"><h1>每日 <span>3 张</span></h1><p>间隔重复 · 记住的知识点按 1/3/7/14/30 天回访</p></div>' +
          '<div class="fc-progress">' + queue.map(function (_, i) {
            return '<i class="pd' + (i < idx ? " done" : i === idx ? " cur" : "") + '"></i>';
          }).join("") + "</div>" +
          '<div class="fc-stage" id="fc-stage">' +
            '<div class="fc-card" id="fc-card">' +
              '<div class="fc-face front">' +
                '<i class="corner tl"></i><i class="corner br"></i>' +
                '<div class="fkind"><span class="tag">' + esc(c.frontTag) + " · " + esc(c.cat) + '</span><span class="idx">' + (idx + 1) + " / " + queue.length + "</span></div>" +
                '<div class="fbody">' +
                  '<div class="fq">"' + esc(c.frontQ) + '"</div>' +
                  (c.frontSub ? '<div class="fperson">' + esc(noEmoji(c.frontSub)) + "</div>" : "") +
                  '<div class="fperson">' + esc(c.person) + "</div>" +
                "</div>" +
                '<div class="fhint">点击卡片翻面查看底层逻辑</div>' +
              "</div>" +
              '<div class="fc-face back">' +
                '<i class="corner tl"></i><i class="corner br"></i>' +
                '<div class="fkind"><span class="tag">底层操盘逻辑</span><span class="idx">' + (idx + 1) + " / " + queue.length + "</span></div>" +
                '<div class="fbody">' +
                  '<div class="fb-title">' + esc(c.person) + "</div>" +
                  '<div class="fb-txt">' + esc(c.backLogic) + "</div>" +
                  (c.backActs && c.backActs.length ?
                    '<div class="fb-acts"><div class="fb-title" style="margin-top:12px">微行动清单</div><ul>' +
                    c.backActs.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
                    '<button class="claim-btn" id="fc-claim">⚡ 领取代办：开启 2 分钟微行动</button></div>' : "") +
                "</div>" +
                '<div class="fhint">左右滑动切换卡片</div>' +
              "</div>" +
            "</div>" +
          "</div>" +
          '<div class="fc-actions">' +
            '<button class="btn-review" id="fc-review">' + IC.redo + "重新复习</button>" +
            '<button class="btn-remember" id="fc-ok">' + IC.check + "记住了</button>" +
          "</div>" +
        "</div>";

      bindCard(c);
      $("#fc-ok").addEventListener("click", function () {
        answer(c.id, true);
        nextCard();
      });
      $("#fc-review").addEventListener("click", function () {
        answer(c.id, false);
        nextCard();
      });
      var fcb = $("#fc-claim");
      if (fcb) {
        var syncClaim = function () {
          var claimed = Atoms.has(c.person, c.backActs || []);
          fcb.classList.toggle("claimed", claimed);
          fcb.innerHTML = (claimed ? IC.check + "已领取（点击可取消）" : "⚡ 领取代办：开启 2 分钟微行动");
        };
        syncClaim();
        fcb.addEventListener("click", function (e) {
          e.stopPropagation();
          window.ColinAtoms.toggle(c.person, c.backActs || []);
          syncClaim();
        });
      }
    }

    function nextCard() {
      if (answered >= queue.length) { refresh(); return; }
      idx = Math.min(idx + 1, queue.length - 1);
      drawCard();
    }

    /* ---------- 翻牌 + 左右滑动手势 ---------- */
    function bindCard(c) {
      var card = $("#fc-card");
      var stage = $("#fc-stage");
      var drag = { on: false, sx: 0, sy: 0, dx: 0, moved: false };

      function setT(dx) {
        card.style.transform = "translateX(" + dx + "px) rotate(" + (dx * 0.04) + "deg)" + (flipped ? " rotateY(180deg)" : "");
      }
      stage.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return;
        drag.on = true; drag.sx = e.clientX; drag.sy = e.clientY; drag.dx = 0; drag.moved = false;
        card.classList.add("dragging");
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      });
      stage.addEventListener("pointermove", function (e) {
        if (!drag.on) return;
        drag.dx = e.clientX - drag.sx;
        var dy = e.clientY - drag.sy;
        if (Math.abs(drag.dx) > 8 && Math.abs(drag.dx) > Math.abs(dy)) drag.moved = true;
        if (drag.moved) setT(drag.dx);
      });
      function endDrag() {
        if (!drag.on) return;
        drag.on = false;
        card.classList.remove("dragging");
        card.style.transform = "";
        if (drag.moved && Math.abs(drag.dx) > 70) {
          card.classList.add(drag.dx < 0 ? "swipe-out-l" : "swipe-out-r");
          setTimeout(function () {
            if (drag.dx < 0) { idx = (idx + 1) % queue.length; } else { idx = (idx - 1 + queue.length) % queue.length; }
            drawCard();
          }, 300);
        } else if (!drag.moved) {
          flipped = !flipped;
          card.classList.toggle("flipped", flipped);
        }
      }
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
    }

    return { mount: mount, refresh: refresh, refreshAtoms: refreshAtoms };
  })();

  /* ================= 模块：知识库 Knowledge（记录/日志/决策/复盘/图谱） ================= */
  var KN_SEGS = [
    { key: "notes", label: "记录", icon: IC.note },
    { key: "log", label: "日志", icon: IC.calendar },
    { key: "decisions", label: "决策", icon: IC.scale },
    { key: "review", label: "复盘", icon: IC.clipboard },
    { key: "graph", label: "图谱", icon: IC.graph }
  ];

  function renderKnowledge() {
    var pane = $("#pane-knowledge");
    var notes = Vault.notes().length, logs = Vault.readlog().length, decs = Vault.decisions().length;
    pane.innerHTML =
      '<div class="view-head"><h1>知识 <span>库</span></h1>' +
        "<p>快速记录 · 阅读日志 · 决策日志 · 复盘引擎 · 关联图谱</p></div>" +
      '<div class="kn-seg" id="kn-seg">' +
        KN_SEGS.map(function (s) {
          return '<button class="kn-seg-btn' + (state.kn.seg === s.key ? " on" : "") + '" data-seg="' + s.key + '">' + s.icon + "<span>" + s.label + "</span></button>";
        }).join("") +
      "</div>" +
      '<div class="kn-stats">' +
        '<div class="kn-stat"><b>' + notes + "</b><span>记录</span></div>" +
        '<div class="kn-stat"><b>' + logs + "</b><span>日志</span></div>" +
        '<div class="kn-stat"><b>' + decs + "</b><span>决策</span></div>" +
        '<div class="kn-stat"><b>' + streakCount() + "</b><span>连续天</span></div>" +
      "</div>" +
      '<div id="kn-body"></div>';

    $$("#kn-seg .kn-seg-btn", pane).forEach(function (b) {
      b.addEventListener("click", function () {
        state.kn.seg = b.getAttribute("data-seg");
        $$("#kn-seg .kn-seg-btn", pane).forEach(function (x) { x.classList.toggle("on", x === b); });
        drawKnBody();
      });
    });
    drawKnBody();
  }

  function drawKnBody() {
    var host = $("#kn-body"); if (!host) return;
    var seg = state.kn.seg;
    if (seg === "notes") drawKnNotes(host);
    else if (seg === "log") drawKnLog(host);
    else if (seg === "decisions") drawKnDecisions(host);
    else if (seg === "review") drawKnReview(host);
    else if (seg === "graph") drawKnGraph(host);
  }

  /* ---------- 记录（想法/金句/问题/证据） ---------- */
  function drawKnNotes(host) {
    var all = Vault.notes();
    var chips = '<div class="chip-row">' +
      [["all", "全部 " + all.length]].concat(Object.keys(NOTE_TYPES).map(function (k) {
        return [k, NOTE_TYPES[k] + " " + all.filter(function (n) { return n.type === k; }).length];
      })).map(function (c) {
        return '<button class="chip' + (state.kn.noteType === c[0] ? " on" : "") + '" data-nt="' + c[0] + '">' + c[1] + "</button>";
      }).join("") + "</div>";
    var list = state.kn.noteType === "all" ? all : all.filter(function (n) { return n.type === state.kn.noteType; });
    var body = list.length ? '<div class="note-list">' + list.map(function (n) {
      var bk = n.bookId ? '<button class="note-book" data-nbook="' + n.bookId + '">《' + esc(noEmoji(n.bookTitle || "")) + "》</button>" : "";
      return '<div class="note-card">' +
        '<div class="note-head"><span class="note-type t-' + n.type + '">' + (NOTE_TYPES[n.type] || n.type) + "</span>" +
        "<time>" + esc((n.ts ? new Date(n.ts) : new Date()).toISOString().slice(0, 10)) + "</time>" +
        '<button class="note-x" data-ndel="' + n.id + '" aria-label="删除">' + IC.trash.replace("<svg", '<svg width="13" height="13"') + "</button></div>" +
        '<div class="note-text">' + esc(n.text) + "</div>" + bk + "</div>";
    }).join("") + "</div>" :
    '<div class="kn-empty">还没有记录 · 点左下角 <b>+</b> 快速记录想法 / 金句 / 问题 / 证据</div>';
    host.innerHTML = chips + body +
      '<button class="kn-add" id="kn-add-note">' + IC.plus.replace("<svg", '<svg width="15" height="15"') + "记一条</button>";
    $$("[data-nt]", host).forEach(function (b) {
      b.addEventListener("click", function () {
        state.kn.noteType = b.getAttribute("data-nt");
        drawKnNotes(host);
      });
    });
    $$("[data-ndel]", host).forEach(function (b) {
      b.addEventListener("click", function () { Vault.delNote(b.getAttribute("data-ndel")); toast("已删除"); drawKnNotes(host); });
    });
    $$("[data-nbook]", host).forEach(function (b) {
      b.addEventListener("click", function () { closeSheet(); openBook(Number(b.getAttribute("data-nbook"))); });
    });
    $("#kn-add-note").addEventListener("click", function () { openCapture({}); });
  }

  /* ---------- 阅读日志 ---------- */
  function drawKnLog(host) {
    var logs = Vault.readlog();
    var mins = logs.reduce(function (a, l) { return a + (l.minutes || 0); }, 0);
    var body = logs.length ? '<div class="log-list">' + logs.map(function (l) {
      return '<div class="log-item">' +
        '<div class="log-date"><b>' + esc(l.date) + "</b>" + (l.minutes ? "<span>" + l.minutes + " 分钟</span>" : "") + "</div>" +
        '<div class="log-main">' + (l.bookTitle ? '<button class="note-book" data-nbook="' + (l.bookId || "") + '">《' + esc(noEmoji(l.bookTitle)) + "》</button>" : "") +
        (l.note ? '<div class="log-note">' + esc(l.note) + "</div>" : "") + "</div></div>";
    }).join("") + "</div>" :
    '<div class="kn-empty">还没有阅读日志 · 读完一段就记一笔，坚持可查</div>';
    host.innerHTML =
      '<div class="log-summary">累计阅读 <b>' + mins + '</b> 分钟 · <b>' + logs.length + "</b> 条日志</div>" + body +
      '<button class="kn-add" id="kn-add-log">' + IC.plus.replace("<svg", '<svg width="15" height="15"') + "记阅读日志</button>";
    $$("[data-nbook]", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = Number(b.getAttribute("data-nbook"));
        if (id) { closeSheet(); openBook(id); }
      });
    });
    $("#kn-add-log").addEventListener("click", function () { openCapture({ mode: "log" }); });
  }

  /* ---------- 决策日志 ---------- */
  function drawKnDecisions(host) {
    var decs = Vault.decisions();
    var body = decs.length ? '<div class="dec-list">' + decs.map(function (d) {
      return '<div class="dec-card">' +
        '<div class="dec-head"><b>' + esc(d.title) + "</b><time>" + esc(d.date) + "</time></div>" +
        (d.options && d.options.length ? '<div class="dec-opts">选项：' + d.options.map(function (o) {
          return '<span class="dec-opt' + (o === d.choice ? " chosen" : "") + '">' + esc(o) + "</span>";
        }).join("") + "</div>" : "") +
        '<div class="dec-choice">选择：<b>' + esc(d.choice || "未定") + "</b></div>" +
        (d.rationale ? '<div class="dec-why">理由：' + esc(d.rationale) + "</div>" : "") +
        '<div class="dec-result">' +
          (d.result ? "结果：" + esc(d.result) : '<button class="dec-setres" data-dres="' + d.id + '">补录结果 →</button>') +
        "</div></div>";
    }).join("") + "</div>" :
    '<div class="kn-empty">还没有决策记录 · 把重要决定写下来，事后回看最值钱</div>';
    host.innerHTML = body +
      '<button class="kn-add" id="kn-add-dec">' + IC.plus.replace("<svg", '<svg width="15" height="15"') + "记一个决策</button>";
    $("#kn-add-dec").addEventListener("click", function () { openCapture({ mode: "decision" }); });
    $$("[data-dres]", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-dres");
        openSheet(
          '<h2 class="stitle">补录决策结果</h2><div class="ssub">事后回看 · 校准判断力</div>' +
          '<textarea id="dres-in" class="cap-input" rows="4" placeholder="后来发生了什么？结果如何？"></textarea>' +
          '<button class="mcta" id="dres-ok" style="margin-top:12px;width:100%">保存结果</button>'
        );
        $("#dres-ok").addEventListener("click", function () {
          Vault.setDecisionResult(id, $("#dres-in").value);
          closeSheet(); toast("结果已记录");
          if (state.tab === "knowledge") renderKnowledge();
        });
      });
    });
  }

  /* ---------- 复盘引擎 ---------- */
  function drawKnReview(host) {
    var period = state.kn.reviewPeriod || "week";
    var days = period === "week" ? 7 : 30;
    var from = addDaysStr(-(days - 1));
    var checkins = LSget("colinOS_checkins", []).filter(function (d) { return d >= from; });
    var notes = Vault.notes().filter(function (n) { return new Date(n.ts).toISOString().slice(0, 10) >= from; });
    var logs = Vault.readlog().filter(function (l) { return l.date >= from; });
    var mins = logs.reduce(function (a, l) { return a + (l.minutes || 0); }, 0);
    var reviews = Vault.reviews();
    var body =
      '<div class="rev-period">' +
        '<button class="chip' + (period === "week" ? " on" : "") + '" data-rp="week">本周</button>' +
        '<button class="chip' + (period === "month" ? " on" : "") + '" data-rp="month">本月</button>' +
      "</div>" +
      '<div class="rev-grid">' +
        '<div class="rev-kpi"><b>' + checkins.length + "</b><span>打卡天</span></div>" +
        '<div class="rev-kpi"><b>' + notes.length + "</b><span>新记录</span></div>" +
        '<div class="rev-kpi"><b>' + mins + "</b><span>阅读分钟</span></div>" +
        '<div class="rev-kpi"><b>' + (LSget("colinOS_totalActions", 0) || 0) + "</b><span>累计践行</span></div>" +
      "</div>" +
      '<div class="rev-form">' +
        '<div class="rev-q">这' + (period === "week" ? "一周" : "一个月") + "，我做对了什么？下步改什么？</div>" +
        '<textarea id="rev-in" class="cap-input" rows="4" placeholder="写给你的复盘…"></textarea>' +
        '<button class="mcta" id="rev-ok" style="margin-top:10px;width:100%">保存复盘</button>' +
      "</div>" +
      (reviews.length ? '<div class="rev-list">' + reviews.map(function (r) {
        return '<div class="rev-card"><div class="rev-head"><span class="note-type t-idea">' + (r.period === "week" ? "周复盘" : "月复盘") + "</span><time>" +
          esc(new Date(r.ts).toISOString().slice(0, 10)) + "</time></div><div class='rev-text'>" + esc(r.text) + "</div></div>";
      }).join("") + "</div>" : '<div class="kn-empty">保存第一条复盘，成长就有迹可循</div>');
    host.innerHTML = body;
    $$("[data-rp]", host).forEach(function (b) {
      b.addEventListener("click", function () { state.kn.reviewPeriod = b.getAttribute("data-rp"); drawKnReview(host); });
    });
    $("#rev-ok").addEventListener("click", function () {
      var t = $("#rev-in").value;
      if (!t.trim()) { toast("写点什么再保存"); return; }
      Vault.addReview({ period: period, text: t });
      toast("复盘已保存");
      drawKnReview(host);
      confettiBurst();
    });
  }

  /* ---------- 知识图谱（原生力导向布局，零依赖） ---------- */
  function drawKnGraph(host) {
    var books = (DATA.books.books || []).filter(function (b) { return (b.models_linked || []).length; });
    if (!books.length) { host.innerHTML = '<div class="kn-empty">图谱数据准备中</div>'; return; }
    var modelSet = {};
    (DATA.models.models || []).forEach(function (m) { modelSet[m.name] = m; });
    var nodes = [], links = [], byId = {};
    function addNode(n) { if (!byId[n.id]) { byId[n.id] = n; nodes.push(n); } return byId[n.id]; }
    books.forEach(function (b) {
      var c = noEmoji(b.category);
      addNode({ id: "cat:" + c, label: c, type: "cat", r: 15 });
      var bn = addNode({ id: "bk:" + b.id, label: noEmoji(b.title), type: "book", r: 7, bookId: b.id });
      links.push({ s: "cat:" + c, t: bn.id });
      (b.models_linked || []).forEach(function (mn) {
        if (!modelSet[mn]) return;
        var mnode = addNode({ id: "md:" + mn, label: noEmoji(mn), type: "model", r: 5 });
        links.push({ s: bn.id, t: mnode.id });
      });
    });
    var W = Math.max(280, (host.clientWidth || 340)), H = 460;
    nodes.forEach(function (n, i) {
      var ang = (i / nodes.length) * Math.PI * 2;
      n.x = W / 2 + Math.cos(ang) * (W / 3); n.y = H / 2 + Math.sin(ang) * (H / 3);
      n.vx = 0; n.vy = 0;
    });
    links.forEach(function (l) { l.s = byId[l.s]; l.t = byId[l.t]; });
    /* 力导向仿真 240 轮 */
    for (var it = 0; it < 240; it++) {
      var i, j, a, b2, dx, dy, d2, d, f, ux, uy;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b2 = nodes[j];
          dx = b2.x - a.x; dy = b2.y - a.y; d2 = dx * dx + dy * dy || 1;
          if (d2 > 90000) continue;
          d = Math.sqrt(d2); f = Math.min(900 / d2, 4);
          ux = dx / d; uy = dy / d;
          a.vx -= ux * f; a.vy -= uy * f; b2.vx += ux * f; b2.vy += uy * f;
        }
      }
      for (i = 0; i < links.length; i++) {
        var l = links[i];
        dx = l.t.x - l.s.x; dy = l.t.y - l.s.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
        f = (d - 64) * 0.035; ux = dx / d; uy = dy / d;
        l.s.vx += ux * f; l.s.vy += uy * f; l.t.vx -= ux * f; l.t.vy -= uy * f;
      }
      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.vx += (W / 2 - n.x) * 0.003; n.vy += (H / 2 - n.y) * 0.003;
        n.vx *= 0.8; n.vy *= 0.8;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(n.r + 6, Math.min(W - n.r - 6, n.x));
        n.y = Math.max(n.r + 6, Math.min(H - n.r - 6, n.y));
      }
    }
    var colors = { cat: "var(--accent-gold)", book: "#3B82F6", model: "#10B981" };
    var svgEl = '<svg class="kg-svg" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg">';
    links.forEach(function (l) {
      svgEl += '<line x1="' + l.s.x.toFixed(1) + '" y1="' + l.s.y.toFixed(1) + '" x2="' + l.t.x.toFixed(1) + '" y2="' + l.t.y.toFixed(1) + '" stroke="var(--line-strong)" stroke-width="0.7"/>';
    });
    nodes.forEach(function (n) {
      var fill = colors[n.type] || "var(--accent-gold)";
      svgEl += '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + n.r + '" fill="' + fill + '" fill-opacity="' + (n.type === "cat" ? 0.95 : 0.75) + '" stroke="var(--card-bg)" stroke-width="1.2" data-kgn="' + n.id + '" style="cursor:pointer"/>';
      if (n.type === "cat") {
        svgEl += '<text x="' + n.x.toFixed(1) + '" y="' + (n.y - n.r - 5).toFixed(1) + '" text-anchor="middle" class="kg-label kg-cat">' + esc(n.label) + "</text>";
      } else if (n.type === "book") {
        svgEl += '<text x="' + n.x.toFixed(1) + '" y="' + (n.y + n.r + 10).toFixed(1) + '" text-anchor="middle" class="kg-label">' + esc(n.label.slice(0, 8)) + "</text>";
      }
    });
    svgEl += "</svg>";
    host.innerHTML =
      '<div class="kg-legend"><span><i style="background:var(--accent-gold)"></i>分类</span><span><i style="background:#3B82F6"></i>图书</span><span><i style="background:#10B981"></i>思维模型</span><span class="kg-tip">点图书节点可打开</span></div>' +
      '<div class="kg-wrap">' + svgEl + "</div>";
    $$("[data-kgn]", host).forEach(function (c) {
      c.addEventListener("click", function () {
        var id = c.getAttribute("data-kgn");
        if (id.indexOf("bk:") === 0) { closeSheet(); openBook(Number(id.slice(3))); }
        else toast(id.indexOf("cat:") === 0 ? "分类：" + id.slice(4) : "模型：" + id.slice(3));
      });
    });
  }

  /* ================= 模块：快速记录 FAB（想法/金句/问题/证据/日志/决策） ================= */
  function openCapture(opts) {
    opts = opts || {};
    var mode = opts.mode || "note";
    var books = (DATA.books.books || []).slice(0, 400);
    var bookOpts = '<option value="">不关联图书</option>' + books.map(function (b) {
      var sel = (opts.bookId && b.id === opts.bookId) ? " selected" : "";
      return '<option value="' + b.id + '"' + sel + ">" + esc(noEmoji(b.title)) + "</option>";
    }).join("");
    var form;
    if (mode === "log") {
      form =
        '<label class="cap-label">日期</label><input id="cap-date" class="cap-input" type="date" value="' + todayStr() + '">' +
        '<label class="cap-label">关联图书</label><select id="cap-book" class="cap-input">' + bookOpts + "</select>" +
        '<label class="cap-label">阅读时长（分钟）</label><input id="cap-mins" class="cap-input" type="number" min="0" placeholder="如 25">' +
        '<label class="cap-label">收获笔记</label><textarea id="cap-text" class="cap-input" rows="4" placeholder="这一段读到了什么？"></textarea>';
    } else if (mode === "decision") {
      form =
        '<label class="cap-label">决策标题</label><input id="cap-title" class="cap-input" type="text" placeholder="要决定什么？">' +
        '<label class="cap-label">选项（逗号分隔）</label><input id="cap-options" class="cap-input" type="text" placeholder="A, B, C">' +
        '<label class="cap-label">最终选择</label><input id="cap-choice" class="cap-input" type="text" placeholder="选了哪个？">' +
        '<label class="cap-label">理由</label><textarea id="cap-text" class="cap-input" rows="3" placeholder="为什么这么选？"></textarea>' +
        '<label class="cap-label">日期</label><input id="cap-date" class="cap-input" type="date" value="' + todayStr() + '">';
    } else {
      form =
        '<label class="cap-label">类型</label><div class="cap-types" id="cap-types">' +
        Object.keys(NOTE_TYPES).map(function (k) {
          return '<button class="cap-type' + ((opts.type || "idea") === k ? " on" : "") + '" data-t="' + k + '">' + NOTE_TYPES[k] + "</button>";
        }).join("") + "</div>" +
        '<label class="cap-label">内容</label><textarea id="cap-text" class="cap-input" rows="4" placeholder="想法 / 金句 / 问题 / 证据…"></textarea>' +
        '<label class="cap-label">关联图书（可选）</label><select id="cap-book" class="cap-input">' + bookOpts + "</select>";
    }
    openSheet(
      '<h2 class="stitle">' + (mode === "log" ? "阅读日志" : mode === "decision" ? "决策日志" : "快速记录") + "</h2>" +
      '<div class="ssub">' + (mode === "note" ? "灵感来了，先记下来" : mode === "log" ? "记录每一次阅读的收获" : "把重要决定写下来，事后回看") + "</div>" + form
    );
    if (mode === "note") {
      var curType = opts.type || "idea";
      $$("#cap-types .cap-type").forEach(function (b) {
        b.addEventListener("click", function () {
          curType = b.getAttribute("data-t");
          $$("#cap-types .cap-type").forEach(function (x) { x.classList.toggle("on", x === b); });
        });
      });
      var capText = $("#cap-text"), capBook = $("#cap-book");
      var save = function () {
        var t = (capText.value || "").trim();
        if (!t) { toast("先写点内容"); return; }
        var bid = Number(capBook.value) || null;
        var bt = "";
        if (bid) { var bb = books.filter(function (x) { return x.id === bid; })[0]; if (bb) bt = noEmoji(bb.title); }
        Vault.addNote({ type: curType, text: t, bookId: bid, bookTitle: bt });
        closeSheet(); toast("已记录 · " + NOTE_TYPES[curType]);
        if (state.tab === "knowledge") renderKnowledge();
      };
      capText.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); });
      openSheetFooter("保存记录", save);
    } else if (mode === "log") {
      var logSave = function () {
        var bid = Number($("#cap-book").value) || null;
        var bt = "";
        if (bid) { var bb2 = books.filter(function (x) { return x.id === bid; })[0]; if (bb2) bt = noEmoji(bb2.title); }
        Vault.addReadLog({ date: $("#cap-date").value || todayStr(), bookId: bid, bookTitle: bt, minutes: $("#cap-mins").value, note: $("#cap-text").value });
        closeSheet(); toast("阅读日志已记录 · 打卡 +1");
        if (state.tab === "knowledge") renderKnowledge();
        if (state.tab === "os") renderOSPane();
      };
      openSheetFooter("保存日志", logSave);
    } else {
      var decSave = function () {
        var title = ($("#cap-title").value || "").trim();
        if (!title) { toast("先填决策标题"); return; }
        Vault.addDecision({
          title: title,
          options: ($("#cap-options").value || "").split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean),
          choice: ($("#cap-choice").value || "").trim(),
          rationale: $("#cap-text").value,
          date: $("#cap-date").value || todayStr()
        });
        closeSheet(); toast("决策已记录");
        if (state.tab === "knowledge") renderKnowledge();
      };
      openSheetFooter("保存决策", decSave);
    }
  }

  function openSheetFooter(label, fn) {
    var body = $("#sheet-body");
    var btn = document.createElement("button");
    btn.className = "mcta"; btn.textContent = label;
    btn.style.cssText = "margin-top:14px;width:100%";
    btn.addEventListener("click", fn);
    body.appendChild(btn);
  }

  function initFab() {
    var fab = $("#fab-capture");
    var menu = $("#fab-menu");
    if (!fab || !menu) return;
    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.toggle("show");
      fab.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#fab-capture") && !e.target.closest("#fab-menu")) {
        menu.classList.remove("show"); fab.classList.remove("open");
      }
    });
    $$("[data-fab]", menu).forEach(function (b) {
      b.addEventListener("click", function () {
        menu.classList.remove("show"); fab.classList.remove("open");
        openCapture({ mode: b.getAttribute("data-fab") });
      });
    });
  }

  /* ================= 模块：全局搜索（跨 书/模型/原则/笔记） ================= */
  function globalSearch(q) {
    q = q.trim().toLowerCase();
    var out = { books: [], models: [], principles: [], notes: [] };
    if (!q) return out;
    (DATA.books.books || []).forEach(function (b) {
      var hay = (b.title + " " + (b.en_title || "") + " " + (b.author || "") + " " + (b.summary || "")).toLowerCase();
      if (hay.indexOf(q) !== -1) out.books.push(b);
    });
    (DATA.models.models || []).forEach(function (m) {
      var hay = (m.name + " " + (m.category || "") + " " + (m.pain_point || "") + " " + (m.definition || "")).toLowerCase();
      if (hay.indexOf(q) !== -1) out.models.push(m);
    });
    (DATA.principles.principles || []).forEach(function (p) {
      var hay = (p.quote + " " + (p.person || "") + " " + (p.category || "")).toLowerCase();
      if (hay.indexOf(q) !== -1) out.principles.push(p);
    });
    Vault.notes().forEach(function (n) {
      if ((n.text || "").toLowerCase().indexOf(q) !== -1) out.notes.push(n);
    });
    return out;
  }

  function openGlobalSearch() {
    openSheet(
      '<h2 class="stitle">全局搜索</h2><div class="ssub">一次搜遍 图书 / 思维模型 / 原则 / 我的笔记</div>' +
      '<div class="searchbar" style="margin-top:12px"><input id="gs-q" type="text" placeholder="输入关键词…" autocomplete="off">' + IC.search.replace("<svg", '<svg class="sicon"') + "</div>" +
      '<div id="gs-res"></div>'
    );
    var inp = $("#gs-q");
    setTimeout(function () { inp.focus(); }, 120);
    var draw = function () {
      var r = globalSearch(inp.value);
      var total = r.books.length + r.models.length + r.principles.length + r.notes.length;
      var html = "";
      if (!inp.value.trim()) { $("#gs-res").innerHTML = ""; return; }
      if (!total) { $("#gs-res").innerHTML = '<div class="kn-empty">没有找到「' + esc(inp.value) + "」相关内容</div>"; return; }
      function group(title, arr, render) {
        if (!arr.length) return "";
        return '<div class="gs-group"><h4>' + title + " · " + arr.length + "</h4>" + arr.slice(0, 6).map(render).join("") + "</div>";
      }
      html += group("图书", r.books, function (b) {
        return '<button class="gs-item" data-gsbook="' + b.id + '"><b>' + esc(noEmoji(b.title)) + "</b><span>" + esc(noEmoji(b.author || "")) + " · " + esc(noEmoji(b.category)) + "</span></button>";
      });
      html += group("思维模型", r.models, function (m) {
        return '<button class="gs-item" data-gsmodel="' + esc(m.name) + '"><b>' + esc(noEmoji(m.name)) + "</b><span>" + esc(noEmoji(m.pain_point || "").slice(0, 40)) + "</span></button>";
      });
      html += group("原则", r.principles, function (p) {
        return '<button class="gs-item" data-gspr="' + p.id + '"><b>' + esc(noEmoji(p.person)) + "</b><span>" + esc((p.quote || "").slice(0, 42)) + "</span></button>";
      });
      html += group("我的笔记", r.notes, function (n) {
        return '<button class="gs-item" data-gsnote="' + n.id + '"><b>' + (NOTE_TYPES[n.type] || n.type) + "</b><span>" + esc((n.text || "").slice(0, 42)) + "</span></button>";
      });
      $("#gs-res").innerHTML = html;
      $$("[data-gsbook]").forEach(function (b) {
        b.addEventListener("click", function () { closeSheet(); openBook(Number(b.getAttribute("data-gsbook"))); });
      });
      $$("[data-gsmodel], [data-gspr]").forEach(function (b) {
        b.addEventListener("click", function () {
          closeSheet();
          setTab(b.hasAttribute("data-gsmodel") ? "clinic" : "cards");
          toast("已切换到" + (b.hasAttribute("data-gsmodel") ? "诊所" : "闪卡") + " · 请在其中搜索「" + (b.textContent || "").split("\n")[0].slice(0, 12) + "」");
        });
      });
      $$("[data-gsnote]").forEach(function (b) {
        b.addEventListener("click", function () {
          closeSheet(); setTab("knowledge");
          state.kn.seg = "notes"; renderKnowledge();
          toast("已在知识库 · 记录中定位");
        });
      });
    };
    inp.addEventListener("input", draw);
  }

  /* ================= 模块：AI 助手（配置 API Key · 问书库） ================= */
  var AI = (function () {
    function cfg() {
      return LSget("colinOS_ai", { endpoint: "https://api.openai.com/v1/chat/completions", key: "", model: "gpt-4o-mini" });
    }
    function saveCfg(c) { LSset("colinOS_ai", c); }
    /* 本地检索：为提问构建上下文（书名/要点/模型/原则/笔记） */
    function retrieve(q) {
      q = q.trim().toLowerCase();
      if (!q) return [];
      var terms = q.split(/\s+/).filter(function (t) { return t.length > 1; });
      var scored = [];
      function score(text) {
        text = (text || "").toLowerCase();
        var s = 0;
        terms.forEach(function (t) { if (text.indexOf(t) !== -1) s += t.length; });
        return s;
      }
      (DATA.books.books || []).forEach(function (b) {
        var s = score(b.title) * 3 + score(b.author) + score(b.summary) + (b.insights || []).reduce(function (a, t) { return a + score(t) * 0.5; }, 0);
        if (s > 0) scored.push({ s: s, kind: "book", item: b });
      });
      (DATA.models.models || []).forEach(function (m) {
        var s = score(m.name) * 3 + score(m.pain_point) + score(m.definition);
        if (s > 0) scored.push({ s: s, kind: "model", item: m });
      });
      (DATA.principles.principles || []).forEach(function (p) {
        var s = score(p.quote) + score(p.person);
        if (s > 0) scored.push({ s: s, kind: "principle", item: p });
      });
      Vault.notes().forEach(function (n) {
        var s = score(n.text) * 2;
        if (s > 0) scored.push({ s: s, kind: "note", item: n });
      });
      scored.sort(function (a, b) { return b.s - a.s; });
      return scored.slice(0, 6);
    }
    function contextText(list) {
      return list.map(function (r) {
        if (r.kind === "book") return "【书】" + noEmoji(r.item.title) + "（" + noEmoji(r.item.author || "") + "）：" + (r.item.summary || "") + " 要点：" + (r.item.insights || []).slice(0, 2).join("；");
        if (r.kind === "model") return "【模型】" + noEmoji(r.item.name) + "：" + (r.item.definition || "") + "（痛点：" + (r.item.pain_point || "") + "）";
        if (r.kind === "principle") return "【原则】" + noEmoji(r.item.person) + "：" + (r.item.quote || "");
        return "【我的笔记】" + (r.item.text || "").slice(0, 120);
      }).join("\n");
    }
    function ask(q, onDone, onErr) {
      var c = cfg();
      if (!c.key) { onErr("请先在下方配置 API Key"); return; }
      var ctx = contextText(retrieve(q));
      var sys = "你是 Colin OS 的知识助手。基于以下本地知识库内容回答用户问题，回答用简体中文，简洁有条理，引用内容时注明出处（书名/模型/原则名）。如果资料中没有答案，直说并给出思路。\n\n知识库资料：\n" + (ctx || "（无匹配资料）");
      state.ai.busy = true;
      fetch(c.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + c.key },
        body: JSON.stringify({
          model: c.model || "gpt-4o-mini",
          messages: [{ role: "system", content: sys }, { role: "user", content: q }].concat(state.ai.msgs.slice(-6).map(function (m) { return { role: m.role, content: m.text }; })),
          temperature: 0.4
        })
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error("HTTP " + r.status + " " + t.slice(0, 160)); });
        return r.json();
      }).then(function (j) {
        var txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (!txt) throw new Error("接口返回格式异常");
        state.ai.msgs.push({ role: "user", text: q });
        state.ai.msgs.push({ role: "assistant", text: txt });
        state.ai.busy = false;
        onDone(txt);
      }).catch(function (e) {
        state.ai.busy = false;
        onErr(String(e.message || e));
      });
    }
    return { cfg: cfg, saveCfg: saveCfg, ask: ask, retrieve: retrieve };
  })();

  function openAI() {
    var c = AI.cfg();
    openSheet(
      '<h2 class="stitle">AI 知识助手 ' + IC.ai.replace("<svg", '<svg width="18" height="18" style="stroke:var(--gold)"') + "</h2>" +
      '<div class="ssub">基于你的书库 / 模型 / 原则 / 笔记回答 · 数据不出浏览器（除你配置的接口）</div>' +
      '<div class="ai-cfg">' +
        '<input id="ai-endpoint" class="cap-input" type="text" placeholder="API 地址（OpenAI 兼容）" value="' + esc(c.endpoint) + '">' +
        '<input id="ai-key" class="cap-input" type="password" placeholder="API Key" value="' + esc(c.key) + '">' +
        '<input id="ai-model" class="cap-input" type="text" placeholder="模型名" value="' + esc(c.model) + '">' +
        '<button id="ai-save" class="mcta" style="width:100%;margin-top:8px">保存配置</button>' +
      "</div>" +
      '<div class="ai-log" id="ai-log"></div>' +
      '<div class="ai-in"><input id="ai-q" type="text" placeholder="问点什么… 如：怎么用第一性原理做决策？" autocomplete="off">' +
        '<button id="ai-send" aria-label="发送">' + IC.send.replace("<svg", '<svg width="17" height="17"') + "</button></div>"
    );
    $("#ai-save").addEventListener("click", function () {
      AI.saveCfg({ endpoint: $("#ai-endpoint").value.trim(), key: $("#ai-key").value.trim(), model: $("#ai-model").value.trim() });
      toast("配置已保存（仅存本地）");
    });
    var log = $("#ai-log");
    function drawMsgs() {
      log.innerHTML = state.ai.msgs.map(function (m) {
        return '<div class="ai-msg ' + m.role + '">' + esc(m.text).replace(/\n/g, "<br>") + "</div>";
      }).join("") || '<div class="ai-hint">已就绪 · 提问后会先从你的本地知识库检索相关资料，再交给 AI 回答</div>';
      log.scrollTop = log.scrollHeight;
    }
    drawMsgs();
    function send() {
      var q = $("#ai-q").value.trim();
      if (!q) return;
      if (state.ai.busy) { toast("上一条还在回答中"); return; }
      state.ai.msgs.push({ role: "user", text: q });
      drawMsgs();
      $("#ai-q").value = "";
      var pending = document.createElement("div");
      pending.className = "ai-msg assistant thinking";pending.textContent = "思考中…";
      log.appendChild(pending); log.scrollTop = log.scrollHeight;
      AI.ask(q, function () { drawMsgs(); }, function (err) {
        drawMsgs();
        var e = document.createElement("div");
        e.className = "ai-msg err"; e.textContent = "出错了：" + err;
        log.appendChild(e); log.scrollTop = log.scrollHeight;
      });
    }
    $("#ai-send").addEventListener("click", send);
    $("#ai-q").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  }

  /* ================= 模块：我的 OS（仪表盘 + 导出） ================= */
  function kpiStats() {
    var st = Vault.bookStatusMap();
    var done = 0, reading = 0;
    Object.keys(st).forEach(function (k) { if (st[k] === "done") done++; else if (st[k] === "reading") reading++; });
    var notes = Vault.notes();
    var ideas = notes.filter(function (n) { return n.type === "idea" || n.type === "quote"; }).length;
    var evid = notes.filter(function (n) { return n.type === "evidence" || n.type === "question"; }).length;
    return {
      books: (DATA.books.books || []).length,
      done: done, reading: reading,
      ideas: ideas, evidence: evid,
      actions: LSget("colinOS_totalActions", 0) || 0,
      streak: streakCount(),
      decisions: Vault.decisions().length
    };
  }

  function trendBars() {
    var his = LSget("colinOS_checkins", []);
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(addDaysStr(-i));
    return days.map(function (d) {
      return { d: d.slice(5), on: his.indexOf(d) !== -1, today: d === todayStr() };
    });
  }

  function categoryClusters() {
    var all = DATA.books.books || [];
    var map = {};
    all.forEach(function (b) { var c = noEmoji(b.category); if (c) map[c] = (map[c] || 0) + 1; });
    return Object.keys(map).map(function (k) { return { name: k, n: map[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
  }

  function exportJSON() {
    download("colin-os-export-" + todayStr() + ".json", "application/json", JSON.stringify(Vault.allData(), null, 2));
    toast("JSON 已导出");
  }
  function exportMD() {
    var d = Vault.allData();
    var L = [];
    L.push("# Colin OS 知识导出（" + d.exportedAt.slice(0, 10) + "）\n");
    L.push("- 连续打卡：" + (d.streak.count || 0) + " 天");
    L.push("- 累计践行微行动：" + d.totalActions + " 个\n");
    L.push("## 阅读状态");
    var st = d.bookStatus, bk = {};
    (DATA.books.books || []).forEach(function (b) { bk[b.id] = b; });
    Object.keys(st).forEach(function (id) {
      var b = bk[id];
      L.push("- [" + (st[id] === "done" ? "x" : " ") + "] " + (b ? noEmoji(b.title) : id) + "（" + (st[id] === "done" ? "已读完" : "在读") + "）");
    });
    L.push("\n## 书单");
    d.collections.forEach(function (c) {
      L.push("### " + c.name + "（" + (c.bookIds || []).length + " 本）");
      (c.bookIds || []).forEach(function (id) { if (bk[id]) L.push("- " + noEmoji(bk[id].title)); });
    });
    L.push("\n## 快速记录（" + d.notes.length + " 条）");
    d.notes.forEach(function (n) {
      L.push("- **[" + (NOTE_TYPES[n.type] || n.type) + "]** " + n.text + (n.bookTitle ? "（《" + n.bookTitle + "》）" : "") + " · " + new Date(n.ts).toISOString().slice(0, 10));
    });
    L.push("\n## 阅读日志（" + d.readlog.length + " 条）");
    d.readlog.forEach(function (l) {
      L.push("- " + l.date + (l.minutes ? " · " + l.minutes + " 分钟" : "") + (l.bookTitle ? " · 《" + l.bookTitle + "》" : "") + (l.note ? " · " + l.note : ""));
    });
    L.push("\n## 决策日志（" + d.decisions.length + " 条）");
    d.decisions.forEach(function (x) {
      L.push("- " + x.date + " **" + x.title + "** → " + (x.choice || "未定") + (x.rationale ? "（理由：" + x.rationale + "）" : "") + (x.result ? "（结果：" + x.result + "）" : ""));
    });
    L.push("\n## 复盘（" + d.reviews.length + " 条）");
    d.reviews.forEach(function (r) {
      L.push("- " + new Date(r.ts).toISOString().slice(0, 10) + " [" + (r.period === "week" ? "周" : "月") + "] " + r.text);
    });
    download("colin-os-export-" + todayStr() + ".md", "text/markdown", L.join("\n"));
    toast("Markdown 已导出");
  }

  function renderOSPane() {
    var pane = $("#pane-os");
    var k = kpiStats();
    var tier = localStorage.getItem("colin_unlocked_tier") || "L1";
    var tierCls = tier === "L3" ? "l3" : tier === "L2" ? "l2" : "l1";
    var tierName = tier === "L3" ? "L3 全能智脑" : tier === "L2" ? "L2 商业实战" : "L1 免费版";

    pane.innerHTML =
      '<div class="view-head"><h1>我的 <span>OS</span></h1><p>学习资产与成长系统</p></div>' +
      '<div class="dash-kpis">' +
        [["总藏书", k.books, "library"], ["已读完", k.done, ""], ["在读中", k.reading, ""], ["思想数", k.ideas, "knowledge"],
         ["证据数", k.evidence, "knowledge"], ["累计践行", k.actions, ""], ["连续打卡", k.streak, ""], ["决策数", k.decisions, "knowledge"]].map(function (x) {
          return '<button class="kpi-card" data-kpi="' + x[2] + '"><b>' + x[1] + "</b><span>" + x[0] + "</span></button>";
        }).join("") +
      "</div>" +
      '<div class="dash-trend"><div class="dt-head">' + IC.flame.replace("<svg", '<svg width="14" height="14"') + "近 7 日打卡<span>坚持就是复利</span></div>" +
        '<div class="dt-bars">' + trendBars().map(function (b) {
          return '<div class="dt-bar' + (b.on ? " on" : "") + (b.today ? " today" : "") + '"><i style="height:' + (b.on ? "100%" : "12%") + '"></i><span>' + b.d + "</span></div>";
        }).join("") + "</div></div>" +
      '<div class="dash-clusters"><div class="dt-head">' + IC.graph.replace("<svg", '<svg width="14" height="14"') + "知识集群<span>按藏书量</span></div>" +
        categoryClusters().map(function (c) {
          var w = Math.round(c.n / k.books * 100);
          return '<div class="cl-row"><span class="cl-nm">' + esc(c.name) + '</span><div class="cl-bar"><i style="width:' + w + '%"></i></div><span class="cl-n">' + c.n + "</span></div>";
        }).join("") +
      "</div>" +
      '<div class="profile-hero">' +
        '<div class="pav"><img src="/colin-os/icons/icon-192.png" alt="Colin OS"></div>' +
        "<h2>Colin OS 用户</h2><p>READING TO CHANGE YOURSELF</p>" +
        '<div class="streak-big">' + IC.flame + "<b>" + k.streak + "</b><span>天连续打卡</span></div>" +
      "</div>" +
      '<div class="os-actions">' +
        '<button id="os-reset">重置今日任务</button>' +
        '<button id="os-export-json">导出 JSON</button>' +
        '<button id="os-export-md">导出 Markdown</button>' +
        '<button id="os-ai">AI 助手</button>' +
        '<button id="os-share">分享成果</button>' +
      "</div>" +
      '<div class="os-list">' +
        '<div class="os-li tap" id="os-theme">' +
          '<span class="ic">' + IC.sun + IC.moon + "</span>" +
          '<span class="tx"><b>主题</b><span>浅色书卷 / 暗黑金 一键切换</span></span>' +
          '<span class="arr">' + IC.right + "</span></div>" +
        '<div class="os-li" id="os-kn">' +
          '<span class="ic">' + IC.knowledge + "</span>" +
          '<span class="tx"><b>知识库</b><span>快速记录 · 日志 · 决策 · 复盘 · 图谱</span></span>' +
          '<span class="arr">' + IC.right + "</span></div>" +
        '<div class="os-li" id="os-cards">' +
          '<span class="ic">' + IC.cards + "</span>" +
          '<span class="tx"><b>今日闪卡</b><span>每日 3 张 · 间隔重复回访</span></span>' +
          '<span class="arr">' + IC.right + "</span></div>" +
        '<div class="os-li" id="os-tier">' +
          '<span class="ic">' + IC.bolt + "</span>" +
          '<span class="tx"><b>解锁权限</b><span>200 模型阶梯 · L1 免费 / L2 ￥29.9 / L3 ￥49.9</span></span>' +
          '<span class="tier-pill ' + tierCls + '">' + tierName + "</span></div>" +
        '<div class="os-li" id="os-lib">' +
          '<span class="ic">' + IC.library + "</span>" +
          '<span class="tx"><b>知识操作系统</b><span>' + k.books + " 书 · 200 模型 · 186 原则</span></span>" +
          '<span class="arr">' + IC.right + "</span></div>" +
        '<div class="os-li" id="os-join">' +
          '<span class="ic">' + IC.os + "</span>" +
          '<span class="tx"><b>私域进群</b><span>扫码添加 Colin · 高手密度社群</span></span>' +
          '<span class="arr">' + IC.right + "</span></div>" +
        '<div class="os-li" id="os-about">' +
          '<span class="ic">' + IC.lock + "</span>" +
          '<span class="tx"><b>关于 Colin OS</b><span>readswithcolin.com · thecolin.vip</span></span>' +
          '<span class="arr">' + IC.right + "</span></div>" +
      "</div>";

    $$("[data-kpi]", pane).forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-kpi");
        if (t === "library") { setTab("library"); state.lib.filter = "p1"; renderLibrary(); }
        else if (t === "knowledge") { setTab("knowledge"); }
      });
    });
    $("#os-kn").addEventListener("click", function () { setTab("knowledge"); });
    $("#os-cards").addEventListener("click", function () { setTab("cards"); });
    $("#os-tier").addEventListener("click", function () { setTab("clinic"); });
    $("#os-lib").addEventListener("click", function () { setTab("library"); });
    $("#os-theme").addEventListener("click", toggleTheme);
    $("#os-export-json").addEventListener("click", exportJSON);
    $("#os-export-md").addEventListener("click", exportMD);
    $("#os-ai").addEventListener("click", openAI);
    var osReset = $("#os-reset");
    if (osReset) osReset.addEventListener("click", function () {
      Atoms.resetToday();
      if (state.tab === "cards") Cards.refreshAtoms();
      toast("今日微行动已重置");
    });
    var osShare = $("#os-share");
    if (osShare) osShare.addEventListener("click", function () {
      var msg = "Colin OS · 连续打卡 " + k.streak + " 天 · 累计践行 " + k.actions + " 个微行动 · 读完 " + k.done + " 本书";
      if (navigator.share) { navigator.share({ title: "Colin OS", text: msg }).catch(function () {}); }
      else { try { if (navigator.clipboard) navigator.clipboard.writeText(msg); } catch (e) {} toast("已复制成就：" + msg); }
    });
    $("#os-join").addEventListener("click", function () {
      openSheet(
        '<h2 class="stitle">私域进群</h2><div class="ssub">高手的密度，决定你的天花板</div>' +
        '<div style="text-align:center;padding:14px 0">' +
          '<img class="mqr" src="/assets/qrcode-placeholder.png" alt="微信群二维码" style="width:180px;height:180px">' +
          '<p style="font-size:13px;color:var(--muted);margin-top:10px">微信扫码添加 Colin · 备注「智库」<br>拉你进入高手密度社群</p>' +
        "</div>");
    });
    $("#os-about").addEventListener("click", function () {
      openSheet(
        '<h2 class="stitle">关于 Colin OS</h2><div class="ssub">15 分钟微学习 · 让知识穿过身体</div>' +
        '<div class="reader" style="margin-top:12px">' +
          '<div class="lede">Colin OS 是你的口袋微学习系统：228 本精选图书 15 分钟速读、200 跨学科思维模型痛点诊所、186 条领袖原则间隔重复闪卡，外加知识库（记录/日志/决策/复盘/图谱）与 AI 助手。</div>' +
          '<div class="mtagrow">' +
            '<a class="mtag" href="https://www.readswithcolin.com" target="_blank" rel="noopener">Reads with Colin</a>' +
            '<a class="mtag" href="https://www.thecolin.vip" target="_blank" rel="noopener">The Colin</a>' +
          "</div></div>");
    });
  }

  /* ================= 模块：悬浮音频播放器（TTS 边听边读） =================
     策略：不用 pause/resume（部分安卓不可靠），暂停 = cancel + 记忆当前块进度，
     恢复 = 重播当前块；epoch 计数隔离被 cancel 的旧语音回调，杜绝双声道竞态。 */
  var Player = (function () {
    var bar, playing = false, chunks = [], ci = 0, rate = 1, timer = null, chunkStart = 0, chunkElapsed = 0, epoch = 0;

    function estSec(text) { return Math.max(2, text.length / (3.6 * rate)); }

    function chunkText(text) {
      var out = [], buf = "";
      String(text).split("").forEach(function (ch) {
        buf += ch;
        if (buf.length >= 90 && /[。！？；\n]/.test(ch)) { out.push(buf); buf = ""; }
      });
      if (buf.trim()) out.push(buf);
      return out.length ? out : [String(text)];
    }

    function pickVoice() {
      var vs = speechSynthesis.getVoices() || [];
      for (var i = 0; i < vs.length; i++) { if (/^zh(-|_)?CN/i.test(vs[i].lang)) return vs[i]; }
      for (var j = 0; j < vs.length; j++) { if (/^zh/i.test(vs[j].lang)) return vs[j]; }
      return null;
    }

    function setPlayIcon(isPlaying) {
      var b = $("#ap-btn"); if (!b) return;
      b.setAttribute("data-state", isPlaying ? "pause" : "play");
      b.classList.toggle("playing", isPlaying);
    }

    function ensureBar() {
      if (bar) return bar;
      bar = $("#audio-bar");
      bar.innerHTML =
        '<div class="audio-in">' +
          '<button class="aplay" id="ap-btn" data-state="play" aria-label="播放/暂停">' +
            '<span class="ic-play">' + IC.play + '</span><span class="ic-pause">' + IC.pause + "</span></button>" +
          '<div class="audio-mid">' +
            '<div class="ttl" id="ap-title"></div><div class="sub" id="ap-sub"></div>' +
            '<div class="aprog"><div class="fill" id="ap-fill"></div></div></div>' +
          '<div class="audio-right">' +
            '<button class="rate-btn" data-r="1">1x</button>' +
            '<button class="rate-btn on" data-r="1.25">1.25x</button>' +
            '<button class="rate-btn" data-r="1.5">1.5x</button>' +
            '<button class="aclose" id="ap-close" aria-label="关闭">×</button>' +
          "</div>" +
        "</div>";
      $("#ap-btn").addEventListener("click", toggle);
      $("#ap-close").addEventListener("click", stop);
      $$(".rate-btn", bar).forEach(function (b) {
        b.addEventListener("click", function () {
          rate = Number(b.getAttribute("data-r"));
          $$(".rate-btn", bar).forEach(function (x) { x.classList.toggle("on", x === b); });
          if (playing) { cancelAll(); speakChunk(ci, 0); }
        });
      });
      speechSynthesis.getVoices(); /* 预热音色列表 */
      return bar;
    }

    function cancelAll() {
      epoch++;                /* 使旧 utterance 回调失效 */
      clearInterval(timer);
      speechSynthesis.cancel();
    }
    /* 音频条显隐 → 同步布局变量（toast/FAB 避让） */
    function setAudioH(open) {
      try { document.documentElement.style.setProperty("--audio-h", open ? "58px" : "0px"); } catch (e) {}
    }

    function start(title, sub, text) {
      if (!("speechSynthesis" in window)) { toast("当前浏览器不支持语音朗读"); return; }
      ensureBar();
      cancelAll();
      ci = 0; chunkElapsed = 0; playing = false;
      chunks = chunkText(noEmoji(text).replace(/\*\*/g, ""));
      $("#ap-title").textContent = title;
      $("#ap-sub").textContent = sub || "TTS 朗读 · 边听边读";
      bar.classList.remove("closed");
      setAudioH(true);
      play();
    }

    function play() {
      playing = true;
      setPlayIcon(true);
      speakChunk(ci, chunkElapsed);
    }

    function toggle() {
      if (!playing) { play(); return; }
      /* 暂停：cancel + 记忆当前块已播秒数 */
      chunkElapsed += (Date.now() - chunkStart) / 1000;
      playing = false;
      cancelAll();
      setPlayIcon(false);
    }

    function speakChunk(i, elapsed) {
      if (i >= chunks.length) { finish(); return; }
      ci = i; chunkStart = Date.now(); chunkElapsed = elapsed || 0;
      var myEpoch = epoch;
      var u = new SpeechSynthesisUtterance(chunks[i]);
      var v = pickVoice(); if (v) u.voice = v;
      u.lang = (v && v.lang) || "zh-CN";
      u.rate = rate; u.pitch = 1;
      var est = estSec(chunks[i]);
      clearInterval(timer);
      timer = setInterval(function () {
        var inChunk = Math.min(chunkElapsed + (Date.now() - chunkStart) / 1000, est);
        var p = Math.min(99, Math.round(((ci + inChunk / est) / chunks.length) * 100));
        var fill = $("#ap-fill"); if (fill) fill.style.width = p + "%";
      }, 300);
      function done() {
        if (myEpoch !== epoch || !playing) return; /* 已被 cancel/暂停/关闭 */
        chunkElapsed = 0;
        speakChunk(i + 1, 0);
      }
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    }

    function finish() {
      clearInterval(timer);
      var fill = $("#ap-fill"); if (fill) fill.style.width = "100%";
      playing = false;
      setPlayIcon(false);
      toast("本段讲义播放完毕");
      setAudioH(false);
      setTimeout(function () { if (bar && !playing) bar.classList.add("closed"); }, 1600);
    }

    function stop() {
      playing = false;
      cancelAll();
      ci = 0; chunkElapsed = 0;
      setAudioH(false);
      if (bar) { bar.classList.add("closed"); setPlayIcon(false); }
    }

    return { start: start, stop: stop };
  })();

  /* ================= 模块：添加到主屏幕引导 ================= */
  function initInstall() {
    var barEl = $("#install-bar");
    barEl.innerHTML =
      '<img class="iic" src="/colin-os/icons/icon-192.png" alt="Colin OS">' +
      '<div class="itx"><b>添加到主屏幕</b><span>像原生 App 一样全屏阅读 · 离线可用</span></div>' +
      '<button class="ibtn" id="ib-ok">安装</button>' +
      '<button class="ix" id="ib-x" aria-label="关闭">×</button>';
    var standalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var recentDismiss = Date.now() - (state.install.dismissed || 0) < 7 * 24 * 3600 * 1000;

    function show(iosMode) {
      barEl.setAttribute("data-ios", iosMode ? "1" : "0");
      if (iosMode) {
        $("#ib-ok", barEl).textContent = "分享 → 添加";
        $("#ib-ok", barEl).id = "ib-ok";
      }
      barEl.classList.add("show");
    }
    function hide(persist) {
      barEl.classList.remove("show");
      if (persist) { state.install.dismissed = Date.now(); LSset("colinOS_installDismissed", state.install.dismissed); }
    }

    if (standalone || recentDismiss) return;

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      state.install.deferred = e;
      show(false);
    });
    /* iOS 无原生事件：延迟 2.5s 引导手动添加 */
    if (isIOS) setTimeout(function () { if (!state.install.deferred) show(true); }, 2500);

    barEl.addEventListener("click", function (e) {
      if (e.target.closest("#ib-x")) { hide(true); return; }
      if (e.target.closest("#ib-ok")) {
        if (state.install.deferred) {
          state.install.deferred.prompt();
          state.install.deferred.userChoice.then(function () { hide(true); state.install.deferred = null; });
        } else {
          toast(isIOS ? "点底部分享按钮 → 选「添加到主屏幕」" : "用浏览器菜单「添加到主屏幕」");
          hide(true);
        }
      }
    });
    window.addEventListener("appinstalled", function () { hide(false); toast("Colin OS 已安装到主屏幕"); });
  }

  /* ================= Sheet 弹层 ================= */
  function openSheet(inner) {
    var mask = $("#sheet-mask"), sheet = $("#sheet");
    $("#sheet-body").innerHTML = inner;
    sheet.classList.add("open");
    mask.classList.add("show");
  }
  function closeSheet() {
    $("#sheet").classList.remove("open");
    $("#sheet-mask").classList.remove("show");
  }

  /* ================= 离线提示 ================= */
  function initOffline() {
    var pill = $("#offline-pill");
    function upd() { pill.classList.toggle("show", !navigator.onLine); }
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    upd();
  }

  /* ================= 初始化 ================= */
  function boot(dataAll) {
    DATA.books = dataAll[0]; DATA.models = dataAll[1]; DATA.principles = dataAll[2]; DATA.pillars = dataAll[3];

    renderHeader();
    renderTabbar();
    initInstall();
    initOffline();
    initFab();

    /* Atoms 跨组件变更：Toast + 刷新面板 */
    window.addEventListener("colin:atoms-changed", function (e) {
      var d = e.detail || {};
      if (!d.silent) {
        if (d.claimed) toast("已将【" + noEmoji(d.title) + "】微行动加入今日 Atoms 习惯清单！");
        else toast("已取消【" + noEmoji(d.title) + "】微行动");
      }
      if (state.tab === "cards") Cards.refreshAtoms();
      if (state.tab === "os") renderOSPane();
    });

    /* 知识库数据变更：刷新可见面板 */
    window.addEventListener("colin:vault-changed", function () {
      if (state.tab === "knowledge") renderKnowledge();
      if (state.tab === "os") renderOSPane();
      if (state.tab === "library") drawBooks();
    });

    /* 初始路由：?tab= 或 #tab */
    var t = new URLSearchParams(location.search).get("tab") || (location.hash || "").replace("#", "");
    setTab(["library", "clinic", "cards", "knowledge", "os"].indexOf(t) !== -1 ? t : "library", true);

    /* SW 注册（https / localhost） */
    if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].indexOf(location.hostname) !== -1)) {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    }
  }

  function fail() {
    var pane = $("#pane-library");
    pane.innerHTML = '<div class="cardx" style="text-align:center;margin-top:40px"><h3 style="color:var(--gold-soft)">资源载入失败</h3><p style="color:var(--muted);font-size:13px;margin-top:8px">请检查网络后刷新重试（离线时已缓存内容可直接使用）。</p></div>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* 绑定全局弹层关闭 */
    $("#sheet-mask").addEventListener("click", closeSheet);
    document.addEventListener("click", function (e) {
      if (e.target.closest("#sheet .sclose")) closeSheet();
    });
    Promise.all([
      fetchJSON("/data/books-grid-35-v3.json"),
      fetchJSON("/data/mental-models-200-v7-tiered.json"),
      fetchJSON("/data/principles-grid-186-v3.json"),
      fetchJSON("/data/pillar-essays-data.json")
    ]).then(boot).catch(fail);
  });
})();
