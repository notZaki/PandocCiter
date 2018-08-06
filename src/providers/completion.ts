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

import * as vscode from 'vscode';

import {Extension} from '../extension';
import {Citation} from './completer/citation';

export class Completer implements vscode.CompletionItemProvider {
    extension: Extension;
    citation: Citation;

    constructor(extension: Extension) {
        this.extension = extension;
        this.citation = new Citation(extension);
    }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken) : Promise<vscode.CompletionItem[]> {
        return new Promise((resolve, _reject) => {
            const line = document.lineAt(position.line).text.substr(0, position.character);
            const suggestions = this.completion(line);
                if (suggestions.length > 0) {            
                    resolve(suggestions);
                    return;
            }
            resolve();
        });
    }

    completion(line: string) : vscode.CompletionItem[] {
        let reg;
        let provider;
        reg = /(?:^|[ ;\[])\@([^\]\s]*)/;
        provider = this.citation;
            
        const result = line.match(reg);
        let suggestions: vscode.CompletionItem[] = [];
        if (result) {
            suggestions = provider.provide();
        }
        return suggestions;
    }
}
