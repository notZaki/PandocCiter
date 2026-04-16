// This file is adapted from https://github.com/James-Yu/LaTeX-Workshop/blob/master/src/providers/completion.ts
// Original license below:
//////////////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2016 James Yu
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//////////////////////////////////////////////////////////////////////////////////////////

import * as vscode from "vscode";

import { Extension } from "../extension";
import { Citation } from "./completer/citation";
import { Crossref } from "./completer/crossref";

export class Completer implements vscode.CompletionItemProvider {
  extension: Extension;
  citation: Citation;
  crossref: Crossref;

  constructor(extension: Extension) {
    this.extension = extension;
    this.citation = new Citation(extension);
    this.crossref = new Crossref(extension);
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.CompletionList | undefined {
    // This was used to terminate unecessary autompletion early, but might be causing suggestions to not appear for some users
    // const invoker = document.lineAt(position.line).text[position.character-1];
    // if (invoker !== '@') {return;}
    const line = document
      .lineAt(position.line)
      .text.substring(0, position.character)
      .trim()
      .split(" ");
    const trigger = line[line.length - 1];
    const suggestions = this.completion(trigger, document, position).concat(
      this.completionCrossref(trigger, document)
    );
    this.extension.log(`Showing ${suggestions.length} suggestions`);
    if (suggestions.length > 0) {
      const configuration = vscode.workspace.getConfiguration("PandocCiter");
      if ((configuration.get("ViewType") as string) === "browser") {
        setTimeout(() => this.citation.browser(), 10);
        return;
      }
      // Mark the list as incomplete so VS Code re-invokes this provider on
      // every keystroke, which lets us re-run the substring filter below
      // against the full typed query instead of relying on the built-in
      // client-side fuzzy filter.
      return new vscode.CompletionList(suggestions, true);
    }
    return;
  }

  completion(
    line: string,
    document?: vscode.TextDocument,
    position?: vscode.Position
  ): vscode.CompletionItem[] {
    let reg = /(?:^|[ ;\[-])\@([^\]\s]*)/;
    let provider = this.citation;

    const result = line.match(reg);
    let suggestions: vscode.CompletionItem[] = [];
    if (result) {
      const query = result[1].toLowerCase();
      const args =
        document && position
          ? {
              document,
              position,
              token: undefined as unknown as vscode.CancellationToken,
              context: undefined as unknown as vscode.CompletionContext,
            }
          : undefined;
      const allItems = provider.provide(args);
      if (query.length === 0) {
        suggestions = allItems;
      } else {
        // Substring match across the key plus every indexed field, so users
        // can find an entry by any word in the title/author/journal, not only
        // by the prefix of the cite key.
        suggestions = allItems
          .filter((item) => {
            const searchText = (
              (item.filterText as string) || String(item.label)
            ).toLowerCase();
            return searchText.includes(query);
          })
          .map((item) => {
            // Prepend the query so VS Code's own fuzzy filter always passes
            // the items we already matched server-side.
            item.filterText = query + " " + (item.filterText || "");
            return item;
          });
      }
    }

    return suggestions;
  }

  completionCrossref(
    line: string,
    doc: vscode.TextDocument
  ): vscode.CompletionItem[] {
    return this.crossref.provide({ document: doc });
  }
}
