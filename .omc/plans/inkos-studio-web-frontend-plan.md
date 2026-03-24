# InkOS Web 前端开发计划

> **计划版本**: v1.0
> **生成日期**: 2026-03-24
> **项目**: InkOS Studio Web Frontend
> **状态**: 待评审

---

## 目录

1. [需求摘要](#1-需求摘要)
2. [RALPLAN-DR 决策摘要](#2-ralplan-dr-决策摘要)
3. [架构设计](#3-架构设计)
4. [模块边界](#4-模块边界)
5. [IPC 契约定义](#5-ipc-契约定义)
6. [实现步骤](#6-实现步骤)
7. [风险与缓解](#7-风险与缓解)
8. [技术选型详情](#8-技术选型详情)
9. [验收标准](#9-验收标准)
10. [ADR - 架构决策记录](#10-adr---架构决策记录)

---

## 1. 需求摘要

### 1.1 项目目标

为 InkOS CLI 工具开发完整的 Web 前端（Electron 桌面应用），实现创作仪表盘、实时写作工作室、监控控制台等全功能。

### 1.2 用户约束

| 约束项 | 选择 |
|--------|------|
| 使用场景 | 全功能 Web 化 - 完整 CLI 功能的 Web 化 |
| 技术栈 | React + Vite + 独立 CSS（不用 Tailwind） |
| 后端交互 | 混合方案（HTTP 管理 + WebSocket 实时写作流） |
| 部署模式 | Electron App（本地优先，可离线使用） |

### 1.3 核心功能范围

| 模块 | 功能 |
|------|------|
| **WritingStudio** | 实时流式输出、章节列表、真相文件面板、Markdown 渲染 |
| **Dashboard** | 书籍管理、章节管理、创建/删除/列表 |
| **Monitor** | 守护进程状态、任务队列、调度器状态 |
| **Settings** | LLM 配置、模型路由、通知渠道 |
| **Analytics** | 统计数据、审计历史、Token 使用统计 |

---

## 2. RALPLAN-DR 决策摘要

### 2.1 核心原则（Principles）

1. **本地优先（Local-First）** - 所有数据存储在用户本地文件系统，不强制云端依赖
2. **核心复用（Core Reuse）** - 复用 `@actalk/inkos-core` 包，不重写已有业务逻辑
3. **安全边界（Secure Boundary）** - Electron 主/渲染进程严格分离，核心包仅在主进程运行
4. **实时反馈（Real-Time Feedback）** - 写作流式输出对用户可见，最小延迟
5. **增量演进（Incremental Evolution）** - 从核心功能逐步扩展到完整功能集

### 2.2 决策驱动因素（Decision Drivers）

| 优先级 | 驱动因素 | 说明 |
|--------|----------|------|
| D1 | **CLI 功能完整性** | Web 前端必须覆盖 CLI 的所有核心命令 |
| D2 | **流式输出体验** | 写作过程中实时显示输出，无明显延迟 |
| D3 | **多窗口同步** | 支持多窗口编辑同一项目，真相文件实时同步 |
| D4 | **离线可用性** | 无网络时仍可正常写作，数据不丢失 |
| D5 | **可维护性** | 团队可长期维护，代码结构清晰 |

### 2.3 可行方案（Viable Options）

#### 方案 A：Electron 嵌入 Core 包（推荐）

```
渲染进程 (React) ← IPC (contextBridge) ← 主进程 (Electron + @actalk/inkos-core)
```

**优点**：
- 零网络开销，单一二进制
- 复用现有 PipelineRunner、StateManager 等核心组件
- 简单部署，无端口冲突
- 支持 electron-builder 打包

**缺点**：
- 与 Electron 强耦合，未来扩展到 Web/移动端需重构
- 主进程崩溃影响渲染进程
- 多用户场景扩展困难

#### 方案 B：独立 Hono HTTP 服务

```
渲染进程 (React) ← HTTP ← 主进程 (Hono Server) ← @actalk/inkos-core
```

**优点**：
- 分离更清晰，支持未来移动端 companion app
- 熟悉的 HTTP/WebSocket 协议栈
- 主进程崩溃不影响服务

**缺点**：
- 端口管理复杂（4567 端口冲突问题）
- 进程间通信开销
- 打包和分发更复杂

### 2.4 方案选择

**选择：方案 A - Electron 嵌入 Core 包**

**理由**：
- 用户明确选择 Electron App，本地优先场景下嵌入更简单
- 未来可从嵌入平滑迁移到独立服务（IPC 契约保持一致）
- `inkos studio` 命令已存在但未实现，本计划是其完整实现

**失效理由（方案 B 备选）**：
- 方案 B 的"扩展性"在当前需求中无实际价值（本地单用户场景）
- 端口冲突和进程管理带来不必要复杂度

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                          │
│                                                          │
│  ┌──────────────┐         ┌─────────────────────────┐  │
│  │   Renderer   │         │        Main Process      │  │
│  │   Process    │◄──IPC──►│                         │  │
│  │   (React)    │ context │  @actalk/inkos-core     │  │
│  │              │ Bridge  │  ├── PipelineRunner      │  │
│  │  Zustand     │         │  ├── StateManager       │  │
│  │  React       │         │  ├── Scheduler          │  │
│  │  Router      │         │  └── LLM Provider       │  │
│  │              │         │                         │  │
│  │              │◄──WS────│  ws-server (多窗口同步)  │  │
│  └──────────────┘         └─────────────────────────┘  │
│                                        │                │
│                                        ▼                │
│                               ┌─────────────────┐       │
│                               │  Local Filesystem │       │
│                               │  books/{bookId}/ │       │
│                               │  story/*.md      │       │
│                               └─────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 核心技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| IPC 方式 | `contextBridge` + `ipcRenderer.invoke()` | 类型安全、异步、符合 Electron 最佳实践 |
| 状态管理 | Zustand | 轻量、TypeScript 原生、流式更新支持好 |
| 路由 | React Router v6 | React 生态标准 |
| Markdown | marked + highlight.js | `@actalk/inkos-core` 已有依赖 |
| UI 组件 | Radix UI + 自定义 CSS | 无样式、Accessible、自定义设计系统 |
| 打包 | electron-builder | macOS .dmg / Windows .exe / 自动更新 |

### 3.3 流式输出架构（关键）

**问题**：`createStreamMonitor()` 每 30 秒触发一次，不满足实时 UX 需求。

**解决方案**：新增 `onChunk` 回调路径

```
PipelineConfig.onChunk?: (text: string) => void
         │
         ▼
PipelineRunner.runWriteChapter()
         │
         ▼
agentCtxFor() 携带 onChunk
         │
         ▼
BaseAgent.chat() → LLM Provider 流式输出
         │
         ▼
onChunk(text) → IPC 'stream:chunk' → Renderer Zustand Store
         │
         ▼
StreamDisplay 组件实时渲染
```

**并发冲突处理**：每个 PipelineRunner 实例化独立的 monitor，避免共享状态冲突。

### 3.4 项目根目录解析

**问题**：Electron 主进程 `process.cwd()` 返回应用二进制位置，非用户项目目录。

**解决方案**：
1. 应用启动时，渲染进程调用 `dialog.showOpenDialog` 让用户选择项目目录
2. 通过 IPC `init:project-root` 发送到主进程
3. 主进程存储并在所有 PipelineRunner 实例化时使用

```
Renderer: dialog.showOpenDialog() → 用户选择 ~/my-novel-project
    ↓ ipcRenderer.invoke('init:project-root', path)
Main: store.projectRoot = path
    ↓
PipelineRunner(config, projectRoot)
    ↓
StateManager(projectRoot) → 所有文件系统操作
```

---

## 4. 模块边界

### 4.1 包结构

```
packages/studio/
├── src/
│   ├── main/                          # Electron 主进程
│   │   ├── index.ts                   # app 生命周期、窗口管理
│   │   ├── ipc/                       # IPC 处理器
│   │   │   ├── pipeline.ts            # write-draft, audit, revise, pipeline
│   │   │   ├── state.ts               # StateManager 包装（list-books, get-status）
│   │   │   ├── config.ts              # LLM 配置读写
│   │   │   └── init.ts                # 项目目录初始化
│   │   ├── preload.ts                 # contextBridge API 暴露
│   │   └── ws-server.ts               # WebSocket（多窗口同步）
│   │
│   ├── renderer/                      # React + Vite 渲染进程
│   │   ├── App.tsx                    # React Router v6 根
│   │   ├── main.tsx                   # Vite 入口
│   │   ├── index.css                  # 全局样式
│   │   │
│   │   ├── modules/                   # 功能模块
│   │   │   ├── studio/                # 写作工作室
│   │   │   │   ├── WritingView.tsx
│   │   │   │   ├── StreamDisplay.tsx
│   │   │   │   ├── ChapterCard.tsx
│   │   │   │   ├── TruthFilePanel.tsx
│   │   │   │   └── store.ts
│   │   │   │
│   │   │   ├── dashboard/              # 仪表盘
│   │   │   │   ├── BookList.tsx
│   │   │   │   ├── BookCreate.tsx
│   │   │   │   ├── BookDetail.tsx
│   │   │   │   ├── ChapterManager.tsx
│   │   │   │   └── store.ts
│   │   │   │
│   │   │   ├── monitor/                # 守护进程监控
│   │   │   │   ├── DaemonPanel.tsx
│   │   │   │   ├── SchedulerStatus.tsx
│   │   │   │   ├── TaskQueue.tsx
│   │   │   │   └── store.ts
│   │   │   │
│   │   │   ├── settings/               # 配置管理
│   │   │   │   ├── LLMConfig.tsx
│   │   │   │   ├── ModelRouter.tsx
│   │   │   │   ├── NotificationChannels.tsx
│   │   │   │   └── store.ts
│   │   │   │
│   │   │   └── analytics/              # 数据分析
│   │   │       ├── StatsPanel.tsx
│   │   │       ├── AuditHistory.tsx
│   │   │       ├── TokenUsage.tsx
│   │   │       └── store.ts
│   │   │
│   │   ├── components/                 # 共享组件
│   │   │   ├── ui/                    # Radix 基础组件 + CSS
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Dialog.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── ScrollArea.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Tooltip.tsx
│   │   │   │   ├── DropdownMenu.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── ChapterPreview.tsx
│   │   │   ├── TruthFileEditor.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── hooks/                     # 业务 Hooks
│   │   │   ├── useStream.ts           # 流式输出订阅
│   │   │   ├── useBook.ts             # 书籍操作
│   │   │   ├── useChapter.ts          # 章节操作
│   │   │   ├── useTruthFiles.ts       # 真相文件订阅
│   │   │   ├── useDaemon.ts           # 守护进程状态
│   │   │   └── useConfig.ts           # 配置管理
│   │   │
│   │   └── lib/                       # 工具库
│   │       ├── api.ts                 # ipcRenderer 封装（类型安全）
│   │       ├── ws.ts                  # WebSocket 客户端
│   │       └── constants.ts            # IPC 通道名常量
│   │
│   └── shared/                        # 主/渲染进程共享
│       └── types.ts                   # IPC 类型、API 契约
│
├── resources/                         # 应用资源
│   └── icon.png
│
├── electron-builder.yml               # 打包配置
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── index.html
```

### 4.2 路由定义

| 路径 | 组件 | 功能 |
|------|------|------|
| `/` | Dashboard | 书籍列表首页 |
| `/:bookId` | BookDetail | 书籍详情 + 章节列表 |
| `/:bookId/studio` | WritingView | 写作工作室 |
| `/:bookId/chapter/:chapterId` | ChapterView | 章节查看/编辑 |
| `/monitor` | DaemonPanel | 守护进程监控 |
| `/settings` | LLMConfig | 全局配置 |
| `/analytics` | StatsPanel | 数据分析 |

---

## 5. IPC 契约定义

### 5.1 IPC 通道映射

| 通道名 | 方向 | 类型 | 说明 |
|--------|------|------|------|
| `init:project-root` | R→M | invoke | 初始化项目目录 |
| `pipeline:write` | R→M | invoke | 写作（流式） |
| `pipeline:audit` | R→M | invoke | 审计章节 |
| `pipeline:revise` | R→M | invoke | 修订章节 |
| `pipeline:cancel` | R→M | invoke | 取消当前操作 |
| `stream:progress` | M→R | send | 写作进度（每 30s） |
| `stream:chunk` | M→R | send | 写作内容块（实时） |
| `stream:complete` | M→R | send | 写作完成 |
| `stream:error` | M→R | send | 写作错误 |
| `book:list` | R→M | invoke | 列出书籍 |
| `book:create` | R→M | invoke | 创建书籍 |
| `book:get` | R→M | invoke | 获取书籍详情 |
| `book:delete` | R→M | invoke | 删除书籍 |
| `chapter:list` | R→M | invoke | 列出章节 |
| `chapter:get` | R→M | invoke | 获取章节内容 |
| `chapter:approve` | R→M | invoke | 审批章节 |
| `truth:list` | R→M | invoke | 列出真相文件 |
| `truth:get` | R→M | invoke | 读取真相文件 |
| `truth:update` | R→M | invoke | 更新真相文件 |
| `config:get` | R→M | invoke | 获取配置 |
| `config:set` | R→M | invoke | 设置配置 |
| `daemon:status` | R→M | invoke | 守护进程状态 |
| `daemon:up` | R→M | invoke | 启动守护进程 |
| `daemon:down` | R→M | invoke | 停止守护进程 |
| `analytics:get` | R→M | invoke | 获取统计数据 |
| `ws:connect` | R→M | invoke | 建立 WebSocket 连接 |

> R = Renderer, M = Main, send = 主动推送, invoke = 请求-响应

### 5.2 类型定义（shared/types.ts）

```typescript
// ============ 核心类型 ============

export interface BookSummary {
  bookId: string;
  title: string;
  genre: string;
  language: string;
  chapterCount: number;
  totalWords: number;
  status: 'idle' | 'writing' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface ChapterMeta {
  chapterId: string;
  bookId: string;
  title: string;
  status: 'draft' | 'auditing' | 'approved' | 'rejected';
  wordCount: number;
  pov?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterContent extends ChapterMeta {
  content: string; // Markdown
}

// ============ Pipeline 类型 ============

export interface WriteOptions {
  bookId: string;
  guidance?: string;
  pov?: string;
  wordCount?: number;
}

export interface WriteProgress {
  elapsedMs: number;
  totalChars: number;
  chineseChars: number;
  status: 'writing' | 'settling' | 'complete' | 'error';
}

export interface WriteResult {
  chapterId: string;
  title: string;
  wordCount: number;
  auditReport?: AuditReport;
}

export interface AuditOptions {
  bookId: string;
  chapterId: string;
}

export interface AuditReport {
  chapterId: string;
  issues: AuditIssue[];
  totalIssues: number;
  severeIssues: number;
  warningIssues: number;
}

export interface AuditIssue {
  severity: 'severe' | 'warning' | 'info';
  dimension: string;
  description: string;
  location?: string;
}

export interface ReviseOptions {
  bookId: string;
  chapterId: string;
  mode: 'polish' | 'spot-fix' | 'rewrite' | 'rework' | 'anti-detect';
}

// ============ 真相文件类型 ============

export interface TruthFile {
  name: string;
  path: string;
  content: string;
  updatedAt: string;
}

export interface TruthFiles {
  currentState: TruthFile;
  particleLedger: TruthFile;
  pendingHooks: TruthFile;
  chapterSummaries: TruthFile;
  subplotBoard: TruthFile;
  emotionalArcs: TruthFile;
  characterMatrix: TruthFile;
}

// ============ 配置类型 ============

export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  baseUrl: string;
  apiKey: string;
}

export interface AgentModelConfig {
  architect?: string;
  writer?: string;
  auditor?: string;
  reviser?: string;
  radar?: string;
}

export interface GlobalConfig {
  llm: LLMProviderConfig;
  models: AgentModelConfig;
  notifications: {
    telegram?: { token?: string; chatId?: string };
    feishu?: { webhook?: string };
    wechatWork?: { webhook?: string };
  };
}

// ============ 守护进程类型 ============

export interface DaemonStatus {
  running: boolean;
  uptimeMs: number;
  activeBooks: string[];
  queuedTasks: number;
  memoryMb: number;
}

// ============ 统计类型 ============

export interface AnalyticsData {
  bookId: string;
  totalChapters: number;
  totalWords: number;
  avgWordsPerChapter: number;
  auditPassRate: number;
  topIssueCategories: { category: string; count: number }[];
  tokenUsage?: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    avgTokensPerChapter: number;
  };
}

// ============ IPC 请求/响应 ============

// Pipeline
export interface WriteRequest {
  bookId: string;
  guidance?: string;
  pov?: string;
  wordCount?: number;
}

export interface WriteResponse {
  chapterId: string;
  title: string;
  wordCount: number;
}

export interface AuditRequest {
  bookId: string;
  chapterId: string;
}

export interface AuditResponse {
  chapterId: string;
  issues: AuditIssue[];
  totalIssues: number;
  severeIssues: number;
  warningIssues: number;
}

export interface ReviseRequest {
  bookId: string;
  chapterId: string;
  mode: 'polish' | 'spot-fix' | 'rewrite' | 'rework' | 'anti-detect';
}

export interface ReviseResponse {
  chapterId: string;
  success: boolean;
  newWordCount?: number;
}

// Book
export interface CreateBookRequest {
  title: string;
  genre: string;
  language?: string;
  wordCount?: number;
}

export interface CreateBookResponse {
  bookId: string;
}

// Error
export interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}
```

### 5.3 WebSocket 消息协议（多窗口同步）

```typescript
// ws-server.ts 消息类型

type WSMessageType =
  | 'chapter-update'      // 章节内容更新
  | 'truth-file-change'  // 真相文件变更
  | 'pipeline-status'     // 管道状态变化
  | 'daemon-event'        // 守护进程事件
  | 'window-sync-request' // 窗口同步请求
  | 'window-sync-response'; // 窗口同步响应

interface WSMessage<T = unknown> {
  type: WSMessageType;
  bookId?: string;
  timestamp: number;
  payload: T;
}

// 窗口同步流程
// 1. 新窗口连接 → 发送 window-sync-request { bookId }
// 2. ws-server 回复 window-sync-response { chapters, truthFiles, status }
// 3. 窗口初始化 → 后续接收增量更新
```

---

## 6. 实现步骤

### Phase 1: 项目脚手架

| 步骤 | 任务 | 依赖 | 验收标准 |
|------|------|------|----------|
| 1.1 | 初始化 `packages/studio` 目录结构 | - | 目录创建完成 |
| 1.2 | 配置 Vite + React + TypeScript | 1.1 | `npm run dev` 正常启动 |
| 1.3 | 配置 Electron 主进程 | 1.1 | Electron 窗口显示 |
| 1.4 | 配置 electron-builder | 1.3 | 打包成功生成 .app |
| 1.5 | 配置 Preload 脚本 | 1.3 | contextBridge API 可调用 |
| 1.6 | 配置 Zustand | 1.2 | Store 正常工作 |
| 1.7 | 配置 React Router | 1.2 | 路由跳转正常 |
| 1.8 | 配置 Radix UI 组件 | 1.2 | 基础组件可用 |
| 1.9 | 创建 shared/types.ts | - | 类型定义完整 |

### Phase 2: 核心 IPC

| 步骤 | 任务 | 依赖 | 验收标准 |
|------|------|------|----------|
| 2.1 | 实现项目目录初始化 IPC | 1.5, 1.9 | 用户可选项目目录 |
| 2.2 | 实现 book:list/create/get/delete IPC | 1.5, 1.9 | 书籍 CRUD 正常 |
| 2.3 | 实现 chapter:list/get/approve IPC | 1.5, 1.9 | 章节操作正常 |
| 2.4 | 实现 truth:list/get/update IPC | 1.5, 1.9 | 真相文件读写正常 |
| 2.5 | 实现 config:get/set IPC | 1.5, 1.9 | 配置读写正常 |
| 2.6 | 实现 analytics:get IPC | 1.5, 1.9 | 统计数据正常 |
| 2.7 | 实现 daemon:status/up/down IPC | 1.5, 1.9 | 守护进程控制正常 |

### Phase 3: 流式写作

| 步骤 | 任务 | 依赖 | 验收标准 |
|------|------|------|----------|
| 3.1 | 在 core 包添加 `onChunk` 回调 | - | PipelineConfig 支持 onChunk |
| 3.2 | 实现 pipeline:write IPC | 2.1, 3.1 | 写作命令正常 |
| 3.3 | 实现 stream:chunk 推送 | 3.2 | 实时显示输出字符 |
| 3.4 | 实现 stream:progress 推送 | 3.2 | 进度条正常更新 |
| 3.5 | 实现 pipeline:cancel IPC | 3.2 | 可取消写作 |
| 3.6 | 实现 pipeline:audit IPC | 2.3 | 审计命令正常 |
| 3.7 | 实现 pipeline:revise IPC | 2.3 | 修订命令正常 |
| 3.8 | 实现 useStream Hook | 3.3 | React 组件可订阅流 |
| 3.9 | 实现 StreamDisplay 组件 | 3.4, 3.8 | Markdown 实时渲染 |

### Phase 4: 多窗口同步

| 步骤 | 任务 | 依赖 | 验收标准 |
|------|------|------|----------|
| 4.1 | 实现 ws-server.ts | 1.3 | WebSocket 服务正常 |
| 4.2 | 实现 ws:connect IPC | 4.1 | 窗口可建立连接 |
| 4.3 | 实现 ws-client.ts | 1.2 | 渲染进程 WebSocket 客户端 |
| 4.4 | 实现窗口同步协议 | 4.2, 4.3 | 新窗口收到当前状态 |
| 4.5 | 实现真相文件变更广播 | 4.1 | 多窗口同步更新 |

### Phase 5: 功能模块

| 步骤 | 任务 | 依赖 | 验收标准 |
|------|------|------|----------|
| 5.1 | 实现 Dashboard 模块 | 2.2, 2.3 | 书籍列表页正常 |
| 5.2 | 实现 WritingStudio 模块 | 3.9, 4.4 | 写作页面完整 |
| 5.3 | 实现 Monitor 模块 | 2.7, 4.1 | 监控页面正常 |
| 5.4 | 实现 Settings 模块 | 2.5 | 配置页面正常 |
| 5.5 | 实现 Analytics 模块 | 2.6 | 分析页面正常 |
| 5.6 | 实现全局导航 | 5.1-5.5 | 导航正常 |

### Phase 6: 打磨与发布

| 步骤 | 任务 | 依赖 | 验收标准 |
|------|------|------|----------|
| 6.1 | 配置 electron-store | 1.3 | 窗口状态持久化 |
| 6.2 | 配置 electron-updater | 6.1 | 自动更新正常 |
| 6.3 | 实现错误处理和 Toast | 1.8 | 错误提示正常 |
| 6.4 | 实现文件锁冲突 UI | 2.2 | 友好错误提示 |
| 6.5 | 构建正式版 .dmg | 6.4 | 可分发应用 |
| 6.6 | 测试验证 | 6.5 | E2E 测试通过 |

---

## 7. 风险与缓解

### 7.1 高风险

| 风险 | 影响 | 概率 | 缓解方案 |
|------|------|------|----------|
| **流式输出延迟** | UI 体验差 | 高 | 新增 `onChunk` 回调穿透整个调用链，每 100-200ms 推送一次 |
| **Node.js/浏览器边界** | 渲染进程崩溃 | 高 | 所有 core 包调用在主进程，渲染进程只通过 IPC 通信 |
| **项目目录未解析** | 无法运行 | 高 | 启动时强制选择项目目录，通过 IPC 传递并存储 |
| **真相文件并发写入** | 数据损坏 | 中 | StateManager 文件锁 + chokidar 防抖 500ms |

### 7.2 中风险

| 风险 | 影响 | 概率 | 缓解方案 |
|------|------|------|----------|
| **WebSocket 端口冲突** | 多实例无法运行 | 低 | 使用空闲端口自动检测，不固定 4567 |
| **多窗口状态分歧** | 数据不一致 | 中 | WebSocket 窗口同步协议，新窗口获取完整快照 |
| **大章节渲染性能** | UI 卡顿 | 中 | 虚拟化渲染 + 增量更新 |
| **API Key 安全** | 凭证泄露 | 中 | 凭证存主进程内存，不持久化到磁盘 |

### 7.3 低风险

| 风险 | 影响 | 概率 | 缓解方案 |
|------|------|------|----------|
| **electron-builder 签名** | macOS 无法安装 | 低 | 配置签名证书（可选） |
| **依赖升级破坏** | 构建失败 | 低 | 锁定核心依赖版本 |

---

## 8. 技术选型详情

### 8.1 依赖清单

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "zustand": "^5.0.0",
    "marked": "^15.0.0",
    "highlight.js": "^11.10.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "chokidar": "^4.0.0",
    "ws": "^8.18.0",
    "electron-store": "^10.0.0"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/ws": "^8.5.0",
    "@electron/rebuild": "^3.7.0"
  }
}
```

### 8.2 为什么不选其他方案

| 备选 | 放弃原因 |
|------|----------|
| Tailwind CSS | 用户明确要求不用 Tailwind |
| Redux Toolkit | Zustand 更轻量，API 更简洁 |
| Material UI / Ant Design | 设计风格不符合创意写作工具定位 |
| SSE 替代 WebSocket | 同进程内 IPC 足够，WebSocket 仅用于多窗口同步 |
| SQLite 替代 Markdown | 迁移成本高，破坏 LLM 直接文件访问模式 |
| electron-forge | electron-builder 更适合生产发布 |

---

## 9. 验收标准

### 9.1 功能验收

| ID | 功能 | 验收条件 |
|----|------|----------|
| F1 | 项目初始化 | 用户可选择 InkOS 项目目录，目录中 `inkos.json` 存在 |
| F2 | 书籍列表 | Dashboard 显示所有书籍，显示标题、题材、章节数 |
| F3 | 创建书籍 | 填写表单可创建新书，生成 `inkos.json` 新条目 |
| F4 | 写作工作室 | 进入工作室显示书籍信息、章节列表 |
| F5 | 流式写作 | 点击"写下一章"，文字实时出现在屏幕上，无明显延迟 |
| F6 | 章节审批 | 章节列表显示状态，可一键审批 |
| F7 | 真相文件查看 | 侧边栏显示 7 个真相文件，可展开查看 |
| F8 | 守护进程监控 | Monitor 页面显示运行状态、活跃书籍、任务队列 |
| F9 | LLM 配置 | 可修改 provider、apiKey、model |
| F10 | 统计数据 | Analytics 显示章节数、字数、审计通过率 |
| F11 | 多窗口同步 | 两个窗口打开同一本书，真相文件变更同步 |
| F12 | Electron 打包 | 生成可分发的 .dmg 文件，可独立运行 |

### 9.2 非功能验收

| ID | 指标 | 验收条件 |
|----|------|----------|
| NF1 | 启动时间 | 应用启动到首页显示 < 3 秒 |
| NF2 | 流式延迟 | 字符显示延迟 < 500ms |
| NF3 | 内存占用 | 空闲状态 < 200MB |
| NF4 | 构建成功率 | `pnpm build` 成功率 = 100% |
| NF5 | 类型安全 | `tsc --noEmit` 无错误 |

---

## 10. ADR - 架构决策记录

### ADR-001: 整体架构决策

**决策**：采用 Electron 嵌入 Core 包的架构

**驱动因素**：
- D1: CLI 功能完整性 - 复用核心包保证功能一致
- D4: 离线可用性 - 本地文件系统即持久层

**考虑过的替代方案**：
- 独立 Hono HTTP 服务 - 增加复杂度，当前场景无收益
- 纯 Web 版本 - 用户明确要求 Electron App

**为什么选择这个**：
- 最小复杂度实现本地优先
- IPC 契约可平滑迁移到未来 HTTP 服务

**后果**：
- 正面：单一二进制、零网络开销、简单部署
- 负面：与 Electron 强耦合、多用户场景需重构

---

### ADR-002: 状态管理决策

**决策**：使用 Zustand 作为状态管理方案

**驱动因素**：
- 轻量级、最小样板代码
- 原生 TypeScript 支持
- `subscribeWithSelector` 适合流式更新

**考虑过的替代方案**：
- Redux Toolkit - 5 倍样板代码，单用户场景无收益
- Jotai - 原子模型对真相文件编辑友好，但流式更新 ergonomics 较差

**为什么选择这个**：
- API 简洁，学习成本低
- 与流式更新模式天然契合

**后果**：
- 正面：快速开发、类型安全
- 负面：无内置持久化（需额外配置 electron-store）

---

### ADR-003: 流式输出决策

**决策**：新增 `onChunk` 回调穿透整个 Agent 调用链

**驱动因素**：
- D2: 流式输出体验 - 30 秒聚合间隔不可接受
- D3: 实时反馈 - 用户期望看到文字即时出现

**考虑过的替代方案**：
- 减小 `createStreamMonitor` 间隔 - 仅减少到 500ms，仍是聚合、且有并发冲突 bug
- 轮询结果文件 - 增加文件系统 IO，无法实时

**为什么选择这个**：
- 从源头解决延迟问题
- 不破坏现有 API 兼容性（新增回调而非修改）

**后果**：
- 正面：实时字符级更新
- 负面：需要修改 core 包公共接口

**待办**：
- 在 `@actalk/inkos-core` 添加 `onChunk` 到 `PipelineConfig`
- 确保并发场景下 monitor 实例隔离

---

### ADR-004: 多窗口同步决策

**决策**：使用 WebSocket 实现多窗口同步

**驱动因素**：
- D3: 多窗口同步 - 支持同一项目多窗口编辑
- 真相文件实时更新广播

**考虑过的替代方案**：
- IPC 广播 - 仅限同进程多窗口，Electron 子窗口走不同进程
- localStorage 事件 - 跨窗口通信不稳定

**为什么选择这个**：
- 标准协议，跨窗口通信成熟方案
- 可扩展到未来移动端 companion app

**后果**：
- 正面：支持多窗口、未来可扩展
- 负面：需要 WebSocket 协议定义

---

## 附录 A: 参考文件

| 文件路径 | 说明 |
|----------|------|
| `packages/core/src/pipeline/runner.ts` | PipelineRunner 主类，所有管道方法 |
| `packages/core/src/llm/provider.ts` | LLM Provider，流式监控实现 |
| `packages/core/src/state/manager.ts` | StateManager，文件锁实现 |
| `packages/cli/src/commands/studio.ts` | 现有的 studio stub |
| `packages/cli/src/utils.ts` | CLI 配置构建逻辑 |
| `packages/core/src/index.ts` | Core 包公共导出 |
| `packages/core/src/pipeline/scheduler.ts` | Scheduler API |

---

*本计划由 Claude Code 基于 /oh-my-claudecode:plan 生成*
