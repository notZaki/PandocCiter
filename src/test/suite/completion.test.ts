import * as assert from "assert";
import * as vscode from "vscode";

describe("Completion", () => {
  let doc: vscode.TextDocument;
  let editor: vscode.TextEditor;

  const fs = require("fs");
  let bibPath: string;
  let mdPath: string;
  before(async () => {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      throw new Error("No workspace folder found for test.");
    }
    const wsPath = wsFolders[0].uri.fsPath;
    const path = require("path");
    bibPath = path.join(wsPath, "references.bib");
    mdPath = path.join(wsPath, "test.md");

    doc = await vscode.workspace.openTextDocument(vscode.Uri.file(mdPath));
    editor = await vscode.window.showTextDocument(doc);
    // Save the document to trigger extension file watchers
    await editor.document.save();
    // Force the extension to re-parse the bibliography
    const ext = vscode.extensions.getExtension("notZaki.pandocciter");
    if (ext && ext.isActive && ext.exports && ext.exports.manager) {
      await ext.exports.manager.findBib();
    }
  });

  it("should provide citation completions", async () => {
    const pos = new vscode.Position(0, 11); // after "@"
    const completions =
      await vscode.commands.executeCommand<vscode.CompletionList>(
        "vscode.executeCompletionItemProvider",
        doc.uri,
        pos,
      );
    assert.ok(
      completions && completions.items.length > 0,
      "No completions found",
    );
  });
});
