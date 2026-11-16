// The MIT License (MIT)
//
// Copyright (c) 2021 Anran Yang
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

import { basename, dirname, join } from "path";
import * as vscode from "vscode";
import { Extension } from "../../extension";

const foreSearchChars = 800;
const tblPrintLines = 3;

// The text a label is read from: the current document or another file
// matched by PandocCiter.CrossRefFiles.
interface LabelSource {
  fileName: string;
  getText(): string;
}

interface ParseContext {
  lineMatch: RegExpExecArray;
  type: string;
  label: string;
  doc: LabelSource;
}

// Texts of the files matched by the PandocCiter.CrossRefFiles glob patterns,
// read once and kept up to date by file system watchers.
class LabelFiles {
  private texts = new Map<string, string>();
  private watchers: vscode.FileSystemWatcher[] = [];

  constructor() {
    this.reload();
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("PandocCiter.CrossRefFiles")) {
        this.reload();
      }
    });
  }

  private async reload() {
    this.watchers.forEach((w) => w.dispose());
    this.watchers = [];
    this.texts.clear();
    const patterns: string[] = vscode.workspace
      .getConfiguration("PandocCiter")
      .get("CrossRefFiles", []);
    for (const pattern of patterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      watcher.onDidCreate((uri) => this.read(uri));
      watcher.onDidChange((uri) => this.read(uri));
      watcher.onDidDelete((uri) => this.texts.delete(uri.fsPath));
      this.watchers.push(watcher);
      const uris = await vscode.workspace.findFiles(
        pattern,
        "**/node_modules/**"
      );
      await Promise.all(uris.map((uri) => this.read(uri)));
    }
  }

  private async read(uri: vscode.Uri) {
    try {
      const data = await vscode.workspace.fs.readFile(uri);
      this.texts.set(uri.fsPath, Buffer.from(data).toString("utf8"));
    } catch {
      this.texts.delete(uri.fsPath);
    }
  }

  // The matched files other than `current`; an open file is read from its
  // editor, so unsaved labels are included.
  others(current: vscode.TextDocument): LabelSource[] {
    const sources: LabelSource[] = [];
    for (const [fileName, text] of this.texts) {
      if (fileName === current.fileName) continue;
      const open = vscode.workspace.textDocuments.find(
        (d) => d.fileName === fileName
      );
      sources.push({
        fileName,
        getText: () => (open ? open.getText() : text),
      });
    }
    return sources;
  }
}

export class Crossref {
  extension: Extension;
  files: LabelFiles;
  lineRegex: RegExp;
  regexes: {
    fig: RegExp;
    eq: RegExp;
    sec: RegExp;
    tbl: RegExp;
    lst: RegExp;
  };

