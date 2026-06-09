"use strict";

import * as vscode from "vscode";

import { Manager } from "./components/manager";
import { Completer } from "./providers/completion";
import { HoverProvider } from "./providers/hover";
import { DefinitionProvider } from "./providers/definition";

const supportedLanguages = ["markdown", "rmd", "pweave_md", "quarto"];

export function activate(context: vscode.ExtensionContext) {
  const extension = new Extension();

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      extension.log("Reacting to document open");
      if (supportedLanguages.includes(document.languageId)) {
        extension.manager.findBib(document);
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      extension.log("Reacting to active document change");
      if (
        vscode.window.activeTextEditor &&
        supportedLanguages.includes(
          vscode.window.activeTextEditor.document.languageId
        )
      ) {
        extension.manager.findBib(vscode.window.activeTextEditor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      extension.log("Reacting to document save");
      if (supportedLanguages.includes(document.languageId)) {
        extension.manager.findBib(document);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (
        !editor ||
        editor.document !== event.document ||
        !supportedLanguages.includes(event.document.languageId)
      ) {
        return;
      }
      const shouldRetrigger = event.contentChanges.some(
        (change) => {
          if (change.text !== "" || change.rangeLength === 0) {
            return false;
          }
          const linePrefix = event.document
            .lineAt(change.range.start.line)
            .text.substring(0, change.range.start.character);
          return /(?:^|[ ;\[-])@$/.test(linePrefix);
        }
      );
      if (shouldRetrigger) {
        setTimeout(
          () => vscode.commands.executeCommand("editor.action.triggerSuggest"),
          0
        );
      }
    })
  );

  const selector = supportedLanguages;

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

  extension.manager.findBib();
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
