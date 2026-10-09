/* ============================================================
   Colin OS · Wiser 风格 PWA 微学习应用
   模块：路由/TABBAR · 智库双模速读 · 诊所 · 间隔重复闪卡 · 我的
        悬浮 TTS 音频播放器 · 添加到主屏幕 · 离线缓存
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
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
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

  /* ================= 内联 SVG 图标（防 emoji 豆腐块） ================= */
  function svg(inner, vb) {
    return '<svg viewBox="' + (vb || "0 0 24 24") + '" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>";
  }
  var IC = {
    library: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    clinic: svg('<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6.5 7.3 10.9 16.2M17.5 7.3 13.1 16.2M7 6h10"/>'),
    cards: svg('<rect x="7" y="3" width="13" height="15" rx="3"/><path d="M4 7v11a3 3 0 0 0 3 3h9"/>'),
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
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="var(--accent-gold)" stroke="none"/>')
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

  /* ================= 每日打卡（Streak） ================= */
  /* 同一天只 +1，卡片完成 / 微行动全完成 均触发 */
  function dayCheckIn() {
    var st = LSget("colinOS_streak", { count: 0, last: null });
    var t = todayStr();
    if (st.last !== t) {
      var y = addDaysStr(-1);
      st.count = (st.last === y) ? (st.count || 0) + 1 : 1;
      st.last = t;
      LSset("colinOS_streak", st);
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

  /* ================= 数据 ================= */
  var DATA = { books: null, models: null, principles: null, pillars: null };

  /* ================= 应用状态 ================= */
  var state = {
    tab: "library",
    lib: { q: "", cat: "" },
    panesRendered: {},
    install: { deferred: null, dismissed: LSget("colinOS_installDismissed", 0) }
  };
  var SR_STEPS = [1, 3, 7, 14, 30];

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
        '<button class="theme-toggle" id="theme-btn" aria-label="切换浅色/暗色主题">' + IC.sun + IC.moon + "</button>" +
      "</div>";
    $("#theme-btn").addEventListener("click", toggleTheme);
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
    if (tab === "os") renderOSPane();
  }

  function renderPane(tab) {
    if (tab === "library") renderLibrary();
    if (tab === "clinic") renderClinic();
    if (tab === "cards") Cards.mount();
  }

  /* ================= 模块：智库 Library ================= */
  function renderLibrary() {
    var pane = $("#pane-library");
    var books = DATA.books.books || [];
    var pillars = DATA.pillars.essays || [];
    var cats = [];
    books.forEach(function (b) { var c = noEmoji(b.category); if (c && cats.indexOf(c) === -1) cats.push(c); });

    pane.innerHTML =
      '<div class="view-head"><h1>Colin <span>智库</span></h1>' +
        "<p>35 本精选图书 · 15 分钟速读拆解 · 4 大基石专栏</p></div>" +
      '<div class="searchbar"><input id="lib-q" type="text" placeholder="搜索书名 / 作者 / 关键词…" value="' + esc(state.lib.q) + '">' + IC.search.replace("<svg", '<svg class="sicon"') + "</div>" +
      '<div class="chiprow" id="lib-cats">' +
        '<button class="chip' + (state.lib.cat === "" ? " on" : "") + '" data-cat="">全部</button>' +
        cats.map(function (c) { return '<button class="chip' + (state.lib.cat === c ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") +
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
    $$("#lib-cats .chip", pane).forEach(function (c) {
      c.addEventListener("click", function () {
        state.lib.cat = c.getAttribute("data-cat");
        $$("#lib-cats .chip", pane).forEach(function (x) { x.classList.toggle("on", x === c); });
        drawBooks();
      });
    });
    $$("[data-pillar]", pane).forEach(function (el) {
      el.addEventListener("click", function () { openPillar(Number(el.getAttribute("data-pillar"))); });
    });
    drawBooks();
  }

  function drawBooks() {
    var host = $("#lib-books"); if (!host) return;
    var q = state.lib.q.trim().toLowerCase();
    var cat = state.lib.cat;
    var list = (DATA.books.books || []).filter(function (b) {
      if (cat && noEmoji(b.category) !== cat) return false;
      if (q) {
        var hay = (b.title + " " + (b.en_title || "") + " " + (b.author || "") + " " + (b.summary || "") + " " + (b.models_linked || []).join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (!list.length) {
      host.innerHTML = '<div class="cardx" style="text-align:center;color:var(--muted)">没有匹配的图书，换个关键词试试。</div>';
      return;
    }
    host.innerHTML =
      '<div class="sec-row"><h2>精选<i>图书</i></h2><span>' + list.length + " 本 · 15 分钟/本</span></div>" +
      '<div class="grid-auto">' + list.map(function (b) {
        return '<div class="cardx tap" data-book="' + b.id + '">' +
          '<span class="cat">' + esc(noEmoji(b.category)) + "</span>" +
          "<h3>" + esc(noEmoji(b.title)) + '<span class="en">' + esc(b.en_title || "") + "</span></h3>" +
          '<div class="desc">' + esc(b.summary || "") + "</div>" +
          '<div class="meta"><span>文 / ' + esc(noEmoji(b.author || "")) + "</span>" +
            '<span class="go" data-listen="' + b.id + '">' + "15 分钟速读 →</span></div>" +
        "</div>";
      }).join("") + "</div>";
    $$("[data-book]", host).forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest("[data-listen]")) return;
        openBook(Number(el.getAttribute("data-book")));
      });
    });
  }

  /* ---------- 图书详情：15 分钟 / 完整 双视图 ---------- */
  var readerCtx = null;

  function openBook(id) {
    var b = (DATA.books.books || []).filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    readerCtx = { type: "book", item: b, mode: "s15" };
    openSheet(
      '<h2 class="stitle">' + esc(noEmoji(b.title)) + "</h2>" +
      '<div class="ssub">文 / ' + esc(noEmoji(b.author || "")) + " · " + esc(noEmoji(b.category)) + "</div>" +
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
        drawReader();
      });
    });
    drawReader();
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
      var mdNew = fresh.filter(function (c) { return c.kind === "md"; });
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
      var html = '<div class="atoms-panel"><div class="atoms-head"><div class="ttl">' + IC.flame + '🔥 今日待办微行动</div>' +
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
                    '<button class="claim-btn" id="fc-claim">' + IC.bolt + '⚡ 领取代办：开启 2 分钟微行动</button></div>' : "") +
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
          fcb.innerHTML = (claimed ? IC.check + "已领取（点击可取消）" : IC.bolt + "⚡ 领取代办：开启 2 分钟微行动");
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

    return { mount: mount, refresh: refresh };
  })();

  /* ================= 模块：我的 OS ================= */
  function renderOSPane() {
    var pane = $("#pane-os");
    var streak = streakCount();
    var sr = LSget("colinOS_sr", { cards: {} });
    var learned = 0;
    Object.keys(sr.cards || {}).forEach(function (k) { if (sr.cards[k].reps > 0) learned++; });
    var tier = localStorage.getItem("colin_unlocked_tier") || "L1";
    var tierCls = tier === "L3" ? "l3" : tier === "L2" ? "l2" : "l1";
    var tierName = tier === "L3" ? "L3 全能智脑" : tier === "L2" ? "L2 商业实战" : "L1 免费版";

    pane.innerHTML =
      '<div class="view-head"><h1>我的 <span>OS</span></h1><p>学习资产与成长系统</p></div>' +
      '<div class="profile-hero">' +
        '<div class="pav"><img src="/colin-os/icons/icon-192.png" alt="Colin OS"></div>' +
        "<h2>Colin OS 用户</h2><p>READING TO CHANGE YOURSELF</p>" +
        '<div class="streak-big">' + IC.flame + "<b>" + streak + "</b><span>天连续打卡</span></div>" +
      "</div>" +
      '<div class="stat-row">' +
        '<div class="stat-box"><b>' + streak + "</b><span>连续打卡</span></div>" +
        '<div class="stat-box"><b>' + (LSget("colinOS_totalActions", 0) || 0) + "</b><span>累计践行</span></div>" +
        '<div class="stat-box"><b>' + learned + "</b><span>研读模型</span></div>" +
      "</div>" +
      '<div class="os-actions">' +
        '<button id="os-reset">重置今日任务</button>' +
        '<button id="os-share">分享成果</button>' +
      "</div>" +
      '<div class="os-list">' +
        '<div class="os-li tap" id="os-theme">' +
          '<span class="ic">' + IC.sun + IC.moon + "</span>" +
          '<span class="tx"><b>☀️/🌙 主题</b><span>浅色书卷 / 暗黑金 一键切换</span></span>' +
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
          '<span class="tx"><b>知识操作系统</b><span>35 书 · 200 模型 · 186 原则</span></span>' +
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

    $("#os-cards").addEventListener("click", function () { setTab("cards"); });
    $("#os-tier").addEventListener("click", function () { setTab("clinic"); });
    $("#os-lib").addEventListener("click", function () { setTab("library"); });
    $("#os-theme").addEventListener("click", toggleTheme);
    var osReset = $("#os-reset");
    if (osReset) osReset.addEventListener("click", function () {
      Atoms.resetToday();
      if (state.tab === "cards") Cards.refreshAtoms();
      toast("今日微行动已重置");
    });
    var osShare = $("#os-share");
    if (osShare) osShare.addEventListener("click", function () {
      var msg = "Colin OS · 连续打卡 " + streak + " 天 · 累计践行 " + (LSget("colinOS_totalActions", 0) || 0) + " 个微行动";
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
          '<div class="lede">Colin OS 是你的口袋微学习系统：35 本精选图书 15 分钟速读、200 跨学科思维模型痛点诊所、186 条领袖原则间隔重复闪卡。</div>' +
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

    function start(title, sub, text) {
      if (!("speechSynthesis" in window)) { toast("当前浏览器不支持语音朗读"); return; }
      ensureBar();
      cancelAll();
      ci = 0; chunkElapsed = 0; playing = false;
      chunks = chunkText(noEmoji(text).replace(/\*\*/g, ""));
      $("#ap-title").textContent = title;
      $("#ap-sub").textContent = sub || "TTS 朗读 · 边听边读";
      bar.classList.remove("closed");
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
      setTimeout(function () { if (bar && !playing) bar.classList.add("closed"); }, 1600);
    }

    function stop() {
      playing = false;
      cancelAll();
      ci = 0; chunkElapsed = 0;
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

    /* 初始路由：?tab= 或 #tab */
    var t = new URLSearchParams(location.search).get("tab") || (location.hash || "").replace("#", "");
    setTab(["library", "clinic", "cards", "os"].indexOf(t) !== -1 ? t : "library", true);

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
