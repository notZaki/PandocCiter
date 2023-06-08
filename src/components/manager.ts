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
import yaml = require('js-yaml');

import {Extension} from '../extension';

export class Manager {
    extension: Extension;
    bibWatcher: chokidar.FSWatcher;
    watched: string[];

    constructor(extension: Extension) {
        this.extension = extension;
        this.watched   = [];
    }

    findBib() : void {
        let foundFiles: string[] = [];

        const docURI = vscode.window.activeTextEditor!.document.uri;
        const configuration = vscode.workspace.getConfiguration('PandocCiter', docURI);
        const rootFolder = vscode.workspace.getWorkspaceFolder(docURI).uri.fsPath;
        
        const activeText = vscode.window.activeTextEditor!.document.getText();
        const yamltext = activeText.match(/---\r?\n((.+\r?\n)+)---/gm)
        const parsedyaml = yaml.loadAll(yamltext)[0]
        if (parsedyaml && parsedyaml.bibliography) {
            const bibInYaml = yaml.loadAll(yamltext)[0].bibliography
            const bibFiles = (bibInYaml instanceof Array ? bibInYaml : [bibInYaml]);
            for (let i in bibFiles) {
                let bibFile = this.stripQuotes(bibFiles[i]);
                bibFile = this.resolveBibFile(bibFile, rootFolder);
                this.extension.log(`Looking for file: ${bibFile}`);
                this.addBibToWatcher(bibFile);
                foundFiles.push(bibFile);
            }
        }
        const rootfile: string = configuration.get('RootFile')
        if (rootfile !== "") {
            let curInput = path.join(rootfile);
            if (!path.isAbsolute(curInput)) { 
                curInput = path.join(rootFolder, rootfile);
            }
            const rootText = fs.readFileSync(curInput,'utf8');
            const bibInYaml = yaml.loadAll(rootText)[0].bibliography
            const bibFiles = (bibInYaml instanceof Array ? bibInYaml : [bibInYaml]);
            for (let i in bibFiles) {
                let bibFile = path.join(path.dirname(curInput), bibFiles[i]);
                bibFile = this.resolveBibFile(bibFile, rootFolder);
                this.extension.log(`Looking for file: ${bibFile}`);
                this.addBibToWatcher(bibFile);
                foundFiles.push(bibFile);
            }
        }
        if (configuration.get('UseDefaultBib') && (configuration.get('DefaultBib'))) {
            let bibFile = path.join(configuration.get('DefaultBib'));
            bibFile = this.resolveBibFile(bibFile, rootFolder);
            this.extension.log(`Looking for file: ${bibFile}`);
            this.addBibToWatcher(bibFile);
            foundFiles.push(bibFile);
        }
        if (configuration.get('UseDefaultBib') && (configuration.get('DefaultBibs'))) {
            let bibFiles: string[] = configuration.get('DefaultBibs');
            bibFiles.forEach(element => {
                let bibFile = this.resolveBibFile(path.join(element), rootFolder);
                this.extension.log(`Looking for file: ${bibFile}`);
                this.addBibToWatcher(bibFile);
                foundFiles.push(bibFile); 
            });
        }
        let watched_but_not_found = this.watched.filter(e => !foundFiles.includes(e));
        if (configuration.get('ForgetUnusedBib')) {
            if (watched_but_not_found.length > 0) {
                this.forgetUnusedFiles(watched_but_not_found);
            }
        }
        return;
    }

    stripQuotes(inputString: string) {
        if (inputString[0] === inputString[inputString.length-1] && "\"'".includes(inputString[0])) {
            return inputString.slice(1, -1);
        } else {
            return inputString;
        }
    }

    resolveBibFile(bibFile: string, rootFolder: string) {
        if (path.isAbsolute(bibFile)) {
            return bibFile;
        } else { 
            return path.resolve(path.join(rootFolder, bibFile));
        }
    }

    addBibToWatcher(bibPath: string) {
        if (!fs.existsSync(bibPath) && fs.existsSync(bibPath + '.json')) {
            bibPath += '.json';
        }
        if (!fs.existsSync(bibPath) && fs.existsSync(bibPath + '.bib')) {
            bibPath += '.bib';
        }
        if (fs.existsSync(bibPath)) {
            this.extension.log(`Found file ${bibPath}`);
            if (this.bibWatcher === undefined) {
                this.extension.log(`Creating file watcher for files.`);
                this.bibWatcher = chokidar.watch(bibPath, {awaitWriteFinish: true});
                this.bibWatcher.on('change', (filePath: string) => {
                    this.extension.log(`Bib file watcher - responding to change in ${filePath}`);
                    this.extension.completer.citation.parseBibFile(filePath);
                });
                this.bibWatcher.on('unlink', (filePath: string) => {
                    this.extension.log(`Bib file watcher: ${filePath} deleted.`);
                    this.extension.completer.citation.forgetParsedBibItems(filePath);
                    this.bibWatcher.unwatch(filePath);
                    this.watched.splice(this.watched.indexOf(filePath), 1);
                });
                this.extension.completer.citation.parseBibFile(bibPath);
            } else if (this.watched.indexOf(bibPath) < 0) {
                this.extension.log(`Adding file ${bibPath} to bib file watcher.`);
                this.bibWatcher.add(bibPath);
                this.watched.push(bibPath);
                this.extension.completer.citation.parseBibFile(bibPath);
            } else {
                this.extension.log(`bib file ${bibPath} is already being watched.`);
            }
        }
    }

    forgetUnusedFiles(filesToForget: string[]) {
        for (let i in filesToForget) {
            let filePath = filesToForget[i];
            this.extension.log(`Forget unused bib file: ${filePath}`);
            this.extension.completer.citation.forgetParsedBibItems(filePath);
            this.bibWatcher.unwatch(filePath);
            this.watched.splice(this.watched.indexOf(filePath), 1);
        }
        return;
    }

}