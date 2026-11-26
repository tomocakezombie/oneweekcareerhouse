// iframe 埋め込み用ページの共通処理
//  - ?theme=light|dark でテーマ固定 (省略時は OS 設定)
//  - ?bg=transparent で背景を透過
//  - 親ウィンドウへ自分の高さを postMessage で通知 (iframe の高さ自動調整用)
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const root = document.documentElement;

  const theme = params.get("theme");
  if (theme === "light" || theme === "dark") root.dataset.theme = theme;
  if (params.get("bg") === "transparent") root.dataset.bg = "transparent";

  // キャッシュを避けて取得する
  function fetchFresh(url) {
    const sep = url.includes("?") ? "&" : "?";
    return fetch(url + sep + "nocache=" + Date.now(), { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res;
    });
  }

  // 親ページへ高さを通知する
  //   親側の例:
  //   window.addEventListener("message", (e) => {
  //     if (e.data && e.data.source === "kki-embed") {
  //       document.getElementById(e.data.page).style.height = e.data.height + "px";
  //     }
  //   });
  function reportHeight(page) {
    if (window.parent === window) return;
    let last = 0;
    const send = () => {
      const h = Math.ceil(document.documentElement.scrollHeight);
      if (h === last) return;
      last = h;
      window.parent.postMessage({ source: "kki-embed", page: page, height: h }, "*");
    };
    if ("ResizeObserver" in window) new ResizeObserver(send).observe(document.body);
    window.addEventListener("load", send);
    send();
  }

  // "HH:MM:SS" (H は 24 以上もありうる) を秒へ
  function hmsToSeconds(str) {
    const p = String(str || "").trim().split(":").map(Number);
    if (p.length !== 3 || p.some(Number.isNaN)) return 0;
    return p[0] * 3600 + p[1] * 60 + p[2];
  }

  window.KKI = { params, fetchFresh, reportHeight, hmsToSeconds };
})();
