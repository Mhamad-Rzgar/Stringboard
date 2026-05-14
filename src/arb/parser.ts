import * as vscode from 'vscode';

export type ArbMetadata = {
	description?: string;
	placeholders?: Record<string, { type: string }>;
};

export type ArbFile = {
	locale: string;
	entries: Map<string, string>;
	metadata: Map<string, ArbMetadata>;
};

export async function parseArb(uri: vscode.Uri): Promise<ArbFile> {
	const bytes = await vscode.workspace.fs.readFile(uri);
	const text = new TextDecoder().decode(bytes);
	const parsed = JSON.parse(text) as Record<string, unknown>;

	let locale = '';
	const entries = new Map<string, string>();
	const metadata = new Map<string, ArbMetadata>();

	for (const [key, value] of Object.entries(parsed)) {
		if (key === '@@locale') {
			if (typeof value === 'string') {
				locale = value;
			}
			continue;
		}
		if (key.startsWith('@@')) {
			continue;
		}
		if (key.startsWith('@')) {
			const targetKey = key.slice(1);
			if (value !== null && typeof value === 'object') {
				metadata.set(targetKey, value as ArbMetadata);
			}
			continue;
		}
		if (typeof value === 'string') {
			entries.set(key, value);
		}
	}

	if (!locale) {
		locale = localeFromFilename(uri) ?? 'unknown';
	}

	return { locale, entries, metadata };
}

function localeFromFilename(uri: vscode.Uri): string | undefined {
	const basename = uri.path.split('/').pop() ?? '';
	const match = basename.match(/^.+?_([a-zA-Z]+(?:[_-][a-zA-Z]+)?)\.arb$/);
	return match?.[1];
}
