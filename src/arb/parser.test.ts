import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { parseArb } from './parser';

suite('parseArb', () => {
	let tmpDir: string;

	setup(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stringboard-parser-'));
	});

	teardown(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	async function writeArb(filename: string, content: unknown): Promise<vscode.Uri> {
		const filePath = path.join(tmpDir, filename);
		await fs.writeFile(filePath, JSON.stringify(content, null, 2));
		return vscode.Uri.file(filePath);
	}

	test('records @@locale into locale field and skips it from entries', async () => {
		const uri = await writeArb('app_en.arb', {
			'@@locale': 'en',
			hello: 'Hello',
		});
		const file = await parseArb(uri);
		assert.strictEqual(file.locale, 'en');
		assert.ok(!file.entries.has('@@locale'));
	});

	test('puts string entries into entries map', async () => {
		const uri = await writeArb('app_en.arb', {
			'@@locale': 'en',
			hello: 'Hello',
			goodbye: 'Goodbye',
		});
		const file = await parseArb(uri);
		assert.strictEqual(file.entries.size, 2);
		assert.strictEqual(file.entries.get('hello'), 'Hello');
		assert.strictEqual(file.entries.get('goodbye'), 'Goodbye');
	});

	test('groups @key entries into metadata map for corresponding key', async () => {
		const uri = await writeArb('app_en.arb', {
			'@@locale': 'en',
			login: 'Log in',
			'@login': {
				description: 'Login button',
				placeholders: { name: { type: 'String' } },
			},
		});
		const file = await parseArb(uri);
		const meta = file.metadata.get('login');
		assert.strictEqual(meta?.description, 'Login button');
		assert.strictEqual(meta?.placeholders?.name.type, 'String');
		assert.ok(!file.entries.has('@login'));
	});

	test('skips other @@ file-level metadata', async () => {
		const uri = await writeArb('app_en.arb', {
			'@@locale': 'en',
			'@@last_modified': '2026-01-01',
			hello: 'Hello',
		});
		const file = await parseArb(uri);
		assert.strictEqual(file.entries.size, 1);
		assert.strictEqual(file.metadata.size, 0);
	});

	test('preserves insertion order of entries', async () => {
		const uri = await writeArb('app_en.arb', {
			'@@locale': 'en',
			c: 'C',
			a: 'A',
			b: 'B',
		});
		const file = await parseArb(uri);
		assert.deepStrictEqual([...file.entries.keys()], ['c', 'a', 'b']);
	});

	test('falls back to filename locale when @@locale is missing', async () => {
		const uri = await writeArb('app_ar.arb', { hello: 'مرحبا' });
		const file = await parseArb(uri);
		assert.strictEqual(file.locale, 'ar');
	});
});
