import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Stringboard extension activated.');

	const openCommand = vscode.commands.registerCommand('stringboard.open', () => {
		StringboardPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(openCommand);
}

export function deactivate() { }

class StringboardPanel {
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
		this.panel.webview.html = this.getHtml();

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
	}

	private dispose(): void {
		StringboardPanel.currentPanel = undefined;
		this.panel.dispose();
		while (this.disposables.length) {
			this.disposables.pop()?.dispose();
		}
	}

	private getHtml(): string {
		return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Stringboard</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 32px;
          }
          h1 { font-size: 20px; font-weight: 500; margin: 0 0 8px; }
          p  { font-size: 13px; color: var(--vscode-descriptionForeground); margin: 0; }
          .placeholder {
            margin-top: 32px;
            padding: 24px;
            border: 1px dashed var(--vscode-panel-border);
            border-radius: 6px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
          }
        </style>
      </head>
      <body>
        <h1>Stringboard</h1>
        <p>Visual editor for Flutter translation files.</p>

        <div class="placeholder">
          The spreadsheet grid will live here. Next session: scan the project's <code>lib/l10n/</code> folder
          for <code>.arb</code> files and render them as rows × columns.
        </div>
      </body>
      </html>
    `;
	}
}