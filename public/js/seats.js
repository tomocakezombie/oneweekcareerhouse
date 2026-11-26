// 座席状況 (public/seats.html)
//  レイアウト: ../seat_data.json
//  状態      : ../php/data.php  ([{"aw01": true}, {"is_new_time": true}, {"update_time": "..."} ...])
(function () {
  "use strict";

  const LAYOUT_URL = "../seat_data.json";
  const DATA_URL = "../php/data.php";
  const INTERVAL_MS = 5000;
  // 端末名の形式 (seat_data.json 内の凡例用の "使用" "空き" などを除外する)
  const TERMINAL_RE = /^[a-z]w\d{2}$/;
  const RING_LEN = 2 * Math.PI * 27;

  const $ = (id) => document.getElementById(id);
  const seats = new Map(); // 端末名 -> 要素
  const states = new Map(); // 端末名 -> "using" | "free" | "unknown"

  function buildFloor(layout) {
    const grid = $("grid");
    const cols = Math.max(...layout.map((r) => (Array.isArray(r) ? r.length : 0)));
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    // 端末を含まない行が連続する部分は通路として 1 本にまとめる
    let inAisle = false;
    layout.forEach((row) => {
      const ids = Array.isArray(row) ? row : [];
      const hasSeat = ids.some((id) => id && TERMINAL_RE.test(id));
      if (!hasSeat) {
        if (!inAisle) {
          const aisle = document.createElement("div");
          aisle.className = "aisle";
          aisle.setAttribute("aria-hidden", "true");
          aisle.textContent = "aisle";
          grid.appendChild(aisle);
        }
        inAisle = true;
        return;
      }
      inAisle = false;

      for (let c = 0; c < cols; c++) {
        const id = ids[c];
        const cell = document.createElement("div");
        if (id && TERMINAL_RE.test(id)) {
          cell.className = "seat";
          cell.dataset.state = "unknown";
          cell.tabIndex = 0;
          cell.setAttribute("role", "gridcell");
          cell.textContent = id;
          cell.title = `${id}: 状態不明`;
          seats.set(id, cell);
          states.set(id, "unknown");
        } else {
          cell.setAttribute("aria-hidden", "true");
        }
        grid.appendChild(cell);
      }
    });
    $("n-total").textContent = seats.size;
  }

  function parseData(json) {
    const list = Array.isArray(json) ? json : json.data || [];
    const result = { isNew: false, updateTime: "", terminals: new Map() };
    list.forEach((obj) => {
      const key = Object.keys(obj)[0];
      const val = obj[key];
      if (key === "is_new_time") result.isNew = !!val;
      else if (key === "update_time") result.updateTime = String(val);
      else if (TERMINAL_RE.test(key)) result.terminals.set(key, !!val);
    });
    return result;
  }

  function setNotice(text, kind) {
    const el = $("notice");
    el.textContent = text || "";
    el.className = "notice" + (text ? " show" : "") + (kind === "error" ? " error" : "");
  }

  function render(data, first) {
    let using = 0;
    let free = 0;

    seats.forEach((el, id) => {
      let next = "unknown";
      if (data.terminals.has(id)) next = data.terminals.get(id) ? "using" : "free";
      if (next === "using") using++;
      else if (next === "free") free++;

      const prev = states.get(id);
      if (prev === next) return;
      states.set(id, next);
      el.dataset.state = next;
      const label = next === "using" ? "使用中" : next === "free" ? "空き" : "状態不明";
      el.title = `${id}: ${label}`;
      el.setAttribute("aria-label", `${id} ${label}`);
      if (!first && prev !== "unknown") {
        el.classList.remove("changed");
        void el.offsetWidth; // アニメーションを再始動
        el.classList.add("changed");
      }
    });

    $("n-using").textContent = using;
    $("n-free").textContent = free;

    // 使用率は配置図上の全端末数を分母にする
    const rate = seats.size ? (using / seats.size) * 100 : 0;
    $("rate").textContent = rate.toFixed(0);
    $("ring-bar").style.strokeDashoffset = String(RING_LEN * (1 - Math.min(rate, 100) / 100));
    $("ring").setAttribute("aria-label", `使用率 ${rate.toFixed(1)}%`);

    let level, color;
    if (rate > 60) { level = "混雑しています"; color = "var(--danger)"; }
    else if (rate > 30) { level = "やや混雑"; color = "var(--warn)"; }
    else { level = "空いています"; color = "var(--ok)"; }
    $("level").textContent = level;
    document.querySelector(".summary").style.setProperty("--level", color);

    // update_time は "YYYY-MM-DDTHH:MM:SS.uuuuuu+09:00"
    if (data.updateTime.length >= 19) $("updated").textContent = data.updateTime.slice(11, 19);

    $("floor").dataset.stale = String(!data.isNew);
    $("live").dataset.state = data.isNew ? "ok" : "stale";
    setNotice(data.isNew ? "" : "座席情報が取得できていません。表示は最後に取得した状態です。");
  }

  let first = true;
  function tick() {
    KKI.fetchFresh(DATA_URL)
      .then((res) => res.json())
      .then((json) => {
        if (json && json.error) throw new Error(json.error);
        render(parseData(json), first);
        first = false;
      })
      .catch((err) => {
        console.error(err);
        $("live").dataset.state = "error";
        $("floor").dataset.stale = "true";
        setNotice("サーバに接続できません。再試行しています…", "error");
      });
  }

  KKI.reportHeight("seats");
  KKI.fetchFresh(LAYOUT_URL)
    .then((res) => res.json())
    .then((layout) => {
      buildFloor(layout);
      tick();
      setInterval(tick, INTERVAL_MS);
    })
    .catch((err) => {
      console.error(err);
      $("live").dataset.state = "error";
      setNotice("端末配置 (seat_data.json) を読み込めませんでした。", "error");
    });
})();
