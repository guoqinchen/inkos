# InkOS 项目深度调研报告

> 生成时间：2026-03-24
> 版本：0.5.1
> 仓库：https://github.com/Narcooo/inkos

---

## 1. 项目概述

### 1.1 项目定位

**InkOS** (Interactive Novel Knowledge Operating System / 自动化小说写作 CLI AI Agent) 是一个基于多Agent协作的长篇小说自动生成系统。通过管道化的AI Agent流水线，从世界观构建、章节创作、连续性审计到智能修订，全流程自动化完成小说创作。

### 1.2 核心特性矩阵

| 特性 | 描述 | 实现状态 |
|------|------|----------|
| 多Agent管道 | 5个专业化Agent顺序协作 | ✅ 完整实现 |
| 长期记忆系统 | 7个真相文件维护世界状态 | ✅ 完整实现 |
| 33维度审计 | 跨章节连续性检查 | ✅ 完整实现 |
| AIGC检测 | AI味道模式识别 | ✅ 完整实现 |
| 反检测改写 | 绕过AI检测的改写模式 | ✅ 完整实现 |
| 多语言支持 | 中文/英文小说 | ✅ 完整实现 |
| 多模型路由 | 不同Agent使用不同模型 | ✅ 完整实现 |
| 守护进程模式 | 后台持续写作 | ✅ 完整实现 |
| 多通知渠道 | Telegram/飞书/企微/Webhook | ✅ 完整实现 |

---

## 2. 技术架构

### 2.1 技术栈

```
Runtime:       Node.js >= 20
Language:      TypeScript 5.x
Package Mgr:   pnpm >= 9
Monorepo:      pnpm workspace
LLM SDKs:      OpenAI SDK + Anthropic SDK
CLI Framework: Commander.js 13
Validation:    Zod 3.24
Serialization: js-yaml
EPUB:          epub-gen-memory
Markdown:      marked 15
Testing:       Vitest 3
```

### 2.2 包结构（Monorepo）

```
packages/
├── cli/          # CLI入口，21个命令
└── core/         # 核心业务逻辑
```

### 2.3 核心模块依赖关系

```
pipeline/runner.ts        # 管道编排器（核心入口）
    ├── agents/
    │   ├── architect.ts    # ArchitectAgent → 生成基础文件
    │   ├── writer.ts       # WriterAgent → 两阶段写作
    │   ├── continuity.ts   # ContinuityAuditor → 33维度审计
    │   ├── reviser.ts      # ReviserAgent → 自动修订
    │   └── radar.ts        # RadarAgent → 市场扫描
    ├── llm/provider.ts     # LLM统一接口
    ├── state/
    │   ├── manager.ts      # 状态管理器
    │   └── memory-db.ts    # 记忆数据库
    └── notify/
        └── dispatcher.ts   # 通知分发器
```

---

## 3. 多Agent管道详解

### 3.1 Agent职责矩阵

| Agent | 输入 | 输出 | 核心职责 |
|-------|------|------|----------|
| **Radar** | 题材趋势数据 | 热门元素报告 | 市场扫描，读者偏好分析 |
| **Architect** | BookConfig + Genre | story_bible.md, volume_outline.md, book_rules.md | 世界观、人物、设定构建 |
| **Writer** | 当前状态 + POV | chapter_draft.md | 两阶段创作：创意起草 + 状态结算 |
| **ContinuityAuditor** | 章节草稿 + 7真相文件 | audit_report.md | 33维度连续性检查 |
| **Reviser** | 审计报告 | revised_chapter.md | 问题修复 + 反AI检测 |

### 3.2 管道流程图

```
[ Radar ] → [ Architect ] → [ Writer ] → [ Auditor ] → [ Reviser ]
    ↓           ↓              ↓            ↓            ↓
 趋势数据    基础文件      章节草稿     审计报告      定稿章节
                                        ↓
                               [ 状态更新 ]
                                        ↓
                              [ 7 Truth Files ]
```

### 3.3 Writer Agent两阶段写作

**阶段1 - 创意起草（Creative Draft）**
- 根据当前状态和POV生成章节内容
- 专注于故事性和创意表达

**阶段2 - 状态结算（State Settlement）**
- 从起草中提取状态变化
- 更新人物位置、物品流转、情感弧线等
- 确保下一章节的连续性基础

---

## 4. 长期记忆系统（7 Truth Files）

### 4.1 文件清单

每个书籍项目在 `story/` 目录下维护7个真相文件：

| 文件名 | 用途 | 关键字段 |
|--------|------|----------|
| `current_state.md` | 世界状态、人物关系、情感弧线 | location, characters, relationships |
| `particle_ledger.md` | 资源/物品追踪（含衰减） | items, quantity, decay_rate |
| `pending_hooks.md` | 未解决的伏笔和承诺 | hooks, resolutions |
| `chapter_summaries.md` | 章节摘要 | characters, events, locations |
| `subplot_board.md` | 支线进度追踪 | subplots, progress |
| `emotional_arcs.md` | 人物情感弧线 | character, arc, current_state |
| `character_matrix.md` | 人物互动矩阵、信息边界 | character_a, character_b, interactions |

