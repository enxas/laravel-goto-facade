"use strict";

import * as vscode from "vscode";
import FacadeLinkProvider from "./providers/facadeLinkProvider";

export function activate(context: vscode.ExtensionContext) {
	const link = vscode.languages.registerDocumentLinkProvider(
		{ scheme: "file", language: "php" },
		new FacadeLinkProvider()
	);

	context.subscriptions.push(link);
}
