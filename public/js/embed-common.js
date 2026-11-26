// iframe 埋め込み用ページの共通処理
//  - iframe の大きさに合わせて中身を自動で拡大・縮小 (スクロールバーを出さない)
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);

  // キャッシュを避けて取得する
  function fetchFresh(url) {
    const sep = url.includes("?") ? "&" : "?";
    return fetch(url + sep + "nocache=" + Date.now(), { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res;
    });
  }

  // iframe の大きさに合わせて .shell を拡大・縮小し，スクロールバーを出さない
  //   mode "contain": 幅 designWidth px で組んだ中身を縦横比を保ったまま全体が収まるよう拡縮 (座席マップ)
  //   mode "width"  : 幅は常に iframe いっぱい．高さが足りないときだけ縮小 (ランキング)
  // あわせて「この幅なら何 px の高さがちょうどよいか」を親へ postMessage で通知する．
  //   親側で受け取れば iframe の高さを自動で合わせられる (受け取らなくても表示は崩れない)．
  function fit(page, mode, designWidth) {
    const root = document.documentElement;
    const shell = document.querySelector(".shell");
    root.classList.add("fit");
    let lastSent = 0;

    const update = () => {
      const vw = root.clientWidth;
      const vh = root.clientHeight;
      if (!vw || !vh) return;
      let s, x = 0, ideal;

      if (mode === "contain") {
        shell.style.width = designWidth + "px";
        const w = shell.offsetWidth;
        const h = shell.offsetHeight;
        s = Math.min(vw / w, vh / h);
        x = (vw - w * s) / 2;
        ideal = Math.ceil((h * vw) / w);
      } else {
        shell.style.width = vw + "px";
        const h = shell.offsetHeight;
        s = Math.min(1, vh / h);
        if (s < 1) shell.style.width = vw / s + "px"; // 縮小後も横幅いっぱいになるよう広げる
        ideal = h;
      }
      shell.style.transform = `translate(${x}px, 0) scale(${s})`;

      if (window.parent !== window && ideal !== lastSent) {
        lastSent = ideal;
        window.parent.postMessage({ source: "kki-embed", page: page, height: ideal }, "*");
      }
    };

    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    };
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(shell);
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    schedule();
  }

  // "HH:MM:SS" (H は 24 以上もありうる) を秒へ
  function hmsToSeconds(str) {
    const p = String(str || "").trim().split(":").map(Number);
    if (p.length !== 3 || p.some(Number.isNaN)) return 0;
    return p[0] * 3600 + p[1] * 60 + p[2];
  }

  window.KKI = { params, fetchFresh, fit, hmsToSeconds };
})();
