# Copilot Instructions (app-nodejs monorepo)

## 项目结构
- 这是一个 Node.js/TypeScript **monorepo**：`apps/*` + `packages/*`
- 使用 **pnpm workspace**（见 `pnpm-workspace.yaml`）+ **lerna**（见 `lerna.json`）+ **turbo**（见 `turbo.json`）

## 包管理与安装（强约束）
- 只使用 **pnpm**（优先通过 `corepack`），不要改用 `npm` / `yarn`
- 除非明确需要，否则不要改 `pnpm-lock.yaml`
- 新增依赖前先确认：优先复用已有依赖与工具链

## 常用命令（优先级从高到低）
- 工作区安装：`pnpm -w install`
- 工作区脚本（根 `package.json` 定义）：`pnpm -w lint | build | test`
- 按应用/包过滤执行：
  - `pnpm -w --filter <name> <script>`
  - 或按仓库现有习惯：`lerna run <script> --scope <name>`

## 代码与风格
- 保持改动“手术式”：只改实现目标所需的最小范围；不要顺手重构/改格式/改命名
- TypeScript：
  - 尽量避免 `any`；必要时写清楚类型边界
  - 保持现有的 ESM import/export 风格与路径别名用法
- Lint/format：
  - 遵循各应用/包自己的配置（有的用 eslint，有的用 biome）
  - 不要引入新的格式化工具或规则；不要大范围 reformat

## 测试与验证
- 改了逻辑就尽量跑对应 package 的 `test/lint/build`（如果该 package 有脚本）
- 仓库没有测试的地方不要强行补齐整套测试框架；只在已有测试体系内补最小测试

## CI / 部署相关（Drone）
- 仓库有 Drone pipeline（例如 `apps/*/.drone.yml`）
- 修改 CI shell 命令时：
  - 假设运行环境可能是 Alpine（`/bin/sh`），避免 bash-only 语法
  - 小心路径与 `tar`/`cd` 的相对路径问题
  - 不要输出或记录任何 secret；secret 必须来自 `from_secret`

## 安全与敏感信息
- 永远不要把 token/密码/密钥写进仓库文件、日志或示例里
- 如果需要示例，使用占位符并提示通过 CI secret 或环境变量注入
