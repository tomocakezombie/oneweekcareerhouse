// 週間ランキング (public/ranking.html)
//  データ: ../weekly_login_time.txt  (1 行 1 人: "ユーザ名,HH:MM:SS")
//  ?limit=N で表示人数を変更 (既定 10, 3〜50)
(function () {
  "use strict";

  const DATA_URL = "../weekly_login_time.txt";
  const INTERVAL_MS = 5000;
  const limit = Math.min(50, Math.max(3, parseInt(KKI.params.get("limit"), 10) || 10));

  const $ = (id) => document.getElementById(id);
  let lastText = null;

  const CROWN =
    '<svg class="crown" viewBox="0 0 24 16" fill="currentColor" aria-hidden="true">' +
    '<path d="M2 14h20l1-11-6 5-5-7-5 7-6-5z"/></svg>';

  function parse(text) {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const i = line.lastIndexOf(",");
        const name = line.slice(0, i).trim();
        const time = line.slice(i + 1).trim();
        return { name, time, seconds: KKI.hmsToSeconds(time) };
      })
      .filter((u) => u.name)
      .sort((a, b) => b.seconds - a.seconds);
  }

  // 12h 34m の形式
  function humanize(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderPodium(top) {
    const podium = $("podium");
    podium.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const u = top[i];
      const card = el("article", `podium-card r${i + 1}`);
      const medal = el("div", "medal", String(i + 1));
      if (i === 0) medal.insertAdjacentHTML("afterbegin", CROWN);
      card.appendChild(medal);
      card.appendChild(el("div", "podium-name", u ? u.name : "—"));
      const t = el("div", "podium-time");
      if (u) {
        t.appendChild(el("b", null, humanize(u.seconds)));
        t.appendChild(document.createElement("br"));
        t.appendChild(document.createTextNode(u.time));
      } else {
        t.textContent = "記録なし";
      }
      card.appendChild(t);
      card.setAttribute("aria-label", u ? `${i + 1} 位 ${u.name} ${u.time}` : `${i + 1} 位 記録なし`);
      podium.appendChild(card);
    }
  }

  function renderList(users, max) {
    const list = $("list");
    list.replaceChildren();
    for (let i = 3; i < limit; i++) {
      const u = users[i];
      const li = el("li", "row" + (u ? "" : " empty"));
      li.style.animationDelay = `${(i - 3) * 0.04}s`;
      li.appendChild(el("div", "rank", String(i + 1)));

      const who = el("div", "who");
      who.appendChild(el("div", "name", u ? u.name : "—"));
      const bar = el("div", "bar");
      const fill = el("i");
      bar.appendChild(fill);
      who.appendChild(bar);
      li.appendChild(who);

      const time = el("div", "time");
      if (u) {
        time.appendChild(document.createTextNode(humanize(u.seconds)));
        time.appendChild(el("small", null, u.time));
      } else {
        time.textContent = "—";
      }
      li.appendChild(time);
      list.appendChild(li);

      // 描画後に幅を入れてバーを伸ばす
      const w = u && max > 0 ? (u.seconds / max) * 100 : 0;
      requestAnimationFrame(() => fill.style.setProperty("--w", `${Math.max(w, u ? 2 : 0)}%`));
    }
    if (limit <= 3) list.parentElement.hidden = true;
  }

  function render(text) {
    const users = parse(text).slice(0, limit);
    const max = users.length ? users[0].seconds : 0;
    renderPodium(users);
    renderList(users, max);
  }

  function tick() {
    KKI.fetchFresh(DATA_URL)
      .then((res) => res.text())
      .then((text) => {
        $("live").dataset.state = "ok";
        $("notice").className = "notice error";
        const now = new Date();
        $("updated").textContent = now.toTimeString().slice(0, 8);
        // 内容が変わったときだけ描き直す (5 秒ごとのちらつき防止)
        if (text === lastText) return;
        lastText = text;
        render(text);
      })
      .catch((err) => {
        console.error(err);
        $("live").dataset.state = "error";
        $("notice").textContent = "ランキングを取得できません。再試行しています…";
        $("notice").className = "notice error show";
        if (lastText === null) render("");
      });
  }

  KKI.reportHeight("ranking");
  tick();
  setInterval(tick, INTERVAL_MS);
})();
