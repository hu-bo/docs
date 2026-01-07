# Modern.js Agent Reference

## 1. 快速上手
- Node.js 22 LTS 及以上（至少 ≥ 18.20.8）和 pnpm 9 推荐，nvm/fnm 可管理版本。
- 运行 `npx @modern-js/create@latest`，选择 `App` 模式、TypeScript、pnpm、并启用 BFF/SSR 等能力。脚手架会自动：安装依赖、初始化 git、生成 `modern.config.ts` 与 `@modern-js/app-tools` 配置。创建完成后可运行 `pnpm dev`（开发）/`pnpm build`（构建）/`pnpm serve`（本地预览）。
- 项目结构包含 `src/routes`、`modern.config.ts`、`modern-app-env.d.ts`、`package.json`、`pnpm-lock.yaml` 等，且自带 `@api` 别名。

## 2. BFF 基础用法
- 通过 `pnpm run new` 选中“Enable optional features → Enable BFF”（或在创建交互中勾选 BFF），并在 `modern.config.ts` 中添加 `bffPlugin()`。
- 在 `api/lambda` 下编写函数文件；例如 `api/lambda/hello.ts` 导出 `export const get = async () => 'Hello Modern.js';`。
- 前端直接 `import { get as hello } from '@api/hello';`，调用 `hello()` 即自动触发 HTTP `/api/hello` 请求，统一调用省去手写 fetch，支持 HTTP 方法导出（get/post/put…），动态路由参数和请求体 `RequestOption`。
- `api/lambda/[id]/item.ts` 示例说明动态参数按顺序传入，最后一个参数是带 `data/query` 的 `RequestOption`。

## 3. 扩展 BFF Server
- 在 `server/modern.server.ts` 中使用 Hono 风格的 middleware，例如 `defineServerConfig({ middlewares: [{ name: 'require-auth', handler }] })`，可以拦截 `/api` 路径并进行鉴权。
- 中间件可以在 request/respose 前后处理，示例实现 `sid` 校验，未登录返回 `c.json({ code: -1 })`。
- 同时可继续用 BFF 函数模拟登录(`/api/login`)；登录后再调用其他接口，浏览器 Network 可见拦截器效果。
- 文档还强调 BFF 和前端之间可共享 `shared` 目录的类型/工具。

## 4. 自定义 Web Server（新版）
- 需 Modern.js ≥ x.67.5；通过 `pnpm run new` 创建 `server/modern.server.ts`。
- `defineServerConfig` 接受 `middlewares`, `renderMiddlewares`, `plugins`, `onError`，其中每一项都能复用 Hono 的 `MiddlewareHandler`。
- 中间件示例：`requestTiming` 记录耗时；`renderMiddlewares` 可修改 HTML 内容；`plugins` 可注入 `monitors`、处理重定向，并通过 `useHonoContext` 在 SSR 中消费注入的数据。
- 文档解释旧版 `@modern-js/plugin-server`/`server/index.ts` 的迁移路径、Context/Next API 差异，以及 `onError` 用法。

## 5. 部署指导
- 使用 `modern deploy` 生成 `.output/`，默认监听 8080，可通过 `PORT=` 覆盖，输出可通过 `node .output/index` 预览。
- monorepo 项目需先构建依赖包（如 `pnpm --filter 'app^...' run build`），再 `modern deploy`，可以在 package.json 增加 `build:packages`/`deploy`。同理适用于 rush。
- 官方支持平台：Netlify（`netlify.toml` + `.netlify/functions` + monorepo baseDir）、Vercel（`vercel.json` + node 18.x + monorepo root dir），GitHub Pages（设置 `server.baseUrl` 与 `output.assetPrefix` 才可从 repo path 访问）。
- 还提供自建 Node.js、Koa 或 Nginx 静态托管示例：将 `.output` 复制到服务器，使用 `mime-types` 或 Nginx 配置处理静态资源、路由、`server.baseUrl` 控制浏览器路由入口。

## 6. Semi Design 快速集成
- 安装：`pnpm add @douyinfe/semi-ui @douyinfe/semi-icons`；对 React 19 则用 `@douyinfe/semi-ui-19`。
- 入口文件（如 `src/App.tsx`）引入样式 `import '@douyinfe/semi-ui/dist/css/semi.min.css';`，组件示例 `import { Button } from '@douyinfe/semi-ui'; return <Button theme="solid">Hello</Button>;`。
- Next.js 项目需在 `next.config.js` 中设置 `transpilePackages` 或使用 `@douyinfe/semi-next` 插件才能正确处理样式/按需。
- Remix 需开启 `unstable_cssSideEffectImports`，并在 `serverDependenciesToBundle` 中添加 Semi 包，页面入口通过 `cssBundleHref` 或直接引入主题 CSS。
- 还提供 UMD 直接引入方式（全局 `SemiUI`, `SemiIcons`, `SemiIllustrations`），适合无需构建的快速 demo。Semi 官网自带丰富组件/生态链接，适合后续查阅。

