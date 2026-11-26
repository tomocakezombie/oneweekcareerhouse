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

  function render(text) {
    const users = parse(text).slice(0, limit);
    const max = users.length ? users[0].seconds : 0;
    const list = $("list");
    list.replaceChildren();

    for (let i = 0; i < limit; i++) {
      const u = users[i];
      const tr = el("tr", (i < 3 ? `r${i + 1}` : "") + (u ? "" : " empty"));

      const rank = el("td", "col-rank");
      rank.appendChild(el("span", "badge", String(i + 1)));
      tr.appendChild(rank);

      const who = el("td");
      who.appendChild(el("div", "name", u ? u.name : "—"));
      const bar = el("div", "progress");
      const fill = el("i");
      bar.appendChild(fill);
      who.appendChild(bar);
      tr.appendChild(who);

      const time = el("td", "col-time time");
      if (u) {
        time.appendChild(document.createTextNode(humanize(u.seconds)));
        time.appendChild(el("small", null, u.time));
      } else {
        time.textContent = "—";
      }
      tr.appendChild(time);
      list.appendChild(tr);

      // 描画後に幅を入れてバーを伸ばす
      const w = u && max > 0 ? Math.max((u.seconds / max) * 100, 2) : 0;
      requestAnimationFrame(() => fill.style.setProperty("--w", `${w}%`));
    }
  }

  function tick() {
    KKI.fetchFresh(DATA_URL)
      .then((res) => res.text())
      .then((text) => {
        $("notice").className = "notice error";
        $("updated").textContent = new Date().toTimeString().slice(0, 8);
        // 内容が変わったときだけ描き直す (5 秒ごとのちらつき防止)
        if (text === lastText) return;
        lastText = text;
        render(text);
      })
      .catch((err) => {
        console.error(err);
        $("notice").textContent = "ランキングを取得できません。再試行しています…";
        $("notice").className = "notice error show";
        if (lastText === null) render("");
      });
  }

  KKI.reportHeight("ranking");
  tick();
  setInterval(tick, INTERVAL_MS);
})();
