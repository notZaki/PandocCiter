import * as vscode from 'vscode';
import { Extension } from '../extension';

export class DefinitionProvider implements vscode.DefinitionProvider {
	extension: Extension;

	constructor(extension: Extension) {
		this.extension = extension
	}

	provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location | undefined {
		// a cite key is an @ symbol followed by word characters (letters or numbers)
		const keyRange = document.getWordRangeAtPosition(position, /(?<=@)\w+/);
		if (keyRange){
			const citeKey = document.getText(keyRange);
			const cite = this.extension.completer.citation.getEntry(citeKey);
			if (cite) {
				return new vscode.Location(vscode.Uri.file(cite.file), cite.position);
			}
		}
	}
}