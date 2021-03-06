'use strict';

import * as vscode from 'vscode';

import {Manager} from './components/manager';
import {Completer} from './providers/completion';

export function activate(context: vscode.ExtensionContext) {
    const extension = new Extension();

    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(() => {
        extension.log("Reacting to document open")
        if (vscode.window.activeTextEditor) {
            extension.manager.findBib();
        }
    }));

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        extension.log("Reacting to active document change")
        if ((vscode.window.activeTextEditor) && 
            (['markdown', 'rmd', 'pweave_md'].includes(vscode.window.activeTextEditor.document.languageId))) {
            extension.manager.findBib();
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
        extension.log("Reacting to document save")
        if (vscode.window.activeTextEditor) {
            extension.manager.findBib();
        }
    }));

    extension.manager.findBib();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        {scheme: 'file', language: 'markdown'}, 
        extension.completer, '@'));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        {scheme: 'file', language: 'rmd'}, 
        extension.completer, '@'));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        {scheme: 'file', language: 'pweave_md'}, 
        extension.completer, '@'));
}

export class Extension {
    manager: Manager;
    completer: Completer;
    logPanel: vscode.OutputChannel;

    constructor() {
        this.manager = new Manager(this);
        this.completer = new Completer(this);
        this.logPanel = vscode.window.createOutputChannel('PandocCiter');
        this.log(`PandocCiter is now activated`);
    }
    
    log(msg: string) {
        if (vscode.workspace.getConfiguration('PandocCiter').get('ShowLog')) {
            this.logPanel.append(`${msg}\n`);
        }
    }

}


export function deactivate() {
}