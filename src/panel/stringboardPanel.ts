import * as vscode from 'vscode';
import { getStringboardHtml } from './html';

export default class StringboardPanel {
	public static currentPanel: StringboardPanel | undefined;

	private readonly panel: vscode.WebviewPanel;
	private disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri): void {
		const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

		if (StringboardPanel.currentPanel) {
			StringboardPanel.currentPanel.panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'stringboard',
			'Stringboard',
			column,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		StringboardPanel.currentPanel = new StringboardPanel(panel);
	}

	private constructor(panel: vscode.WebviewPanel) {
		this.panel = panel;
		this.panel.webview.html = getStringboardHtml();

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
	}

	private dispose(): void {
		StringboardPanel.currentPanel = undefined;
		this.panel.dispose();
		while (this.disposables.length) {
			this.disposables.pop()?.dispose();
		}
	}
}
