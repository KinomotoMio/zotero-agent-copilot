(function() {
  var TITLE = ZoteroAgentCopilot.Constants.SNAPSHOT_ATTACHMENT_TITLE;

  async function findManagedSnapshotAttachment(item) {
    let attachments = Zotero.Items.get(item.getAttachments()).filter(Boolean);
    for (let attachment of attachments) {
      if (attachment.getField("title") === TITLE) {
        return attachment;
      }
    }
    return null;
  }

  async function upsertSnapshotAttachment(item, zipPath) {
    let existing = await findManagedSnapshotAttachment(item);
    if (existing) {
      await existing.eraseTx();
    }
    return Zotero.Attachments.importFromFile({
      file: zipPath,
      parentItemID: item.id,
      title: TITLE,
      saveOptions: {
        skipSelect: true
      }
    });
  }

  async function getSnapshotFilePath(item) {
    let attachment = await findManagedSnapshotAttachment(item);
    if (!attachment) {
      return null;
    }
    return attachment.getFilePathAsync();
  }

  ZoteroAgentCopilot.AttachmentService = {
    findManagedSnapshotAttachment,
    getSnapshotFilePath,
    upsertSnapshotAttachment
  };
})();
