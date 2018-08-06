// This file is adapted from https://github.com/James-Yu/LaTeX-Workshop/blob/master/src/components/manager.ts
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
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

import {Extension} from '../extension';

export class Manager {
    extension: Extension;
    rootFiles: object;
    workspace: string;
    texFileTree: { [id: string]: Set<string> } = {};
    fileWatcher: chokidar.FSWatcher;
    bibWatcher: chokidar.FSWatcher;
    watched: string[];

    constructor(extension: Extension) {
        this.extension = extension;
        this.watched   = [];
        this.rootFiles = {};
        this.workspace = '';
    }

    findBib() : void {
        const bibRegex = /^bibliography:\s* \[(.*)\]/m;
        const activeText = vscode.window.activeTextEditor!.document.getText();
        const bibresult = activeText.match(bibRegex);
        if (bibresult) {
            const bibFiles = bibresult[1].split(',').map(item => item.trim());
            for (let i in bibFiles) {
                let bibFile = path.resolve(path.dirname(vscode.window.activeTextEditor!.document.fileName), bibFiles[i]);
                if (this.extension.showLog) {console.log('Looking for .bib file: ' + bibFile);}
                this.addBibToWatcher(bibFile);
            }
        }
        return;
    }

    get rootDir() {
        return path.dirname(this.rootFile);
    }

    get rootFile() {
        return this.rootFiles[this.workspace];
    }

    set rootFile(root: string) {
        this.rootFiles[this.workspace] = root;
    }

    addBibToWatcher(bib: string) {
        let bibPath;
        if (path.isAbsolute(bib)) {
            bibPath = bib;
        } else {
            bibPath = path.resolve(path.join(this.rootDir, bib));
        }
        if (path.extname(bibPath) === '') {
            bibPath += '.bib';
        }
        if (!fs.existsSync(bibPath) && fs.existsSync(bibPath + '.bib')) {
            bibPath += '.bib';
        }
        if (fs.existsSync(bibPath)) {
            if (this.extension.showLog) {console.log(`Found .bib file ${bibPath}`);}
            if (this.bibWatcher === undefined) {
                if (this.extension.showLog) {console.log(`Creating file watcher for .bib files.`);}
                this.bibWatcher = chokidar.watch(bibPath);
                this.bibWatcher.on('change', (filePath: string) => {
                    if (this.extension.showLog) {console.log(`Bib file watcher - responding to change in ${filePath}`);}
                    this.extension.completer.citation.parseBibFile(filePath);
                });
                this.bibWatcher.on('unlink', (filePath: string) => {
                    if (this.extension.showLog) {console.log(`Bib file watcher: ${filePath} deleted.`);}
                    this.extension.completer.citation.forgetParsedBibItems(filePath);
                    this.bibWatcher.unwatch(filePath);
                    this.watched.splice(this.watched.indexOf(filePath), 1);
                });
                this.extension.completer.citation.parseBibFile(bibPath);
            } else if (this.watched.indexOf(bibPath) < 0) {
                if (this.extension.showLog) {console.log(`Adding .bib file ${bibPath} to bib file watcher.`);}
                this.bibWatcher.add(bibPath);
                this.watched.push(bibPath);
                this.extension.completer.citation.parseBibFile(bibPath);
            } else {
                if (this.extension.showLog) {console.log(`.bib file ${bibPath} is already being watched.`);}
            }
        }
    }
}