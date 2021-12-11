import * as vscode from 'vscode';
import { Extension } from '../extension';
import * as fs from 'fs';

export class DefinitionProvider implements vscode.DefinitionProvider {
	extension: Extension;

	constructor(extension: Extension) {
		this.extension = extension
	}

	provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location | undefined {
		// look for an @ at the start of the current word (start) and the end of the current word or line (end)
		const startResult = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).match(/[\b@]\w*$/);
		const endResult = document.getText(new vscode.Range(position, new vscode.Position(position.line, 65535))).match(/$|\s/);
		if (startResult === null || endResult === null ||
			startResult.index === undefined || endResult.index === undefined ||
			startResult.index < 0 || endResult.index < 0) {
			return undefined;
		}

		const invoker = startResult[0][0];
		if (invoker !== '@') { return; }

		const line = document.getText(new vscode.Range(
			new vscode.Position(position.line, startResult.index + 1),
			new vscode.Position(position.line, position.character + endResult.index)
		)).trim()
		const cite = this.extension.completer.citation.getEntry(line);
		if (cite) {
			return new vscode.Location( vscode.Uri.file(cite.file), cite.position )
		}
	}
}