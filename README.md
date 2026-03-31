# Zotero Agent Copilot

[English](README.en.md)

做研究的人大概都有过这种感觉：灵感涌现的时候，找不到一个稳定的地方把它们安放下来。读了很多，也问了 AI 很多，但那些对话散落在各处，下次想接着做，得重新把材料捡回来。

这个 Zotero 8 插件想做的，就是给每篇文献一个固定的落脚点——一个本地的 workspace，把转好的文献 Markdown、整理的笔记、Agent 跑出来的内容都放在里面。你从这里启动 Claude Code 或 Codex，做完的东西留在原地，打个快照就能带走，换台电脑也能从容还原。

至于后续怎么用这些素材，Obsidian 也好，Notion 也好，或者只是一个文件夹，都不妨碍。

> 当前版本支持 macOS。
>
> **注意：** 插件目前处于非常早期的阶段。如果安装后发现 Zotero 云同步出现异常，建议先卸载插件或暂时关闭云同步，并欢迎[提交 issue](../../issues) 告知情况。

---

## 安装

前往 [Releases](../../releases) 下载最新的 `.xpi` 文件，在 Zotero 8 中打开**工具 → 插件**，点击齿轮图标选择**从文件安装插件**，选中即可。

如果想从源码自己构建：

```bash
git clone https://github.com/KinomotoMio/zotero-agent-copilot.git
cd zotero-agent-copilot
npm run build
npm test
```

---

## 配置

安装后进入**工具 → 插件 → Zotero Agent Copilot → 首选项**。

需要注意的主要是两项：PDF 转换功能依赖 [MinerU](https://mineru.net) API，需要在那里注册一个 token，有免费额度可用；Claude 和 Codex 的路径如果已经在系统 PATH 里，默认值就够了，不必改动。

| 配置项 | 默认值 |
|---|---|
| 工作区根路径 | `~/Documents/Zotero Agent Copilot` |
| Claude 可执行路径 | `claude` |
| Codex 可执行路径 | `codex` |
| 默认 Agent | `claude` |
| 终端应用 | `Terminal`（也支持 iTerm） |
| MinerU API token | — |
| MinerU API 地址 | `https://mineru.net/api/v4` |

---

## 使用

右键点击任意条目，在 **Agent Copilot** 子菜单里可以找到以下操作：

| 菜单项 | 说明 |
|---|---|
| 刷新论文卡片 | 重新生成摘要笔记，同步回 Zotero |
| 转换 PDF 为 Markdown → 中文 / 英文 | 通过 MinerU 转换，结果存入工作区 |
| 打开 AI 工作区 | 在 Finder 里打开这篇文献的本地目录 |
| 启动 Claude Code / Codex | 保存快照后，在终端里启动 Agent |
| 保存工作区快照 | 将 workspace 打包成 ZIP，挂在条目下 |
| 恢复工作区 | 从最新快照还原本地文件 |

---

## 目录结构

```
~/Documents/Zotero Agent Copilot/
  library-<libraryID>-<slug>/
    CURRENT_ITEM.md             ← 当前条目摘要，Agent 启动时会读取
    papers/
      <itemKey>/
        paper-card.md           ← 同步回 Zotero 的那份笔记
        <pdf-stem>.md           ← MinerU 转出的全文 Markdown
        source/
          <original>.pdf        ← PDF 本地副本
        mineru/                 ← 转换的原始结果
        workspace/              ← Agent 的工作区，快照会包含这里
```

同一个库下所有条目共享这个根目录，Agent 启动时能看到完整的上下文。

---

## 目前的局限

启动终端这部分依赖 AppleScript，所以现在只能用在 macOS 上。

`workspace/` 里的内容不会自动同步，只在手动保存快照的时候才会打包上传。Zotero 负责同步论文卡片笔记和快照 ZIP，本地的目录树是留在本机的。

`CURRENT_ITEM` 一次只能指向一篇文献，多条目之间的联动是下一步要做的事。

---

## 接下来想做的事

**跨条目联动** — 让 Agent 能在多篇文献之间自由切换，而不是每次只盯着一篇。

**Skills 与 MCP 支持** — 让 workspace 默认携带一套实用的工具：网络检索、文献对比、结构化整理……如果你有一套行之有效的 AI 读论文工作流，用到了好的 skill 或 MCP server，非常欢迎提交进来，这能直接帮到很多人。

**Windows / Linux 支持** — 把启动层从 AppleScript 换掉。

**更多 Agent** — 不只是 Claude Code 和 Codex，任何命令行 Agent 都能接进来。

**迁移到 TypeScript** — 现在的代码库是 JavaScript，TypeScript 对 AI 辅助开发更友好，类型信息能帮 Agent 更准确地理解和修改代码。

---

AI 辅助研究这件事，不应该只属于会写代码的人。不管你研究的是历史、文学、社会学还是理工科，只要你有好的工作流想法，都可以一起来做——开 issue 聊思路，或者直接发 PR。让每个人都能用上顺手的工具，是我们真正想做到的事。

---

## License

[MIT](LICENSE)
