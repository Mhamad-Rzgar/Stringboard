import type { ArbFile } from '../arb/parser';

export type CatalogRow = {
	key: string;
	description?: string;
	translations: Map<string, string>;
};

export type Catalog = {
	templateLocale: string;
	locales: string[];
	rows: CatalogRow[];
};

export function buildCatalog(arbFiles: ArbFile[], templateLocale: string): Catalog {
	const template = arbFiles.find(f => f.locale === templateLocale);
	if (!template) {
		return { templateLocale, locales: [], rows: [] };
	}

	const otherLocales = arbFiles
		.map(f => f.locale)
		.filter(l => l !== templateLocale)
		.sort((a, b) => a.localeCompare(b));
	const locales = [templateLocale, ...otherLocales];

	const filesByLocale = new Map(arbFiles.map(f => [f.locale, f]));

	const rows: CatalogRow[] = [];
	for (const key of template.entries.keys()) {
		const translations = new Map<string, string>();
		for (const locale of locales) {
			const file = filesByLocale.get(locale);
			translations.set(locale, file?.entries.get(key) ?? '');
		}
		const description = template.metadata.get(key)?.description;
		rows.push({ key, description, translations });
	}

	return { templateLocale, locales, rows };
}
