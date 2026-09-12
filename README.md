# WithYou · 与你同在

寻找同频的人。WithYou 的单屏官网：暖光海边背景、手写文字 Logo，以及 Windows、macOS、Linux 平台入口。安装包尚未发布，下载按钮暂未开放。`/prototype` 保留早期 Three.js 湖景原型。

本仓库仅包含网站；本地开发目录为 `E:/WithYou/web`，推送至 [edison7009/WithYou](https://github.com/edison7009/WithYou)。原生客户端独立开发。

## Cloudflare Pages 自动部署

在 Cloudflare 的 **Workers & Pages → 创建应用 → Pages → 连接 Git 仓库** 中选择本仓库，使用以下设置：

| 设置 | 值 |
|---|---|
| 生产分支 | `main` |
| 框架预设 | `None`（自定义构建） |
| 根目录 | 留空，使用仓库根目录 |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist/client` |
| Node.js | `.node-version` 指定的 `24.18.0` |

Cloudflare 会安装 npm 依赖；无需设置密钥、数据库或服务器。项目使用 Vinext 静态导出，发布 `dist/client`，无需 Next.js 服务端适配器。首次连接并部署后，推送到 `main` 会触发生产站点更新；本地未提交的改动不会自动上线。参见 [Cloudflare Git 集成](https://developers.cloudflare.com/pages/configuration/git-integration/) 和 [构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。

本地验证与更新：

```sh
npm ci
npm run dev
# 完成修改后
npm run check
npm run build
git add <本次修改的文件>
git commit -m "Describe the website update"
git push origin main
```

背景与 Logo 来源、完整生成提示词见 `artwork/cozy-identity-provenance.json`；Linux 图标使用用户提供的透明 PNG。以下为历史开发记录。

## 2026-09-12 本地暖光游戏风格与文字标志

用户提供 Tiny Glade 网站作为氛围参考。首页改为左侧海边环境、右侧 WithYou 手绘纯文字标志与简短主题、平台入口；移除叶形图标和玻璃控制栏。新图为原创生成的柔和 3D 风格海边空地，不使用参考游戏资产。背景 `public/images/cozy-meadow.png`，透明文字标志 `public/images/withyou-wordmark.png`；完整提示词与来源信息见 `artwork/cozy-identity-provenance.json`。平台仍未提供在线下载地址。

该版最初只在本地预览，随后经用户确认提交到 GitHub，供 Cloudflare Pages 部署。旧网页原型 `/prototype` 保留。

## 2026-09-12 单屏视觉重排

保留 WithYou 和两句主题，改为暖白标题、舒展字号及一条统一的半透明平台栏；下载未开放提示合并为一行。背景第三版改为更概括的插画色块、简化草叶与海面高光，五位年轻人采用宽松 T 恤、短款上衣、阔腿裤等现代日常穿搭。仍无真实下载地址。源图 `public/images/coastal-meadow-v3.png`，完整提示词见 `artwork/coastal-meadow-prompt-v3.txt`。

## 2026-09-12 单屏下载首页

首页仅保留横排图标＋WithYou、主题“与你同在／寻找同频的人”和 Windows／macOS／Linux 半透明平台入口。移除副标、介绍段落、故事锚点、活动列表与页脚，旧 `/prototype` 保留。尚无有效在线安装包链接，三平台使用 disabled 按钮并明确标注“即将开放”，不提供假下载。背景改用 `public/images/coastal-meadow-v2.png`，五位小人物采用不同颜色的 T 恤和夏装，三位女性，原构图保留。完整编辑提示词在 `artwork/coastal-meadow-prompt-v2.txt`。原生仍通过稳定资产名加载该版本。

## 2026-09-12 当前首页：WithYou 介绍页

`/` 现在是共用草海背景的品牌介绍页，包含首屏与草地来信、五类日常活动和真实开发状态。`/prototype` 保留下面记录的历史 Three.js 原型。首页背景为 `public/images/coastal-meadow.png`，与原生序章同一张 1672×941 原创生成插画；来源与完整提示词见 `artwork/`。未复制参考站 blume.codes 的素材、文案或实现。没有公开下载链接或真实多人数据。

本轮 `npm run check`、`npm run build` 通过；浏览器验证 1440×900／390×844 布局，故事入口和回到草地锚点。手机采用 cover 裁切，两侧部分人物可能不在画面内。当前仅介绍页，不改变原生客户端开发主线。

全屏 Three.js 黄昏湖景：透明浅水、夕阳倒影、草浪、动态树冠、体积云、五位 3D 演示人物与伙伴灯。

画面以 `../references/lake-reference.mp4` 为主要参照：开阔的低视角湖岸，写实的光照与材质搭配略带卡通感的造型，整体柔和、治愈。Tiny Glade 是辅助美术参照。风作用于水、草、树叶与云，岩石和地形保持稳定。

本版本只实现游戏画面与本地手动互动。没有 Rust 客户端、活动检测、真实在线人数、账户或社交服务。演示角色已在界面标注。

## 本地运行

需要 Node.js 22.13 或更新版本，以及支持 WebGL 2 的浏览器。

```powershell
cd E:\WithYou\web
npm ci
npm run dev
```

打开终端打印的本地地址。默认是 `http://localhost:3000/`。

## 体验方式

- 拖动画面环顾，滚轮拉近或拉远，罗盘按钮恢复初始视角。
- 下方动作栏切换看湖、阅读、躺下和伸展。伙伴灯与人物姿态分别控制。
- 点击人物名字查看演示状态。
- 右上角设置可隐藏演示同伴、控制伙伴灯或开启省电画面。
- 眼睛按钮或 `H` 隐藏界面，再按 `H` 或 `Esc` 恢复。
- 全屏按钮使用浏览器全屏功能；受限的内嵌浏览器可能不支持。

湖景标签页不可见时停止动画循环，恢复后继续。正常模式最高目标 60 FPS，省电模式为 30 FPS，并降低渲染分辨率与草密度。参考视频尺寸 1284 × 720 下，本次本机浏览器短时采样约为 60 / 30 FPS；这不代表集显、移动端或长时间运行的性能基线。画布的 `data-fps`、`data-draw-calls`、`data-triangles` 属性提供本地检查数据，帧率为两秒窗口的渲染次数统计，不是 GPU 时间测量。

## 验证与构建

```powershell
npm run check
npm run test:avatar
npm run build
npm run start
```

`check` 检查应用代码与类型。生成器附带的完整 UI 组件库存在预有 lint 报告，未为本任务修改这些组件。

`test:avatar` 验证四种姿态的变换有效、坐躺站高度关系，以及姿态不覆盖 Agent 灯状态。它不替代浏览器画面和交互验收。

`build` 生成 `dist/client/` 静态输出。Windows 下使用一个仅影响成功退出的兼容脚本，让 Vinext 的原生构建线程自然退出，避免构建结束时的 libuv 断言；非零退出和错误不会被吞掉。

## 主要文件

| 文件 | 用途 |
|---|---|
| `components/lakeside.tsx` | 画面 HUD、手动状态和交互 |
| `lib/lake/world.ts` | 湖景、灯光、水面、植被、镜头与生命周期 |
| `lib/lake/landscape.ts` | 连续岸线与湖床、立体远山、云密度体积 |
| `lib/lake/vegetation.ts` | 实例化草叶、叶片树冠、阵风与透光着色 |
| `lib/lake/water.ts` | 平面倒影、湖床颜色与深度采样、细波纹 |
| `lib/lake/avatar.ts` | 人物模型、姿态过渡与伙伴灯 |
| `lib/lake/shaders.ts` | 天空、体积云、水面折射与高光着色 |
| `lib/lake/types.ts` | 演示角色与状态类型 |
| `app/globals.css` | 悬浮界面和响应式布局 |

场景和人物为本项目通过几何与着色器构建的原型资产。水面使用 Three.js 的 `Water` 实现，图标来自 Lucide，均随 npm 依赖保留各自许可证。用户提供的湖景图片和视频只用作氛围参考，未复制到发布资源中。

WithYou 的创作缘起、真人共同在场与社交设计保留在上一级项目的策划案中。
