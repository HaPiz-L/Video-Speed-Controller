# Video Speed Controller (极简视频倍速控制器)

> 一个极度轻量、无任何第三方 UI 框架依赖、绝对不卡死网页的视频倍速控制油猴脚本。

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/HaPiz-L)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Supported-green.svg)](https://www.tampermonkey.net/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/)

## 📖 项目简介

**Video Speed Controller** 专为长视频刷剧/学习（B站、YouTube 为主）而生，同时完美兼容抖音等短视频平台。

相较于市面上臃肿的同类插件，本项目坚持**原生、暴力、极简**的实现方式。全量打包产物不到 12KB，拒绝 UI 框架，拒绝底层原型链劫持，致力于为你提供“无感知”的极致倍速体验。

- **作者**: [HaPiz-L](https://github.com/HaPiz-L)
- **开发协作**: 本项目结合 DeepSeek AI 协作完成
- **当前版本**: `v1.0.0`

---

## ✨ 核心特性

- 🚀 **突破平台限制**：通过特殊手段完美绕过抖音（及其他类似平台）的 `playbackRate > 3` 检测，最高支持至 `16x` 疯狂加速。
- 🖱️ **无感跟随悬浮窗**：UI 自动悬浮在视频顶部居中，鼠标移入浮现，移出或播放时自动隐藏。绝不遮挡原生进度条，且完美穿透 YouTube 的复杂遮罩层。
- ⌨️ **全键盘操控**：提供极速快捷键操作，无需点击鼠标。
- 💾 **智能持久化**：自动记忆你上次设定的倍速，刷新网页无需重新调整。
- 🛡️ **绝对稳定**：彻底放弃易导致 B站/YouTube 主线程死锁的 `Proxy` 和全局原型劫持方案，采用 100ms 高频轮询修改实例属性，绝不卡死网页。
- 🕵️ **穿透 Shadow DOM**：精准扫描并控制隐藏在 Shadow DOM 中的视频元素。

---

## ⌨️ 快捷键说明

| 快捷键 | 功能说明 |
| :--- | :--- |
| `C` / `X` | 当前倍速 **+0.1x** / **-0.1x** |
| `Shift` + `C` / `X` | 当前倍速 **+0.5x** / **-0.5x** |
| `Z` | 在 **1x** 和上次设定的倍速之间来回切换 |
| `V` | 呼出自定义倍速输入框（支持 0.1 ~ 16） |
| `1` / `2` / `3` / `4` | 直接设定为 1x / 2x / 3x / 4x |

> 💡 **注**：在输入框内打字时快捷键自动失效，避免干扰你的正常网页输入。

---

## 🛠️ 安装与使用

1. 确保你的浏览器（Chrome / Edge / Firefox 等）已安装 **[Tampermonkey (篡改猴)](https://www.tampermonkey.net/)** 或 **[Violentmonkey (暴力猴)](https://violentmonkey.github.io/)** 扩展。
2. 将本仓库 `dist` 目录下的 `video-speed.user.js` 文件拖拽至浏览器窗口进行安装。
3. 打开任意包含视频的网页，将鼠标悬停在视频画面上即可看到悬浮窗，或直接使用快捷键进行操作。

---

## 💻 源码构建

如果你希望自行修改源码并编译，请按照以下步骤操作：

1. 克隆本仓库并安装依赖：
   ```bash
   git clone https://github.com/HaPiz-L/video-speed.git
   cd video-speed
   npm install
   ```
2. 修改 `src/main.js` 或 `src/header.txt`。
3. 运行构建命令（产物将输出至 `dist/video-speed.user.js`）：
   ```bash
   npm run build
   ```

---

## 📝 踩坑与架构说明（开发者必读）

本项目在早期试错中经历了大量“排雷”，并最终确立了以下铁律：

1. **拒绝全局劫持**：彻底废弃了使用 `Proxy` 劫持 `HTMLMediaElement.prototype` 的方案（会导致 B 站报 `Illegal invocation` 并死锁）。
2. **几何包围盒判定**：应对 YouTube 极其复杂的 DOM 遮挡，通过 `window` 的全局 `mousemove` 监听与 `video.getBoundingClientRect()` 坐标判定来响应用户操作，无视任何透明遮罩层。
3. **降维打击破解限制**：应对抖音强校验，直接使用 `Object.defineProperty` 劫持当前特定 `<video>` 实例的 `playbackRate`，骗过前端检测脚本，底层 C++ 解码器依然全速运行。

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。欢迎提交 Issue 或 Pull Request。