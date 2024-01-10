"use strict";

import * as vscode from "vscode";

import { Manager } from "./components/manager";
import { Completer } from "./providers/completion";
import { HoverProvider } from "./providers/hover";
import { DefinitionProvider } from "./providers/definition";

export function activate(context: vscode.ExtensionContext) {
  const extension = new Extension();

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(() => {
      extension.log("Reacting to document open");
      if (vscode.window.activeTextEditor) {
        extension.manager.findBib();
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      extension.log("Reacting to active document change");
      if (
        vscode.window.activeTextEditor &&
        ["markdown", "rmd", "pweave_md"].includes(
          vscode.window.activeTextEditor.document.languageId
        )
      ) {
        extension.manager.findBib();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      extension.log("Reacting to document save");
      if (vscode.window.activeTextEditor) {
        extension.manager.findBib();
      }
    })
  );

  const selector = ["markdown", "rmd", "pweave_md", "quarto"].map(
    (language) => {
      return { scheme: "file", language: language };
    }
  );

  extension.manager.findBib();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      selector,
      extension.completer,
      "@"
    )
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, extension.hover)
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, extension.definition)
  );
}

export class Extension {
  manager: Manager;
  completer: Completer;
  hover: HoverProvider;
  definition: DefinitionProvider;
  logPanel: vscode.OutputChannel;

  constructor() {
    this.manager = new Manager(this);
    this.completer = new Completer(this);
    this.hover = new HoverProvider(this);
    this.definition = new DefinitionProvider(this);
    this.logPanel = vscode.window.createOutputChannel("PandocCiter");
    this.log(`PandocCiter is now activated`);
  }

  log(msg: string) {
    if (vscode.workspace.getConfiguration("PandocCiter").get("ShowLog")) {
      this.logPanel.append(`${msg}\n`);
    }
  }
}

export function deactivate() {}
