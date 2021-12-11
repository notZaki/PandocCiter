import * as vscode from 'vscode'
import { Extension } from '../extension';

export class HoverProvider implements vscode.HoverProvider {
	extension: Extension;

	constructor(extension: Extension) {
		this.extension = extension;
	}

	public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {

		// look for an @ at the start of the current word (start) and the end of the current word or line (end)
		const startResult = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).match(/[\b@]/);
		const endResult = document.getText(new vscode.Range(position, new vscode.Position(position.line, 65535))).match(/$|\s/);
		if (startResult === null || endResult === null ||
			startResult.index === undefined || endResult.index === undefined ||
			startResult.index < 0 || endResult.index < 0) {
			return undefined;
		}

		const invoker = startResult[0];
		if (invoker !== '@') { return; }

		const line = document.getText(new vscode.Range(
			new vscode.Position(position.line, startResult.index + 1),
			new vscode.Position(position.line, position.character + endResult.index)
		)).trim()
		const cite = this.extension.completer.citation.getEntry(line);

		if (cite) {
			let md = cite.documentation || cite.detail;
			md = md.replace(/\n/g, '  \n'); // need double space then a newline to actually get a newline in markdown
			if (md) {
				return new vscode.Hover(md)
			}
		}

		return undefined;
	}
}