### 4.2 POV感知过滤

系统支持按章节视角（POV）过滤上下文，确保：
- 角色只知道他们应该知道的信息
- 避免信息泄露到不该出现的视角

**实现文件**：`packages/core/src/utils/pov-filter.ts`

### 4.3 状态快照与回滚

- 每次写章节前自动创建快照
- 支持回滚到任意历史状态
- 文件锁防止并发写入冲突

---

## 5. 33维度连续性审计

### 5.1 审计维度分类

| 类别 | 维度示例 |
|------|----------|
| **时间连续性** | 时间线一致性、季节/天气连续 |
| **空间连续性** | 位置逻辑、移动路径 |
| **人物连续性** | 性格一致性、能力边界、行为逻辑 |
| **物品连续性** | 物品流转、外观描述 |
| **事件连续性** | 因果关系、逻辑漏洞 |
| **对话连续性** | 语气一致性、称呼/代词 |
| **世界观连续性** | 规则遵守、设定一致性 |
| **情感连续性** | 情感弧线、关系变化 |
| **伏笔连续性** | 伏笔回收、承诺兑现 |

### 5.2 审计报告格式

```markdown
# 审计报告 - 第X章

## 问题列表
- [严重] 问题描述 @ 位置引用
- [警告] 问题描述 @ 位置引用

## 统计
- 总问题数：N
- 严重：M
- 警告：K
```

---

## 6. AIGC检测与反检测

### 6.1 AI味道模式识别

**实现文件**：`packages/core/src/agents/ai-tells.ts`

检测常见的AI写作特征：
- 过度规整的句式结构
- 重复的连接词使用
- 缺乏个人风格的叙述
- 过度解释性描写

### 6.2 反检测改写

```bash
inkos revise --mode anti-detect
```

通过同义词替换、句式变化、节奏调整等方式降低AI检测率。

---

## 7. CLI命令体系

### 7.1 命令分类

#### 项目初始化
| 命令 | 功能 |
|------|------|
| `inkos init` | 初始化项目 |
| `inkos config set-global` | 设置全局LLM配置 |
| `inkos config show-global` | 显示全局配置 |

#### 书籍管理
| 命令 | 功能 |
|------|------|
| `inkos book create` | 创建新书 |
| `inkos book list` | 列出所有书籍 |
| `inkos book update` | 更新书籍设置 |
| `inkos book delete` | 删除书籍 |

#### 写作管道
| 命令 | 功能 |
|------|------|
| `inkos write next` | 完整管道（起草+审计+修订） |
| `inkos write rewrite` | 重写章节（含回滚） |
| `inkos draft` | 仅起草 |
| `inkos audit` | 仅审计 |
| `inkos revise` | 仅修订 |

#### 审核与评论
| 命令 | 功能 |
|------|------|
| `inkos review list` | 列出待审草稿 |
| `inkos review approve-all` | 批量审批 |

#### 导出与导入
| 命令 | 功能 |
|------|------|
| `inkos export` | 导出txt/md/epub |
| `inkos import chapters` | 导入章节（逆向工程真相文件） |
| `inkos import canon` | 导入正典（用于同人创作） |

#### 工具命令
| 命令 | 功能 |
|------|------|
| `inkos radar scan` | 扫描平台趋势 |
| `inkos genre list/show/copy` | 题材管理 |
| `inkos style analyze` | 分析参考文本风格 |
| `inkos style import` | 导入风格到书籍 |
| `inkos analytics` | 书籍分析 |
| `inkos detect` | AIGC检测 |
| `inkos doctor` | 诊断检查 |
| `inkos agent` | 自然语言Agent模式 |
| `inkos up/down` | 守护进程启停 |

---

## 8. 内置题材配置

### 8.1 支持的题材

| 题材 | 文件 | 特点 |
|------|------|------|
| 仙侠 (Xianxia) | `genres/xianxia.md` | 修炼体系、境界设定 |
| 玄幻 (Xuanhuan) | `genres/xuanhuan.md` | 异世界、魔法体系 |
| 都市 (Urban) | `genres/urban.md` | 现代背景、职场/商战 |
| 恐怖 (Horror) | `genres/horror.md` | 悬疑、惊悚元素 |
| 其他 (Other) | `genres/other.md` | 通用的基础设定 |

### 8.2 题材配置内容

每个题材文件包含：
- 世界观规则
- 叙述风格指导
- 人物原型模板
- 典型情节结构
- Prompt片段

---

## 9. 通知系统

### 9.1 支持渠道

