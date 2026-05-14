import * as vscode from 'vscode';
import { detectArbFiles, type DetectedArbFile } from '../arb/detector';
import { parseArb, type ArbFile } from '../arb/parser';
import { buildCatalog, type Catalog } from '../model/catalog';
import { getStringboardHtml } from './html';

export default class StringboardPanel {
	public static currentPanel: StringboardPanel | undefined;

	private readonly panel: vscode.WebviewPanel;
	private disposables: vscode.Disposable[] = [];

	public static async createOrShow(_extensionUri: vscode.Uri): Promise<void> {
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

		const detectedFiles = await detectArbFiles();
		const { catalog } = await loadCatalog(detectedFiles);

		if (catalog) {
			console.log('Stringboard catalog:', {
				templateLocale: catalog.templateLocale,
				locales: catalog.locales,
				rows: catalog.rows.map(r => ({
					key: r.key,
					description: r.description,
					translations: Object.fromEntries(r.translations),
				})),
			});
		}

		StringboardPanel.currentPanel = new StringboardPanel(panel, detectedFiles, catalog);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		detectedFiles: DetectedArbFile[],
		catalog: Catalog | undefined,
	) {
		this.panel = panel;
		this.panel.webview.html = getStringboardHtml(detectedFiles, catalog);

		this.panel.webview.onDidReceiveMessage(
			(message: { type: string; payload?: unknown }) => {
				console.log('Stringboard message:', {
					type: message.type,
					payload: message.payload,
				});
			},
			null,
			this.disposables,
		);

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

async function loadCatalog(detectedFiles: DetectedArbFile[]): Promise<{ catalog: Catalog | undefined }> {
	if (detectedFiles.length === 0) {
		return { catalog: undefined };
	}

	const arbFiles: ArbFile[] = [];
	for (const detected of detectedFiles) {
		try {
			arbFiles.push(await parseArb(detected.uri));
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`Stringboard: failed to parse ${detected.uri.fsPath}: ${message}`);
		}
	}

	if (arbFiles.length === 0) {
		return { catalog: undefined };
	}

	const templateDetected = detectedFiles.find(f => f.isTemplate);
	const templateLocale = templateDetected?.locale ?? arbFiles[0].locale;

	return { catalog: buildCatalog(arbFiles, templateLocale) };
}
