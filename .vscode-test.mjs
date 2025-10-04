import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/suite/**/*.test.js",
  workspaceFolder: "src/test/workspace",
  mocha: {
    ui: "bdd",
  },
});
