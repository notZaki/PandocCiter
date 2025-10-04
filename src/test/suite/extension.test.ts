import * as assert from "assert";
import * as vscode from "vscode";

describe("Extension", () => {
  it("should activate the extension", async () => {
    const ext = vscode.extensions.getExtension("notZaki.pandocciter");
    assert.ok(ext, "Extension not found");
    await ext!.activate();
    assert.ok(ext!.isActive, "Extension did not activate");
  });
});
