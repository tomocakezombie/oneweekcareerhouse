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
  // 端末が 1 台もない列の幅 (端末列を 1 としたときの比率)
  const EMPTY_COL_FR = 0.3;

  const $ = (id) => document.getElementById(id);
  const isTerminal = (id) => typeof id === "string" && TERMINAL_RE.test(id);
  const seats = new Map(); // 端末名 -> 要素
  const states = new Map(); // 端末名 -> "using" | "free" | "unknown"

  function buildFloor(layout) {
    const grid = $("grid");
    const rows = layout.filter(Array.isArray);
    const cols = Math.max(...rows.map((r) => r.length));

    // 端末を含む列は 1fr，含まない列 (通路) は細くする
    const colSizes = [];
    for (let c = 0; c < cols; c++) {
      const used = rows.some((r) => isTerminal(r[c]));
      colSizes.push(used ? "minmax(0, 1fr)" : `minmax(0, ${EMPTY_COL_FR}fr)`);
    }
    grid.style.gridTemplateColumns = colSizes.join(" ");

    // 端末を含まない行が連続する部分は通路として 1 本にまとめる
    let inAisle = false;
    rows.forEach((ids) => {
      if (!ids.some(isTerminal)) {
        if (!inAisle) {
          const aisle = document.createElement("div");
          aisle.className = "aisle";
          aisle.setAttribute("aria-hidden", "true");
          grid.appendChild(aisle);
        }
        inAisle = true;
        return;
      }
      inAisle = false;

      for (let c = 0; c < cols; c++) {
        const id = ids[c];
        const cell = document.createElement("div");
        if (isTerminal(id)) {
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
  }

  function parseData(json) {
    const list = Array.isArray(json) ? json : json.data || [];
    const result = { isNew: false, terminals: new Map() };
    list.forEach((obj) => {
      const key = Object.keys(obj)[0];
      if (key === "is_new_time") result.isNew = !!obj[key];
      else if (isTerminal(key)) result.terminals.set(key, !!obj[key]);
    });
    return result;
  }

  function setNotice(text, kind) {
    const el = $("notice");
    el.textContent = text || "";
    el.className = "notice" + (text ? " show" : "") + (kind === "error" ? " error" : "");
  }

  function render(data, first) {
    seats.forEach((el, id) => {
      let next = "unknown";
      if (data.terminals.has(id)) next = data.terminals.get(id) ? "using" : "free";

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

    $("floor").dataset.stale = String(!data.isNew);
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
      setNotice("端末配置 (seat_data.json) を読み込めませんでした。", "error");
    });
})();
