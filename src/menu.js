(function() {
  var ACTIONS = ZoteroAgentCopilot.Constants.ACTIONS;

  var ACTION_CONFIG = [
    { id: ACTIONS.REFRESH_PAPER, l10nID: "zac-menu-refresh-paper", label: "Refresh Paper Card" },
    {
      id: "convert-markdown",
      l10nID: "zac-menu-convert-markdown",
      label: "Convert PDF to Markdown",
      children: [
        {
          id: ACTIONS.CONVERT_MARKDOWN_CHINESE,
          l10nID: "zac-menu-convert-markdown-chinese",
          label: "Chinese",
          requiresPdf: true
        },
        {
          id: ACTIONS.CONVERT_MARKDOWN_ENGLISH,
          l10nID: "zac-menu-convert-markdown-english",
          label: "English",
          requiresPdf: true
        }
      ]
    },
    { id: ACTIONS.OPEN_WORKSPACE, l10nID: "zac-menu-open-workspace", label: "Open AI Workspace" },
    { id: ACTIONS.LAUNCH_CLAUDE, l10nID: "zac-menu-launch-claude", label: "Launch Claude Code" },
    { id: ACTIONS.LAUNCH_CODEX, l10nID: "zac-menu-launch-codex", label: "Launch Codex" },
    { id: ACTIONS.SAVE_SNAPSHOT, l10nID: "zac-menu-save-snapshot", label: "Save Workspace Snapshot" },
    { id: ACTIONS.RESTORE_SNAPSHOT, l10nID: "zac-menu-restore-snapshot", label: "Restore Workspace" }
  ];

  var menu = {
    registeredMenuID: null,
    usingFallback: false,
    fallbackEntries: new WeakMap(),

    canRunPdfAction(item) {
      return Boolean(item && ZoteroAgentCopilot.ItemService.hasStoredPdfAttachment(item));
    },

    setEnabledState(context, enabled) {
      if (typeof context?.setEnabled === "function") {
        context.setEnabled(enabled);
        return;
      }
      if (typeof context?.setDisabled === "function") {
        context.setDisabled(!enabled);
      }
    },

    buildMenuDefinition(node) {
      if (node.children?.length) {
        return {
          menuType: "submenu",
          l10nID: node.l10nID,
          onShowing: (event, context) => {
            context.setVisible(this.shouldShowContext(context));
            if (node.requiresPdf) {
              this.setEnabledState(context, this.canRunPdfAction(context.items?.[0]));
            }
          },
          menus: node.children.map(child => this.buildMenuDefinition(child))
        };
      }

      return {
        menuType: "menuitem",
        l10nID: node.l10nID,
        onShowing: (event, context) => {
          context.setVisible(this.shouldShowContext(context));
          if (node.requiresPdf) {
            this.setEnabledState(context, this.canRunPdfAction(context.items?.[0]));
          }
        },
        onCommand: (event, context) => {
          void this.handleAction(node.id, event, context.items?.[0]);
        }
      };
    },

    async register() {
      if (!Zotero.MenuManager?.registerMenu) {
        this.usingFallback = true;
        return;
      }

      try {
        this.registeredMenuID = Zotero.MenuManager.registerMenu({
          menuID: "agent-copilot",
          pluginID: ZoteroAgentCopilot.id,
          target: "main/library/item",
          menus: [
            {
              menuType: "submenu",
              l10nID: "zac-menu-root",
              onShowing: (event, context) => {
                context.setVisible(this.shouldShowContext(context));
              },
              menus: ACTION_CONFIG.map(action => this.buildMenuDefinition(action))
            }
          ]
        });
      }
      catch (error) {
        this.usingFallback = true;
        ZoteroAgentCopilot.Log.debug(`MenuManager registration failed, falling back to DOM injection: ${error}`);
      }
    },

    unregister() {
      if (this.registeredMenuID) {
        Zotero.MenuManager.unregisterMenu(this.registeredMenuID);
        this.registeredMenuID = null;
      }
    },

    addToWindow(window) {
      if (!this.usingFallback || this.fallbackEntries.has(window)) {
        return;
      }
      let doc = window.document;
      let popup = doc.getElementById("zotero-itemmenu");
      if (!popup) {
        return;
      }

      let menuElem = doc.createXULElement("menu");
      menuElem.id = "zac-fallback-root-menu";
      menuElem.label = "Agent Copilot";
      let popupElem = doc.createXULElement("menupopup");
      menuElem.appendChild(popupElem);

      let actionNodes = [];

      let appendNode = (parentPopup, node) => {
        if (node.children?.length) {
          let subMenu = doc.createXULElement("menu");
          subMenu.id = `zac-${node.id}`;
          subMenu.label = node.label;
          let subPopup = doc.createXULElement("menupopup");
          subMenu.appendChild(subPopup);
          parentPopup.appendChild(subMenu);
          actionNodes.push({ element: subMenu, config: node });
          for (let child of node.children) {
            appendNode(subPopup, child);
          }
          return;
        }

        let item = doc.createXULElement("menuitem");
        item.id = `zac-${node.id}`;
        item.label = node.label;
        item.addEventListener("command", () => {
          void this.handleAction(node.id, window);
        });
        parentPopup.appendChild(item);
        actionNodes.push({ element: item, config: node });
      };

      for (let action of ACTION_CONFIG) {
        appendNode(popupElem, action);
      }

      let popupShowing = () => {
        let items = ZoteroAgentCopilot.ItemService.getSelectedItems(window);
        let visible = ZoteroAgentCopilot.ItemService.isEligibleSelection(items);
        let selectedItem = items?.[0] || null;
        menuElem.hidden = !visible;
        for (let node of actionNodes) {
          if (!node.config.requiresPdf) {
            node.element.disabled = false;
            continue;
          }
          node.element.disabled = !this.canRunPdfAction(selectedItem);
        }
      };

      popup.addEventListener("popupshowing", popupShowing);
      popup.appendChild(menuElem);
      this.fallbackEntries.set(window, { popup, popupShowing, menuElem });
    },

    removeFromWindow(window) {
      let entry = this.fallbackEntries.get(window);
      if (!entry) {
        return;
      }
      entry.popup.removeEventListener("popupshowing", entry.popupShowing);
      entry.menuElem.remove();
      this.fallbackEntries.delete(window);
    },

    shouldShowContext(context) {
      return ZoteroAgentCopilot.ItemService.isEligibleSelection(context.items);
    },

    async handleAction(action, windowOrEvent, contextItem) {
      let window = windowOrEvent?.ownerGlobal || windowOrEvent?.view || windowOrEvent || Zotero.getMainWindow();
      await ZoteroAgentCopilot.executeAction(action, window, contextItem);
    }
  };

  ZoteroAgentCopilot.Menu = menu;
})();
