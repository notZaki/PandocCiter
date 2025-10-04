import * as assert from "assert";
import * as vscode from "vscode";
import { HoverProvider } from "../../providers/hover";
import { Extension } from "../../extension";

const path = require("path");

describe("Hover", () => {
  let extension: Extension;
  let provider: HoverProvider;
  let document: vscode.TextDocument;
  let mdPath: string;

  before(async () => {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders || wsFolders.length === 0) {
      throw new Error("No workspace folder found for test.");
    }
    const wsPath = wsFolders[0].uri.fsPath;
    mdPath = path.join(wsPath, "test.md");

    // Mock Extension and citation completer
    extension = {
      completer: {
        citation: {
          getEntry: (key: string) => {
            if (key === "doe2020") {
              return {
                documentation: "This is a test documentation for doe2020.",
                detail: "Doe, 2020",
              };
            }
            if (key === "nodeets") {
              return {
                detail: "No documentation, only detail",
              };
            }
            return undefined;
          },
        },
      },
    } as any;
    provider = new HoverProvider(extension);
    document = await vscode.workspace.openTextDocument(vscode.Uri.file(mdPath));
  });

  it("should provide hover for a valid cite key with documentation", async () => {
    const text = document.getText();
    const index = text.indexOf("@doe2020");
    assert(index !== -1, "Could not find @doe2020 in test.md");
    const position = document.positionAt(index + 1); // +1 to be on the cite key
    const hover = await provider.provideHover(document, position, {} as any);
    assert(hover, "Hover should be provided");
    const hoverContent = (hover as vscode.Hover).contents[0];
    let hoverText = "";
    if (typeof hoverContent === "string") {
      hoverText = hoverContent;
    } else if ("value" in hoverContent) {
      hoverText = hoverContent.value;
    } else {
      hoverText = String(hoverContent);
    }
    assert(
      hoverText.includes("test documentation"),
      "Hover text should include documentation",
    );
  });

  it("should provide hover for a cite key with only detail", async () => {
    // Simulate @nodeets in the document (even if not present, just test the logic)
    const position = new vscode.Position(0, 0);
    const hover = await provider.provideHover(
      {
        ...document,
        getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 7),
        getText: () => "nodeets",
      } as any,
      position,
      {} as any,
    );
    assert(hover, "Hover should be provided for detail-only cite");
    const hoverContent = (hover as vscode.Hover).contents[0];
    let hoverText = "";
    if (typeof hoverContent === "string") {
      hoverText = hoverContent;
    } else if ("value" in hoverContent) {
      hoverText = hoverContent.value;
    } else {
      hoverText = String(hoverContent);
    }
    assert(
      hoverText.includes("No documentation"),
      "Hover text should include detail",
    );
  });

  it("should return undefined for an invalid cite key", async () => {
    // Simulate a cite key that does not exist
    const position = new vscode.Position(0, 0);
    const hover = await provider.provideHover(
      {
        ...document,
        getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 8),
        getText: () => "nonexist",
      } as any,
      position,
      {} as any,
    );
    assert.strictEqual(hover, undefined);
  });
});
