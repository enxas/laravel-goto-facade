"use strict";

import {
	DocumentLinkProvider,
	TextDocument,
	DocumentLink,
	workspace,
	Position,
	Range,
	Uri,
} from "vscode";
import path from "path";
import fs from 'fs';

export default class FacadeLinkProvider implements DocumentLinkProvider {
	public async provideDocumentLinks(
		doc: TextDocument
	): Promise<DocumentLink[]> {
		const documentLinks = [];
		const reg = /(\w+)::(\w+)/g;
		const linesCount = doc.lineCount;

		for (let index = 0; index < linesCount; index++) {
			const line = doc.lineAt(index);
			const result = reg.exec(line.text);

			if (result) {
				const [_, facadeClass, facadeMethod] = result;
				const facadeReg = new RegExp(`use Facades\\\\(.+?)\\\\${facadeClass};`);
				const res = doc.getText().match(facadeReg);

				if (res) {
					const workspaceFolder =
						workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath || "";

					// turn first letter to lowercase
					const str = res[1].charAt(0).toLowerCase() + res[1].slice(1);
					// replace backslashes
					const facadePath = str.replace(/\\/g, "/");

					const filePath = path.normalize(
						path.join(workspaceFolder, facadePath, `${facadeClass}.php`)
					);

					if (!fs.existsSync(filePath)) {
						continue;
					}

					// Open the target document
					const targetDoc = await workspace.openTextDocument(filePath);
					const text = targetDoc.getText();
					const facadeMethodReg = new RegExp(`function ${facadeMethod}`, "g");
					let match;

					while ((match = facadeMethodReg.exec(text)) !== null) {
						const thisline = targetDoc.positionAt(match.index).line;

						// Create a link in the current document pointing to the target file and line
						const startPos = new Position(
							line.lineNumber,
							line.text.indexOf(facadeClass)
						);
						const endPos = startPos.translate(0, facadeClass.length);

						const startPos2 = endPos.translate(0, 2);
						const endPos2 = startPos2.translate(0, facadeMethod.length);
						const linkUri = Uri.file(filePath).with({
							fragment: (thisline + 1).toString(),
						});
						const link2 = new DocumentLink(
							new Range(startPos2, endPos2),
							linkUri
						);

						documentLinks.push(link2);
					}
				}
			}
		}

		return documentLinks;
	}
}
