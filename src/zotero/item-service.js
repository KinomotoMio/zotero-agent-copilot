(function() {
  function getPane(window) {
    return window?.ZoteroPane || Zotero.getActiveZoteroPane();
  }

  function getSelectedItems(window) {
    let pane = getPane(window);
    if (!pane) {
      return [];
    }
    return pane.getSelectedItems() || [];
  }

  function isEligibleSelection(items) {
    return Array.isArray(items) && items.length === 1 && items[0]?.isRegularItem();
  }

  function getSelectedRegularItem(window) {
    let items = getSelectedItems(window);
    if (!isEligibleSelection(items)) {
      throw new Error("Select exactly one regular Zotero item to use Agent Copilot.");
    }
    return items[0];
  }

  function getLibraryName(item) {
    let library = Zotero.Libraries.get(item.libraryID);
    return library?.name || "My Library";
  }

  function getChildAttachments(item) {
    return Zotero.Items.get(item.getAttachments()).filter(Boolean);
  }

  function getAuthors(item) {
    let creators = item.getCreatorsJSON ? item.getCreatorsJSON() : item.getCreators();
    return creators
      .map((creator) => creator.name || [creator.firstName, creator.lastName].filter(Boolean).join(" ").trim())
      .filter(Boolean);
  }

  function getTags(item) {
    return item.getTags().map(tag => tag.tag).filter(Boolean);
  }

  function getCitationKey(item) {
    if (typeof item.getExtraField === "function") {
      for (let field of ["citationKey", "Citation Key", "Citation key"]) {
        let value = item.getExtraField(field);
        if (value) {
          return value;
        }
      }
    }
    let extra = item.getField("extra") || "";
    let match = extra.match(/^citation key:\s*(.+)$/im);
    return match ? match[1].trim() : "";
  }

  function firstNonEmpty(item, fields) {
    for (let field of fields) {
      let value = item.getField(field);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function getAttachments(item) {
    return getChildAttachments(item)
      .map((attachment) => {
        let title = attachment.getField("title") || attachment.attachmentFilename || attachment.key;
        let type = attachment.attachmentContentType || "attachment";
        return {
          id: attachment.id,
          key: attachment.key,
          title,
          type,
          isPDF: type === "application/pdf",
          isStoredFile: typeof attachment.isStoredFileAttachment === "function"
            ? attachment.isStoredFileAttachment()
            : true,
          label: `${title} (${type})`
        };
      });
  }

  function getPdfAttachments(item) {
    return getChildAttachments(item).filter((attachment) => {
      if (attachment.attachmentContentType !== "application/pdf") {
        return false;
      }
      if (typeof attachment.isStoredFileAttachment === "function") {
        return attachment.isStoredFileAttachment();
      }
      return true;
    });
  }

  function hasStoredPdfAttachment(item) {
    return getPdfAttachments(item).length > 0;
  }

  async function getBestPdfAttachment(item) {
    for (let attachment of getPdfAttachments(item)) {
      let filePath = await attachment.getFilePathAsync();
      if (filePath) {
        return attachment;
      }
    }
    return null;
  }

  async function extractPdfAttachmentInfo(item) {
    let attachment = await getBestPdfAttachment(item);
    if (!attachment) {
      return null;
    }
    let filePath = await attachment.getFilePathAsync();
    let fileName = attachment.attachmentFilename || ZoteroAgentCopilot.IO.basename(filePath);
    return {
      attachmentID: attachment.id,
      attachmentKey: attachment.key,
      title: attachment.getField("title") || fileName || attachment.key,
      contentType: attachment.attachmentContentType || "application/pdf",
      fileName,
      filePath
    };
  }

  async function extractItemMetadata(item) {
    let primaryPdf = await extractPdfAttachmentInfo(item);
    return {
      itemID: item.id,
      itemKey: item.key,
      libraryID: item.libraryID,
      libraryName: getLibraryName(item),
      title: item.getField("title"),
      authors: getAuthors(item),
      year: item.getField("year"),
      venue: firstNonEmpty(item, [
        "publicationTitle",
        "proceedingsTitle",
        "websiteTitle",
        "bookTitle",
        "repository"
      ]),
      doi: item.getField("DOI"),
      url: item.getField("url"),
      abstractNote: item.getField("abstractNote"),
      tags: getTags(item),
      attachments: getAttachments(item),
      primaryPdf,
      citationKey: getCitationKey(item),
      itemType: item.itemType,
      updatedAt: new Date().toISOString()
    };
  }

  ZoteroAgentCopilot.ItemService = {
    extractItemMetadata,
    extractPdfAttachmentInfo,
    getBestPdfAttachment,
    getChildAttachments,
    getPane,
    getPdfAttachments,
    getSelectedItems,
    getSelectedRegularItem,
    hasStoredPdfAttachment,
    isEligibleSelection
  };
})();
