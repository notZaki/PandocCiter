import * as assert from "assert";
import * as vscode from "vscode";
import { DefinitionProvider } from "../../providers/definition";
import { Extension } from "../../extension";

describe("Find Definition", () => {
  let extension: Extension;
  let provider: DefinitionProvider;
  let document: vscode.TextDocument;
  let bibPath: string;
  let mdPath: string;
  const path = require("path");

  before(async () => {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      throw new Error("No workspace folder found for test.");
    }
    const wsPath = wsFolders[0].uri.fsPath;
    bibPath = path.join(wsPath, "references.bib");
    mdPath = path.join(wsPath, "test.md");

    // Mock Extension and citation completer
    extension = {
      completer: {
        citation: {
          getEntry: (key: string) => {
            if (key === "doe2020") {
              return {
                file: bibPath,
                position: new vscode.Position(0, 0),
              };
            }
            return undefined;
          },
        },
      },
    } as any;
    provider = new DefinitionProvider(extension);
    document = await vscode.workspace.openTextDocument(vscode.Uri.file(mdPath));
  });

  it("should provide definition for a valid cite key", async () => {
    // Find the position of @doe2020 in the test.md file
    const text = document.getText();
    const index = text.indexOf("@doe2020");
    assert(index !== -1, "Could not find @doe2020 in test.md");
    const position = document.positionAt(index + 1); // +1 to be on the cite key
    const location = provider.provideDefinition(document, position);
    assert(location, "Definition location should be provided");
    assert.strictEqual((location as vscode.Location).uri.fsPath, bibPath);
    assert.strictEqual((location as vscode.Location).range.start.line, 0);
  });

  it("should return undefined for an invalid cite key", async () => {
    const text = document.getText();
    const index = text.indexOf("@nonexistent");
    let position;
    if (index !== -1) {
      position = document.positionAt(index + 1);
    } else {
      // fallback: pick a random position
      position = new vscode.Position(0, 0);
    }
    const location = provider.provideDefinition(document, position);
    assert.strictEqual(location, undefined);
  });
});
