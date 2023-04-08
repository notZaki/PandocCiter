import * as vscode from 'vscode'
import { Extension } from '../extension';

export class HoverProvider implements vscode.HoverProvider {
	extension: Extension;

	constructor(extension: Extension) {
		this.extension = extension;
	}

	public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
		// a cite key is an @ symbol followed by word characters (letters or numbers)
		const keyRange = document.getWordRangeAtPosition(position, /(?<=@)[\w\p{L}\p{M}]+/u);
		if (keyRange){
			const citeKey = document.getText(keyRange);
			const cite = this.extension.completer.citation.getEntry(citeKey);
			if (cite) {
				let hoverMarkdownText = cite.documentation || cite.detail;
				hoverMarkdownText = hoverMarkdownText.replace(/\n/g, '  \n'); // need double space then a newline to actually get a newline in markdown
				if (hoverMarkdownText) {
					return new vscode.Hover(hoverMarkdownText)
				}
			}
		}
	}
}
