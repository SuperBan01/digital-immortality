# Soul Document System v2.0
###  个人意识体文件体系

---

## 文件体系总览

```
soul/
├── mindcopy.md       # 灵魂锚点：你是谁，意识体如何启动       ← 对应 SOUL.md
├── lifecontext.md    # 客观经历：发生了什么                  ↘
├── thoughtcell.md    # 主观认知：你如何看待这个世界            → 对应 MEMORY.md 静态层
├── style.md          # 表达风格：你如何说话和写作              ↗
├── memory.md         # 共创记忆：交互中自动生长的动态记忆       ← 对应 MEMORY.md 动态层
└── skill.md          # 技能包：你能做什么，你如何工作           ← 对应 SKILL.md
```

> 设计参照 Agent MD 三层体系（SOUL / MEMORY / SKILL），
> 结合意识上传第一范式，展开为六文件体系，实现更细粒度的意识结构描述。

---

## 六份文件的职责划分

| 文件 | 核心问题 | 数据性质 | 写入方式 | 更新频率 |
|------|--------|--------|--------|--------|
| **mindcopy.md** | 我是谁？如何唤醒？ | 元数据 + 人格 | 手动 | 每年 / 重大变化 |
| **lifecontext.md** | 我经历过什么？ | 客观事实 | 手动 | 持续追加 |
| **thoughtcell.md** | 我如何看待这些？ | 主观认知 | 手动 | 持续追加 |
| **style.md** | 我如何表达？ | 语言指纹 | 手动 | 每季度 |
| **memory.md** | 我记得什么？ | 动态记忆 | 手动 + 自动 | 实时增长 |
| **skill.md** | 我能做什么？ | 能力配置 | 手动 | 每半年 |

---

## 文件间的关联关系

```
                    mindcopy.md
                        │
              mind_id 绑定所有文件
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
lifecontext.md    thoughtcell.md        style.md
 客观事件层         主观认知层           表达风格层
 lc_id ◄──────────► thought_id          引用 raw_thought
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
          memory.md           skill.md
          动态记忆层           能力配置层
          linked_lc           linked_tc
          linked_tc           skill_evolution
          linked_skill ──────► callable_modules
```

**关联规则速查：**

| 来源文件 | 字段 | 指向文件 |
|--------|------|--------|
| lifecontext | `thought_id` | thoughtcell |
| thoughtcell | `lc_id` | lifecontext |
| memory | `linked_lc` | lifecontext |
| memory | `linked_tc` | thoughtcell |
| memory | `linked_skill` | skill |
| skill | `linked_tc` | thoughtcell |
| skill | `linked_lc` | lifecontext |
| style | 语料库引用 | thoughtcell `raw_thought` |

---

## 静态层 vs 动态层

```
静态层（手动维护，变化慢）          动态层（可自动增长，实时更新）
────────────────────────          ──────────────────────────
mindcopy.md  人格锚点              memory.md  交互记忆
lifecontext.md 客观档案                │
thoughtcell.md 认知提炼               ├── 手动轨道：你主动写入
style.md    表达指纹                  └── 自动轨道：对话结束后自动沉淀
skill.md    能力配置
```

**关键区别**：
- `thoughtcell` 需要你主动提炼 → 每一条都是精炼的认知原子
- `memory` 只需要你存在并与世界发生连接 → 自动累积，自然生长

---

## 与 MindCopy 文件（.mind）的关系

```
Soul Document System（六份 .md 文件）
            │
            │  上传至云己平台 upme.cool
            ↓
      MindCopy (.mind 文件)
            │
      ≤ 10MB 编码压缩
      机器直接驱动
      实时对话 / Agent 调用
```

| | Soul Document (.md) | MindCopy (.mind) |
|--|----|----|
| 可读性 | 人类可读 | 机器驱动 |
| 维护方式 | 手动编辑 | 云己平台生成 |
| 体积 | 无限制 | ≤ 10MB |
| 用途 | 长期档案 / 源码 | 实时调用 / 编译产物 |

每次更新 Soul Document 后，建议同步至云己平台重新生成 MindCopy。

---

## 快速上手：填写顺序

**第一次填写（约 3-4 小时）：**

```
Step 1  mindcopy.md    →  建立锚点，写唤醒 prompt 和人格核心
Step 2  lifecontext.md →  梳理人生经历时间线（只写客观事实）
Step 3  thoughtcell.md →  为关键经历补充主观认知，写世界观版本
Step 4  skill.md       →  诚实盘点能力，配置可调用模块
Step 5  style.md       →  多粘贴真实原文，少做风格描述
Step 6  memory.md      →  写入重要的关系记忆和情境记忆，配置自动写入规则
```

**日常维护：**

```
有新经历        →  lifecontext.md 追加 lc_id
有新洞察        →  thoughtcell.md 追加 thought_id
对话结束        →  memory.md 自动写入（或手动补充）
能力有跃迁      →  skill.md 更新 skill_evolution
风格有变化      →  style.md 更新语料样本
每季度          →  检查 memory_health，清理低置信度记忆
每年            →  审视 mindcopy.md，更新 worldview_versions
```

---

## 数据质量：三个核心指标

### 1. 反程序文本度
意识 token（真实原话）在文件中的占比。目标 > 0.80。
提升方式：粘贴真实原文，不改写，不美化。

### 2. 时间覆盖密度
生命各阶段的 thoughtcell 和 lifecontext 覆盖是否均匀。
提升方式：优先补充稀疏的人生阶段。

### 3. 记忆连通度
文件间的 id 引用是否形成网络，而不是孤立的条目。
提升方式：填写 `linked_tc` / `lc_id` / `connected_to` 字段。

---

## 隐私与备份

- 本地存储，不上传至公共平台
- 上传云己平台前了解数据处理政策
- 遵循 **3-2-1 备份原则**（3份副本，2种介质，1份离线）
- 在 `mindcopy.md` 数字永生意图中明确谁有权访问这些文件

---

```
Soul Document System v2.0
基于意识上传第一范式 · 参照 Agent MD 体系设计
Everlasting AI · https://upme.cool
```
