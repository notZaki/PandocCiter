// This file is adapted from https://github.com/James-Yu/LaTeX-Workshop/blob/master/src/providers/completer/citation.ts
// Original license below:
////////////////////////////////////////////////////////////////////////////////
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

import * as vscode from 'vscode';
import * as fs from 'fs';

import {Extension} from '../../extension';
import {bibtexParser} from 'latex-utensils';


export interface Suggestion extends vscode.CompletionItem {
    key: string;
    documentation: string;
    fields: {[key: string]: string};
    file: string;
    position: vscode.Position;
}

export class Citation {
    extension: Extension;
    private bibEntries: {[file: string]: Suggestion[]} = {};

    constructor(extension: Extension) {
        this.extension = extension;
    }
    
    provide(args?: {document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext}): vscode.CompletionItem[] {
        // Compile the suggestion array to vscode completion array
        return this.updateAll().map(item => {
            item.filterText = `${item.key} ${item.fields.author} ${item.fields.title} ${item.fields.journal}`;
            item.insertText = item.key;
            // Documentation seems unnecessary (it is only duplicate of detail)
            // item.documentation = item.detail;
            if (args) {
                item.range = args.document.getWordRangeAtPosition(args.position, /[-a-zA-Z0-9_:.]+/);
            }
            return item;
        });
    }

    browser(_args?: {document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext}) {
        vscode.window.showQuickPick(this.updateAll().map(item => {
            return {
                label: item.fields.title ? item.fields.title : '',
                description: `${item.key}`,
                detail: `Authors: ${item.fields.author ? item.fields.author : 'Unknown'}, publication: ${item.fields.journal ? item.fields.journal : (item.fields.journaltitle ? item.fields.journaltitle : (item.fields.publisher ? item.fields.publisher : 'Unknown'))}`
            };
        }), {
            placeHolder: 'Press ENTER to insert citation key at cursor',
            matchOnDetail: true,
            matchOnDescription: true,
            ignoreFocusOut: true
        }).then(selected => {
            if (!selected) {
                return;
            }
            if (vscode.window.activeTextEditor) {
                const editor = vscode.window.activeTextEditor;
                const content = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), editor.selection.start));
                let start = editor.selection.start;
                if (content.lastIndexOf('\\cite') > content.lastIndexOf('}')) {
                    const curlyStart = content.lastIndexOf('{') + 1;
                    const commaStart = content.lastIndexOf(',') + 1;
                    start = editor.document.positionAt(curlyStart > commaStart ? curlyStart : commaStart);
                }
                editor.edit(edit => edit.replace(new vscode.Range(start, editor.selection.start), selected.description || ''))
                    .then(() => editor.selection = new vscode.Selection(editor.selection.end, editor.selection.end));
            }
        });
    }

    parseBibFile(file: string) {
        const fields: string[] = (vscode.workspace.getConfiguration('PandocCiter').get('CitationFormat') as string[]).map(f => { return f.toLowerCase(); });
        this.extension.log(`Parsing .bib entries from ${file}`);
        this.bibEntries[file] = [];
        const bibtex = fs.readFileSync(file).toString();
        const ast = bibtexParser.parse(bibtex);
        ast.content
            .filter(bibtexParser.isEntry)
            .forEach((entry: bibtexParser.Entry) => {
                if (entry.internalKey === undefined) {
                    return;
                }
                const item: Suggestion = {
                    key: entry.internalKey,
                    label: entry.internalKey,
                    file,
                    position: new vscode.Position(entry.location.start.line - 1, entry.location.start.column - 1),
                    kind: vscode.CompletionItemKind.Reference,
                    documentation: '',
                    fields: {}
                };
                fields.forEach(field => {
                    const fieldcontents = entry.content.filter(e => e.name === field)
                    if (fieldcontents.length > 0) {
                        const fieldcontent = fieldcontents[0]
                        const value = Array.isArray(fieldcontent.value.content) ?
                        fieldcontent.value.content.join(' ') : this.deParenthesis(fieldcontent.value.content);
                        item.fields[fieldcontent.name] = value;
                        item.documentation += `${fieldcontent.name.charAt(0).toUpperCase() + fieldcontent.name.slice(1)}: ${value}\n`;
                    }
                })
                // entry.content.forEach(field => {
                //     const value = Array.isArray(field.value.content) ?
                //         field.value.content.join(' ') : this.deParenthesis(field.value.content);
                //     item.fields[field.name] = value;
                //     if (fields.includes(field.name.toLowerCase())) {
                //         item.detail += `${field.name.charAt(0).toUpperCase() + field.name.slice(1)}: ${value}\n`;
                //     }
                // });
                this.bibEntries[file].push(item);
            });
        this.extension.log(`Parsed ${this.bibEntries[file].length} bib entries from ${file}.`);
    }

    private deParenthesis(str: string) {
        return str.replace(/{+([^\\{}]+)}+/g, '$1');
    }

    private updateAll(bibFiles?: string[]): Suggestion[] {
        let suggestions: Suggestion[] = [];
        // From bib files
        if (bibFiles === undefined) {
            bibFiles = Object.keys(this.bibEntries);
        }
        bibFiles.forEach(file => {
            suggestions = suggestions.concat(this.bibEntries[file]);
        });
        this.checkForDuplicates(suggestions);
        return suggestions;
    }

    checkForDuplicates(items: Suggestion[]) {
        const allKeys = (items.map(items => items.key));
        if ((new Set(allKeys)).size !== allKeys.length) {
            // Code from: https://stackoverflow.com/questions/840781/get-all-non-unique-values-i-e-duplicate-more-than-one-occurrence-in-an-array
            const count = keys => 
                keys.reduce((a, b) => 
                    Object.assign(a, {[b]: (a[b] || 0) + 1}), {});
            const duplicates = dict => 
                Object.keys(dict).filter((a) => dict[a] > 1);
            vscode.window.showInformationMessage(`Duplicate key(s): ${duplicates(count(allKeys))}`);
        }
    }

    forgetParsedBibItems(bibPath: string) {
        this.extension.log(`Forgetting parsed bib entries for ${bibPath}`);
        delete this.bibEntries[bibPath];
    }
}
