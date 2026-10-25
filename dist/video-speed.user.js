// ==UserScript==
// @name         Video Speed Controller
// @namespace    https://github.com/HaPiz-L
// @version      1.0.0
// @description  极简、纯粹、无感跟随的视频倍速控制器。突破平台限制（如4x以上），完美适配 YouTube、B站、抖音及其他主流网页。本项目由 HaPiz-L 结合 DeepSeek AI 协作完成。
// @author       HaPiz-L
// @match        *://*/*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @license      MIT
// ==/UserScript==
(() => {
  // src/main.js
  (() => {
    let targetRate = 1, lastPlaybackRate = 1;
    if (typeof GM_getValue !== "undefined") {
      const saved = GM_getValue("vs_rate");
      if (saved && Number(saved) !== 1) {
        targetRate = lastPlaybackRate = Number(saved);
      }
    }
    let uiWrap, uiBtn, uiMenu, hideTimer, targetVideo, knownVideos = [], tipsDom, tipsTimer, rafId;
    const showTips = (text) => {
      if (!document.body) return;
      if (!tipsDom) {
        tipsDom = document.createElement("div");
        tipsDom.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#fff;padding:10px 20px;border-radius:8px;font-size:20px;font-weight:bold;z-index:2147483647;pointer-events:none;transition:opacity 0.3s;opacity:0;font-family:system-ui";
        document.body.appendChild(tipsDom);
      }
      tipsDom.innerText = text;
      tipsDom.style.opacity = 1;
      clearTimeout(tipsTimer);
      tipsTimer = setTimeout(() => {
        if (tipsDom) tipsDom.style.opacity = 0;
      }, 1e3);
    };
    const getVideoRect = (v) => {
      let rect = v.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
      let el = v;
      if (location.hostname.includes("youtube.com")) el = v.closest("#movie_player") || v.closest(".html5-video-player") || v;
      else if (location.hostname.includes("douyin.com")) el = v.closest(".xgplayer") || v;
      else if (location.hostname.includes("bilibili.com")) el = v.closest(".bpx-player-video-wrap") || v;
      return el.getBoundingClientRect();
    };
    const initUI = () => {
      if (uiWrap || !document.body) return;
      uiWrap = document.createElement("div");
      uiWrap.style.cssText = "position:fixed;top:0;left:0;transform:translate(-50%,0);background:rgba(0,0,0,0.8);color:#fff;padding:6px 14px;border-radius:20px;display:none;align-items:center;gap:8px;font-size:14px;font-family:system-ui;z-index:2147483647;opacity:0;transition:opacity 0.25s;pointer-events:auto;cursor:pointer;border:1px solid rgba(255,255,255,0.15);box-shadow:0 4px 12px rgba(0,0,0,0.4);user-select:none;backdrop-filter:blur(4px);";
      ["pointerdown", "mousedown", "mouseup", "click", "dblclick"].forEach((e) => uiWrap.addEventListener(e, (ev) => ev.stopPropagation()));
      uiBtn = document.createElement("span");
      uiBtn.style.fontWeight = "bold";
      uiBtn.innerText = `\u500D\u901F ${targetRate}x`;
      uiMenu = document.createElement("div");
      uiMenu.style.cssText = "position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:8px;background:rgba(0,0,0,0.95);color:#fff;border-radius:8px;padding:6px 0;display:none;flex-direction:column;min-width:90px;box-shadow:0 4px 12px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);";
      ["pointerdown", "mousedown", "mouseup", "click"].forEach((e) => uiMenu.addEventListener(e, (ev) => ev.stopPropagation()));
      const menuData = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
      menuData.forEach((r) => {
        const item = document.createElement("div");
        item.innerText = r + "x";
        item.style.cssText = "padding:8px 16px;text-align:center;transition:background 0.2s;font-size:14px;";
        item.onmouseenter = () => item.style.background = "rgba(255,255,255,0.15)";
        item.onmouseleave = () => item.style.background = "transparent";
        item.onclick = (e) => {
          e.stopPropagation();
          setRate(r);
          uiMenu.style.display = "none";
          uiWrap.style.opacity = 0;
        };
        uiMenu.appendChild(item);
      });
      const customItem = document.createElement("div");
      customItem.innerText = "\u81EA\u5B9A\u4E49...";
      customItem.style.cssText = "padding:8px 16px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);";
      customItem.onmouseenter = () => customItem.style.background = "rgba(255,255,255,0.15)";
      customItem.onmouseleave = () => customItem.style.background = "transparent";
      customItem.onclick = (e) => {
        e.stopPropagation();
        const val = prompt("\u8F93\u5165\u76EE\u6807\u500D\u901F (0.1 ~ 16):", targetRate);
        if (val !== null) setRate(Number(val));
        uiMenu.style.display = "none";
        uiWrap.style.opacity = 0;
      };
      uiMenu.appendChild(customItem);
      uiWrap.appendChild(uiBtn);
      uiWrap.appendChild(uiMenu);
      uiBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpening = uiMenu.style.display !== "flex";
        uiMenu.style.display = isOpening ? "flex" : "none";
        if (isOpening) {
          uiWrap.style.opacity = 1;
          Array.from(uiMenu.children).forEach((child) => {
            child.style.color = child.innerText === targetRate + "x" ? "#00a1d6" : "#fff";
            child.style.fontWeight = child.innerText === targetRate + "x" ? "bold" : "normal";
          });
        }
      };
      document.addEventListener("click", () => {
        if (uiMenu.style.display === "flex") {
          uiMenu.style.display = "none";
          if (targetVideo && !targetVideo.paused) uiWrap.style.opacity = 0;
        }
      }, { capture: true });
      document.body.appendChild(uiWrap);
    };
    const scanVideos = () => {
      const list = [];
      const scan = (root) => {
        if (!root) return;
        try {
          root.querySelectorAll("video, bwp-video").forEach((v) => list.push(v));
        } catch (e) {
        }
        try {
          root.querySelectorAll("*").forEach((el) => el.shadowRoot && scan(el.shadowRoot));
        } catch (e) {
        }
      };
      scan(document);
      knownVideos = list;
    };
    const applyRate = () => {
      knownVideos.forEach((v) => {
        try {
          if (v.__vs_locked_rate__ === targetRate) return;
          try {
            delete v.playbackRate;
            delete v.defaultPlaybackRate;
          } catch (e) {
          }
          v.playbackRate = targetRate;
          v.defaultPlaybackRate = targetRate;
          if (targetRate !== 1) {
            Object.defineProperty(v, "playbackRate", { configurable: true, get: () => 1, set: () => {
            } });
          }
          v.__vs_locked_rate__ = targetRate;
        } catch (e) {
        }
      });
    };
    const setRate = (rate) => {
      const r = Math.min(16, Math.max(0.1, Number(Number(rate).toFixed(2))));
      if (isNaN(r)) return;
      if (r !== 1) lastPlaybackRate = r;
      targetRate = r;
      if (typeof GM_setValue !== "undefined") GM_setValue("vs_rate", r);
      if (uiBtn) uiBtn.innerText = `\u500D\u901F ${r}x`;
      applyRate();
      showTips(`\u500D\u901F ${r}x`);
    };
    const updateUIPosition = () => {
      if (!uiWrap || uiWrap.style.display === "none") return;
      if (!targetVideo || !targetVideo.isConnected) {
        uiWrap.style.display = "none";
        return;
      }
      const vRect = getVideoRect(targetVideo), winW = innerWidth, winH = innerHeight;
      if (vRect.width === 0 || vRect.height === 0 || vRect.bottom <= 0 || vRect.top >= winH || vRect.right <= 0 || vRect.left >= winW) {
        uiWrap.style.display = "none";
        return;
      }
      uiWrap.style.display = "flex";
      uiWrap.style.top = `${Math.max(80, Math.min(winH - 80, vRect.top + 20))}px`;
      uiWrap.style.left = `${Math.max(100, Math.min(winW - 100, vRect.left + vRect.width / 2))}px`;
    };
    const reqUpdatePos = () => {
      if (!rafId) rafId = requestAnimationFrame(() => {
        updateUIPosition();
        rafId = null;
      });
    };
    window.addEventListener("mousemove", (e) => {
      reqUpdatePos();
      if (!uiWrap || !knownVideos.length) return;
      let hovered = knownVideos.find((v) => {
        const r = getVideoRect(v);
        return r.width > 0 && r.height > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (!hovered) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el) hovered = el.closest("video") || el.closest("bwp-video");
      }
      if (hovered) {
        targetVideo = hovered;
        uiWrap.style.display = "flex";
        uiWrap.style.opacity = 1;
        reqUpdatePos();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          if (uiMenu.style.display !== "flex" && targetVideo && !targetVideo.paused) uiWrap.style.opacity = 0;
        }, 1500);
        return;
      }
      if (uiWrap.style.display === "flex") {
        const wRect = uiWrap.getBoundingClientRect();
        const inUI = e.clientX >= wRect.left && e.clientX <= wRect.right && e.clientY >= wRect.top && e.clientY <= wRect.bottom;
        if (inUI) {
          uiWrap.style.opacity = 1;
          clearTimeout(hideTimer);
          return;
        }
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          if (uiMenu.style.display !== "flex" && targetVideo && !targetVideo.paused) uiWrap.style.opacity = 0;
        }, 300);
      }
    }, { capture: true, passive: true });
    window.addEventListener("scroll", reqUpdatePos, { capture: true, passive: true });
    window.addEventListener("resize", reqUpdatePos, { capture: true, passive: true });
    setInterval(() => {
      if (!uiWrap && document.body) initUI();
      else if (uiWrap && !uiWrap.isConnected && document.body) document.body.appendChild(uiWrap);
      if (knownVideos.length === 0) scanVideos();
      applyRate();
    }, 100);
    setInterval(scanVideos, 1e3);
    setTimeout(initUI, 100);
    setTimeout(scanVideos, 500);
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      let newRate = targetRate, handled = true;
      if (e.shiftKey) {
        if (key === "c") newRate += 0.5;
        else if (key === "x") newRate -= 0.5;
        else handled = false;
      } else {
        if (key === "c") newRate += 0.1;
        else if (key === "x") newRate -= 0.1;
        else if (key === "z") newRate = targetRate === 1 ? lastPlaybackRate : 1;
        else if (key === "v") {
          e.preventDefault();
          e.stopPropagation();
          const val = prompt("\u8F93\u5165\u76EE\u6807\u500D\u901F (0.1 ~ 16):", targetRate);
          if (val !== null) setRate(Number(val));
          return;
        } else if (["1", "2", "3", "4"].includes(key)) newRate = Number(key);
        else handled = false;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        setRate(newRate);
      }
    }, { capture: true });
  })();
})();
// @license      MIT
