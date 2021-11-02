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

import * as vscode from 'vscode';
import { Extension } from '../../extension';

export class Crossref {
    extension: Extension;
    regex: RegExp;

    constructor(extension: Extension) {
        this.extension = extension;
        this.regex = /!\[(.+)\]\((.+)\)\{.*#(fig|tbl|eq|sec|lst):(\w+).*\}/g;
    }

    provide(args?: {
        document: vscode.TextDocument;
    }): vscode.CompletionItem[] {
        const targets = [];
        let match: RegExpExecArray | null;
        while ((match = this.regex.exec(args.document.getText())) !== null) {
            const title = match[1];
            const file = match[2];
            const type = match[3];
            const label = match[4];
            targets.push({
                label: `${type}:${label}`,
                documentation: title,
                kind: vscode.CompletionItemKind.Reference,
            });
        }
        return targets;
    }
}
