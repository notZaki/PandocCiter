import * as assert from "assert";
import * as vscode from "vscode";
import { Manager } from "../../components/manager";
import { Extension } from "../../extension";
import * as fs from "fs";

const path = require("path");

describe("Manager", () => {
  let extension: Extension;
  let manager: Manager;
  let bibPath: string;
  let mdPath: string;
  let parseBibFileCalled: boolean;

  before(async () => {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      throw new Error("No workspace folder found for test.");
    }
    const wsPath = wsFolders[0].uri.fsPath;
    bibPath = path.join(wsPath, "references.bib");
    mdPath = path.join(wsPath, "test.md");

    // Mock extension and citation completer
    parseBibFileCalled = false;
    extension = {
      log: () => {},
      completer: {
        citation: {
          parseBibFile: (file: string) => {
            if (file === bibPath) {
              parseBibFileCalled = true;
            }
          },
          forgetParsedBibItems: () => {},
        },
      },
    } as any;
    manager = new Manager(extension);
  });

  it("should re-parse the .bib file when it is changed", async function () {
    this.timeout(5000); // Allow time for file watcher
    // Write a dummy YAML header to test.md to trigger bib file watching
    const yamlHeader = "---\nbibliography: [references.bib]\n---\n";
    const origText = fs.readFileSync(mdPath, "utf8");
    fs.writeFileSync(mdPath, yamlHeader + origText);
    // Open the document and trigger findBib
    const doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(mdPath),
    );
    await vscode.window.showTextDocument(doc);
    manager.findBib();
    // Wait a moment for watcher to be set up
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Touch the .bib file to trigger the watcher
    const origBib = fs.readFileSync(bibPath, "utf8");
    fs.appendFileSync(bibPath, "\n% test change");
    // Wait for watcher to fire
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Clean up
    fs.writeFileSync(bibPath, origBib);
    fs.writeFileSync(mdPath, origText);
    assert(
      parseBibFileCalled,
      "parseBibFile should be called when .bib file changes",
    );
  });
});
