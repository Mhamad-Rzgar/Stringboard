import * as assert from 'assert';
import type { ArbFile, ArbMetadata } from '../arb/parser';
import { buildCatalog } from './catalog';

function arbFile(
	locale: string,
	entries: Record<string, string>,
	metadata: Record<string, ArbMetadata> = {},
): ArbFile {
	return {
		locale,
		entries: new Map(Object.entries(entries)),
		metadata: new Map(Object.entries(metadata)),
	};
}

suite('buildCatalog', () => {
	test('rows follow the template locale key order', () => {
		const en = arbFile('en', { c: 'C', a: 'A', b: 'B' });
		const ar = arbFile('ar', { a: 'أ', b: 'ب', c: 'ج' });
		const catalog = buildCatalog([en, ar], 'en');
		assert.deepStrictEqual(catalog.rows.map(r => r.key), ['c', 'a', 'b']);
	});

	test('locales: template first, then alphabetical', () => {
		const en = arbFile('en', { x: 'X' });
		const ku = arbFile('ku', { x: 'X' });
		const ar = arbFile('ar', { x: 'X' });
		const catalog = buildCatalog([en, ku, ar], 'en');
		assert.deepStrictEqual(catalog.locales, ['en', 'ar', 'ku']);
	});

	test('missing translation in non-template locale defaults to empty string', () => {
		const en = arbFile('en', { hello: 'Hello', goodbye: 'Goodbye' });
		const ar = arbFile('ar', { hello: 'مرحبا' });
		const catalog = buildCatalog([en, ar], 'en');
		const goodbye = catalog.rows.find(r => r.key === 'goodbye');
		assert.strictEqual(goodbye?.translations.get('ar'), '');
		assert.strictEqual(goodbye?.translations.get('en'), 'Goodbye');
	});

	test('every row has an entry for every locale', () => {
		const en = arbFile('en', { hello: 'Hello' });
		const ar = arbFile('ar', { hello: 'مرحبا' });
		const ku = arbFile('ku', {});
		const catalog = buildCatalog([en, ar, ku], 'en');
		const row = catalog.rows[0];
		assert.deepStrictEqual([...row.translations.keys()].sort(), ['ar', 'en', 'ku']);
		assert.strictEqual(row.translations.get('ku'), '');
	});

	test('description pulled from template metadata', () => {
		const en = arbFile(
			'en',
			{ login: 'Log in' },
			{ login: { description: 'Login button label' } },
		);
		const catalog = buildCatalog([en], 'en');
		assert.strictEqual(catalog.rows[0].description, 'Login button label');
	});

	test('keys only present in non-template files are ignored', () => {
		const en = arbFile('en', { hello: 'Hello' });
		const ar = arbFile('ar', { hello: 'مرحبا', extra: 'إضافي' });
		const catalog = buildCatalog([en, ar], 'en');
		assert.deepStrictEqual(catalog.rows.map(r => r.key), ['hello']);
	});

	test('returns empty catalog when template locale is not present', () => {
		const ar = arbFile('ar', { hello: 'مرحبا' });
		const catalog = buildCatalog([ar], 'en');
		assert.deepStrictEqual(catalog, {
			templateLocale: 'en',
			locales: [],
			rows: [],
		});
	});
});