  constructor(extension: Extension) {
    this.extension = extension;
    this.files = new LabelFiles();
    this.lineRegex = /.*\{.*#(fig|tbl|eq|sec|lst):(\w+).*\}.*/g;
    this.regexes = {
      fig: /!\[(.*)\]\((.+)\)\{/,
      eq: /\$\$\s*\{/,
      sec: /#*\s*(.*)\s*\{/,
      tbl: /:\s*(.*)\s*\{/,
      lst: /```.*\{/,
    };
  }

  private parseFig(ctx: ParseContext): vscode.CompletionItem {
    let match = this.regexes.fig.exec(ctx.lineMatch.toString());
    if (!match) return null;
    const title = match[1];
    const documentation = new vscode.MarkdownString(
      `![](${join(dirname(ctx.doc.fileName), match[2])}|"width=300")`
    );
    return {
      label: `${ctx.type}:${ctx.label}`,
      detail: title,
      documentation,
      kind: vscode.CompletionItemKind.Reference,
    };
  }

  private parseSec(ctx: ParseContext): vscode.CompletionItem {
    let match = this.regexes.sec.exec(ctx.lineMatch.toString());
    if (!match) return null;
    const title = match[1];
    return {
      label: `${ctx.type}:${ctx.label}`,
      detail: title,
      kind: vscode.CompletionItemKind.Reference,
    };
  }

  private parseTbl(ctx: ParseContext): vscode.CompletionItem {
    let match = this.regexes.tbl.exec(ctx.lineMatch.toString());
    if (!match) return null;
    const title = match[1];
    let documentation = new vscode.MarkdownString("");
    const doc = ctx.doc.getText();
    const searchStart = Math.max(ctx.lineMatch.index - foreSearchChars, 0);
    const sig = doc
      .substring(searchStart, ctx.lineMatch.index)
      .lastIndexOf("|:-");
    if (sig > 0) {
      const begin = doc.lastIndexOf("\n\n", sig + searchStart);
      let cursor = begin;
      // +2 = with header & splitter
      for (let i = 0; i < tblPrintLines + 2; i++) {
        const pos = doc.indexOf("\n", cursor + 1);
        if (pos < 0) break;
        else cursor = pos;
      }
      documentation = new vscode.MarkdownString(
        doc.substring(begin + 2, cursor)
      );
    }
    return {
      label: `${ctx.type}:${ctx.label}`,
      detail: title,
      documentation,
      kind: vscode.CompletionItemKind.Reference,
    };
  }

  private parseLstNormalMatch(
    ctx: ParseContext,
    _: RegExpExecArray
  ): vscode.CompletionItem {
    const doc = ctx.doc.getText();
    const end = doc.indexOf("```", ctx.lineMatch.index + 1);

    // try to parse language
    const langMatch = /\{.*\.(\w+).*\}/.exec(ctx.lineMatch.toString());
    const lang = langMatch ? langMatch[1] : "";

    // try to parse caption
    const titleMatch = /\{.*caption="(.+)".*\}/.exec(ctx.lineMatch.toString());
    let title = titleMatch ? titleMatch[1] : ctx.label;
    let documentation = new vscode.MarkdownString("");

    if (end > 0) {
      documentation = new vscode.MarkdownString(
        "``` " +
          lang +
          " " +
          doc.substring(ctx.lineMatch.index + ctx.lineMatch[0].length, end) +
          "\n```"
      );
    }
    return {
      label: `${ctx.type}:${ctx.label}`,
      documentation,
      detail: title,
      kind: vscode.CompletionItemKind.Reference,
    };
  }

  private parseLstTableMatch(
    ctx: ParseContext,
    match: RegExpExecArray
  ): vscode.CompletionItem {
    const doc = ctx.doc.getText();
    const searchStart = Math.max(ctx.lineMatch.index - foreSearchChars, 0);

    let documentation = new vscode.MarkdownString("");
    const title = match[1];

    const sig = doc
      .substring(searchStart, ctx.lineMatch.index)
      .lastIndexOf("```");
    if (sig > 0) {
      const begin = doc.lastIndexOf("\n\n", sig + searchStart);
      let cursor = begin;
      // +2 = with header & splitter
      for (let i = 0; i < tblPrintLines + 2; i++) {
        const pos = doc.indexOf("\n", cursor + 1);
        if (pos < 0) break;
        else cursor = pos;
      }
      documentation = new vscode.MarkdownString(
        doc.substring(begin + 2, cursor)
      );
    }

    return {
      label: `${ctx.type}:${ctx.label}`,
      documentation: documentation,
      detail: title,
      kind: vscode.CompletionItemKind.Reference,
    };
  }

  private parseLst(ctx: ParseContext): vscode.CompletionItem {
    const normalMatch = this.regexes.lst.exec(ctx.lineMatch.toString());
    if (normalMatch) {
      return this.parseLstNormalMatch(ctx, normalMatch);
    }
    const tableMatch = this.regexes.tbl.exec(ctx.lineMatch.toString());
    if (tableMatch) {
      return this.parseLstTableMatch(ctx, tableMatch);
    }
    return null;
  }

  private parseEq(ctx: ParseContext): vscode.CompletionItem {
    let match = this.regexes.eq.exec(ctx.lineMatch.toString());
    if (!match) return null;
    const doc = ctx.doc.getText();
    const matchIndex = ctx.lineMatch.index + match.index;
    const searchStart = Math.max(matchIndex - foreSearchChars, 0);
    const begin =
      doc.substring(searchStart, matchIndex).lastIndexOf("$$") + searchStart;

    if (begin < 0) {
      return null;
    }
    return {
      label: `${ctx.type}:${ctx.label}`,
      detail: ctx.label,
      documentation: new vscode.MarkdownString(
        doc.substring(begin + 2, matchIndex)
      ),
      kind: vscode.CompletionItemKind.Reference,
    };
  }

  provide(args?: { document: vscode.TextDocument }): vscode.CompletionItem[] {
    const mode: string = vscode.workspace
      .getConfiguration("PandocCiter")
      .get("CrossRefMode", "full");
    if (mode === "none") return [];

    const targets = [];
    let match: RegExpExecArray | null;
    const parsers = {
      fig: this.parseFig.bind(this),
      sec: this.parseSec.bind(this),
      tbl: this.parseTbl.bind(this),
      lst: this.parseLst.bind(this),
      eq: this.parseEq.bind(this),
    };
    const sources: LabelSource[] = [
      args.document,
      ...this.files.others(args.document),
    ];
    for (const source of sources) {
      const text = source.getText();
      const other = source !== args.document;
      this.lineRegex.lastIndex = 0;
      while ((match = this.lineRegex.exec(text)) !== null) {
        const type = match[1];
        const label = match[2];
        switch (mode) {
          case "full":
            const parser = parsers[type];
            if (parser) {
              let item = parser({
                lineMatch: match,
                type,
                label,
                doc: source,
              });
              if (item) {
                if (other) {
                  item.detail = `${item.detail ?? ""} (${basename(source.fileName)})`;
                }
                targets.push(item);
              }
            }
            break;
          case "minimal":
            targets.push({
              label: `${match[1]}:${match[2]}`,
              detail: other ? basename(source.fileName) : undefined,
              kind: vscode.CompletionItemKind.Reference,
            });
            break;
        }
      }
    }
    return targets;
  }
}