| 渠道 | 实现文件 | 特点 |
|------|----------|------|
| Telegram | `notify/telegram.ts` | 即时消息 |
| 飞书 (Feishu) | `notify/feishu.ts` | 企业协作 |
| 企业微信 | `notify/wechat-work.ts` | 企业微信机器人 |
| Webhook | `notify/webhook.ts` | HMAC-SHA256签名 |

### 9.2 通知触发场景

- 章节写作完成
- 审计发现问题
- 守护进程状态变化
- 错误告警

---

## 10. LLM多模型路由

### 10.1 支持的Provider

```typescript
type LLMConfig = {
  provider: "openai" | "anthropic" | "custom";
  baseUrl: string;       // 自定义API端点
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  thinkingBudget?: number;  // Anthropic扩展思考
  stream?: boolean;
  apiFormat?: "chat" | "responses";
}
```

### 10.2 Agent级模型覆盖

可在 `inkos.json` 中为不同Agent指定不同模型：

```json
{
  "models": {
    "architect": "claude-opus-4-6",
    "writer": "gpt-4o",
    "auditor": "claude-sonnet-4-6"
  }
}
```

---

## 11. 数据流架构

### 11.1 项目数据目录结构

```
my-book/
├── inkos.json              # 项目配置
├── .env                     # LLM凭证
├── story/
│   ├── current_state.md    # 当前世界状态
│   ├── particle_ledger.md  # 物品分类账
│   ├── pending_hooks.md    # 伏笔追踪
│   ├── chapter_summaries.md # 章节摘要
│   ├── subplot_board.md    # 支线进度
│   ├── emotional_arcs.md   # 情感弧线
│   ├── character_matrix.md # 人物矩阵
│   ├── story_bible.md      # 世界观圣经
│   ├── volume_outline.md   # 大纲
│   ├── book_rules.md       # 书籍规则
│   └── chapters/
│       ├── chapter_001.md
│       ├── chapter_002.md
│       └── ...
└── snapshots/              # 状态快照
```

### 11.2 核心数据模型

**BookConfig** (`models/book.ts`)
- bookId, title, genre, language
- perspective, targetLength
- platform, tags

**ChapterMeta** (`models/chapter.ts`)
- chapterId, title, status
- wordCount, pov
- createdAt, updatedAt

**CurrentState** (`models/state.ts`)
- location, time
- activeCharacters[]
- relationships{}
- emotionalArcs{}

---

## 12. 测试策略

### 12.1 测试框架

- **Vitest 3** - 单元测试
- 测试文件位置：`packages/core/src/__tests__/`

### 12.2 测试覆盖领域

| 领域 | 测试重点 |
|------|----------|
| 状态管理 | 读写、快照、回滚 |
| 上下文过滤 | POV过滤逻辑 |
| LLM Provider | 多模型调用 |
| 管道Runner | 端到端流程 |
| 审计规则 | 33维度检查 |

---

## 13. 亮点设计模式

### 13.1 Agent基类模式

```typescript
// packages/core/src/agents/base.ts
class BaseAgent {
  chat(messages: Message[]): Promise<Response>
  log(action: string, data: object): void
  streamProgress(callback: (chunk: string) => void): void
}
```

所有Agent继承BaseAgent，统一LLM调用和日志接口。

### 13.2 管道编排器模式

```typescript
// packages/core/src/pipeline/runner.ts
class PipelineRunner {
  async writeNextChapter(bookId: string, pov?: string): Promise<void>
  async runRadar(bookId: string): Promise<void>
  async auditDraft(bookId: string, chapterId: string): Promise<AuditReport>
}
```

原子操作保证管道步骤的一致性。

### 13.3 状态快照模式

每次关键操作前自动创建快照，支持：
- 操作失败时回滚
- 人工审核后退回重写
- 历史版本比对

---

## 14. 适用场景

### 14.1 最佳场景

✅ **长篇网络小说** - 仙侠、玄幻、都市等网文题材
✅ **系列书籍创作** - 多卷本，需要统一世界观
✅ **同人小说** - 基于现有IP的二次创作
✅ **批量内容生产** - 需要保持风格一致的内容农场

### 14.2 局限场景

⚠️ **纯文学创作** - AI风格难以达到文学性要求
⚠️ **高度创新题材** - 依赖现有题材模板
⚠️ **实时互动小说** - 管道模式不适合交互式创作

---

## 15. 快速入门

### 15.1 安装

```bash
npm install -g @actalk/inkos
```

### 15.2 初始化项目

```bash
inkos init
```

### 15.3 创建书籍

```bash
inkos book create --title "我的仙侠小说" --genre xianxia
```

### 15.4 配置LLM

```bash
inkos config set-global --provider anthropic --api-key YOUR_KEY
```

### 15.5 开始写作

```bash
inkos write next
```

---

## 16. 相关资源

- **GitHub**: https://github.com/Narcooo/inkos
- **npm**: https://www.npmjs.com/package/@actalk/inkos
- **文档**: 见项目README.md（中英双语）

---

*本报告由 Claude Code 自动生成，基于代码库深度探索*
