# Changelog

## [0.1.0] - 2026-03-31

- 论文卡片笔记：为每个条目自动生成包含标题、作者、摘要、标签的 Markdown 摘要，同步为 Zotero 子笔记
- PDF 转 Markdown：通过 MinerU v4 API 转换文献 PDF，支持中英文输出
- 可恢复工作区：将 `workspace/` 打包为 ZIP 附件挂在条目下，一键跨设备还原
- Agent 启动：在库级根目录启动 Claude Code 或 Codex，自动注入当前条目路径等环境变量
- 库级工作区：同一 Zotero 库下所有条目共享根目录，Agent 可感知全局上下文

---

- Paper card note: auto-generates a Markdown summary (title, authors, abstract, tags) for each item and syncs it back as a Zotero child note
- PDF to Markdown: converts PDFs via the MinerU v4 API, with Chinese and English output supported
- Resumable workspace: packages `workspace/` as a ZIP attachment on the item, restorable on any machine
- Agent launch: opens Claude Code or Codex from the library root, with current item path injected as environment variables
- Library-level workspace: all items in a library share one root directory, giving the Agent full cross-item context
