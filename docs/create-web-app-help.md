# 前端项目初始化帮助（给 Agent 用）

本仓库是 monorepo（Lerna + pnpm workspace + Turbo）。本文给出 3 种「从 0 初始化前端」的标准流程，目标是让 agent 能**快速、确定性**地生成项目结构并能直接 `dev/build`。

> 统一约定：新前端项目一律放在 `apps/<app-name>/`。

---

## 0. 前置检查（所有方案通用）

### 必备

- Node.js：建议 18+（或更高 LTS）
- pnpm：使用仓库已有的 `pnpm-lock.yaml`

### monorepo 工作区确认

- 本仓库工作区包含：`packages/*`、`apps/*`
- 新建项目后，在仓库根目录执行一次安装，让依赖链接到 workspace：

```bash
pnpm install
```

### 目录命名建议

- 复杂管理后台：`apps/admin-web`
- C 端/轻量站点：`apps/web`
- 前后端一体（BFF）：`apps/app`

---

## 1) 复杂项目：UmiJS + Ant Design Pro（管理后台/企业中台）

适用：多页面、多角色、复杂路由、权限控制、企业后台。

### 初始化步骤

1. 进入 `apps/` 目录创建项目：

```bash
cd apps
pnpm dlx create-umi@latest admin-web
```

2. 按交互提示选择（不同版本选项名称可能略有差异，目标一致即可）：

- Template：选择 **Ant Design Pro**（或包含 ProLayout/ProComponents 的模板）
- Language：TypeScript
- Package manager：pnpm
- Npm Registry: taobao
- Enable Prettier
3. 安装依赖并启动：

```bash
cd admin-web
pnpm install
pnpm dev
```

4. 回到仓库根目录，统一安装一次（确保 workspace 链接稳定）：

```bash
cd ../..
pnpm install
```

### 产物校验（agent 自检清单）

- `apps/admin-web/package.json` 存在且 `dev`、`build` 脚本可用
- 能跑起来：`pnpm -C apps/admin-web dev`
- 典型结构（不同模板会略变，但应类似）：
  - `src/pages` 或 `src/routes`
  - `config/config.ts`（Umi 配置）
  - `src/access.ts` / `src/app.tsx`（权限与运行时配置，若模板提供）

### monorepo 适配建议（保持简单）

- 不要把此项目改成根目录依赖安装；保持 `apps/admin-web` 自洽即可。
- 如需 Turbo 接管：确保 `apps/admin-web/package.json` 有 `build/lint/test` 脚本，根目录用 `pnpm run build` 会通过 Lerna/Turbo 执行。

---

## 2) 前后端一体：Modern.js（同仓库内含 BFF/SSR/全栈）

适用：需要「前端 + BFF 接口」一起交付；或希望 SSR/同构能力；希望工程化一体。

参考文档：
- https://modernjs.dev/guides/get-started/quick-start.html
- https://modernjs.dev/guides/advanced-features/bff/function.html
- https://modernjs.dev/guides/advanced-features/bff/extend-server.html
- https://modernjs.dev/zh/guides/advanced-features/web-server.html
- https://modernjs.dev/zh/guides/basic-features/deploy.html
- Semi Design（UI）：https://semi.design/zh-CN/start/getting-started

### 初始化步骤

1. 在 `apps/` 创建 Modern.js 项目：

```bash
cd apps
npx @modern-js/create@latest
```

2. 按交互提示选择（目标是“前后端一体”）：

- 选择 Modern.js **App**（而不是纯 Module）
- 勾选/开启 **BFF**（Backend For Frontend）能力（如有选项）
- 语言：TypeScript
- 包管理：pnpm

3. 启动开发：

```bash
cd app
pnpm install
pnpm dev
```

4.（推荐）搭配 Semi Design（React UI 组件库）

安装依赖：

```bash
pnpm add @douyinfe/semi-ui @douyinfe/semi-icons
```

在应用入口引入 Semi 的样式（任选一个入口文件，能确保全局执行即可）：

- 优先：`src/App.tsx`
- 或：`src/routes/_layout.tsx` / `src/routes/layout.tsx`
- 或：项目的 `src/index.tsx` / `src/main.tsx`

加入：

```ts
import '@douyinfe/semi-ui/dist/css/semi.min.css';
```

然后放一个最小 UI 验证（任意页面/组件中）：

```tsx
import { Button } from '@douyinfe/semi-ui';

export default function Page() {
  return <Button theme="solid">Hello Semi</Button>;
}
```

5. 回到根目录统一安装一次：

```bash
cd ../..
pnpm install
```

### 产物校验（agent 自检清单）

- `apps/app/package.json` 存在且有 `dev/build`
- 能跑起来：`pnpm -C apps/app dev`
- 工程里同时具备：
  - 前端页面/路由目录（例如 `src/routes` 或类似结构）
  - BFF API 目录（不同模板不同，但应能放“接口实现”）

### 与本仓库后端的关系建议

- Modern.js 的 BFF 只解决“面向前端的聚合接口”。
- 若已有独立后端（如 `apps/docs-admin`），建议：
  - Modern.js BFF 做聚合/鉴权/裁剪
  - 业务数据仍由独立后端提供

---

## 3) 精简 Web：Vue 3 + TypeScript + Vite + 精简 UI（推荐 Naive UI）

适用：轻量站点、活动页、小型产品 Web、需要快速迭代但仍要组件质量。

### 为什么选 Naive UI

- Vue 3 生态成熟、组件覆盖全面
- TS 友好、上手快
- 相对“重型框架”更精简

### 初始化步骤

1. 用 Vite 创建 Vue+TS 项目：

```bash
cd apps
pnpm create vite@latest web -- --template vue-ts
```

2. 安装依赖：

```bash
cd web
pnpm install
```

3. 安装  UI 根据情况安装UI库， 默认不使用：

```bash

```

4. 启动：

```bash
pnpm dev
```

5. 回到根目录统一安装一次：

```bash
cd ../..
pnpm install
```

### 最小集成（agent 实施建议）

- 在 `src/main.ts` 中创建应用并引入 Naive UI（按官方推荐方式注册/按需使用）。
- 只做最小改动：保证页面能渲染一个 Naive UI 按钮/布局组件即可验证依赖链。

### 产物校验（agent 自检清单）

- `apps/web/vite.config.ts` 存在
- `apps/web/src/main.ts`、`apps/web/src/App.vue` 存在
- 能跑起来：`pnpm -C apps/web dev`

---

## 常用命令速查（给 agent 直接用）

```bash
# 根目录装依赖（推荐每次创建新 app 后跑一次）
pnpm install

# 启动某个 app
pnpm -C apps/<app-name> dev

# 构建某个 app
pnpm -C apps/<app-name> build
```

---

## 常见坑（避免 agent 走弯路）

- 新 app 创建在 `apps/` 下后，如果根目录 `pnpm install` 没跑过，workspace 链接可能不完整。
- 如果脚手架默认用 npm/yarn，务必切换为 pnpm（否则 lockfile 与 workspace 行为不一致）。
- monorepo 下尽量不要在根目录混装依赖；依赖应归属于具体 `apps/<name>`。
