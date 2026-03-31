(function() {
  var MarkdownNote = ZoteroAgentCopilot.Shared.MarkdownNote;

  async function findManagedPaperNote(item) {
    let notes = Zotero.Items.get(item.getNotes()).filter(Boolean);
    for (let note of notes) {
      let noteHtml = note.getNote();
      if (MarkdownNote.isManagedNoteHtml(noteHtml)) {
        return note;
      }
    }
    return null;
  }

  async function upsertPaperNote(item, markdown) {
    let note = await findManagedPaperNote(item);
    let noteHtml = MarkdownNote.renderManagedNote(markdown);
    if (note) {
      note.setNote(noteHtml);
      await note.saveTx();
      return note;
    }

    note = new Zotero.Item("note");
    note.libraryID = item.libraryID;
    note.parentID = item.id;
    note.setNote(noteHtml);
    await note.saveTx();
    return note;
  }

  async function readManagedPaperMarkdown(item) {
    let note = await findManagedPaperNote(item);
    if (!note) {
      return null;
    }
    return MarkdownNote.extractManagedMarkdown(note.getNote());
  }

  ZoteroAgentCopilot.NoteService = {
    findManagedPaperNote,
    readManagedPaperMarkdown,
    upsertPaperNote
  };
})();
