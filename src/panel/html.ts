export function getStringboardHtml(): string {
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
