# WPC Saved Parts List: Export & Copy

[한국어 문서](README_kr.md)

A Chromium extension that reads the WPC saved parts list from the current page DOM and provides three export options:

- **Copy for Google Sheets**: Copies a tab-separated table to the clipboard.
- **Download Excel (.xlsx)**: Preserves part numbers and PNCs as strings and applies number formatting to prices.
- **Download CSV**: Creates a CSV file with a UTF-8 BOM for reliable Korean text handling in Excel.

The extension does not read or store WPC credentials and does not send extracted data to an external server.

## Supported Site

- Saved parts list: `https://wpc.mobis.com/search/fullVinSearchPage.do?midx=3`

The extension runs only on `https://wpc.mobis.com/*`. It does **not** run on the login page at `https://www.mobis-as.com/wpc_login_new.do`; sign in there manually before opening the saved parts list.

## Local Installation

1. Open `chrome://extensions` in Chrome or another Chromium-based browser.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the current directory containing `manifest.json`.
5. Sign in to WPC and open the saved parts list.

After changing the code, reload the extension from the browser's extension management page and refresh the WPC page.

## Usage

1. Click **저장·복사** (Save/Copy) at the top of the WPC saved parts list.
2. Select an export option.
3. When using Google Sheets:
   - If you selected **Google 시트용 복사**, paste the clipboard into cell `A1` of an empty sheet with `Ctrl+V`.
   - If you selected **Excel(.xlsx) 다운로드**, import the downloaded file through **File → Import → Upload** in Google Sheets. Microsoft Excel is not required.

Quantities are read from the current input values at export time rather than from the original HTML `data-qty` attributes. Each row total is recalculated from its current quantity and unit price. Export status messages disappear automatically after 3 seconds.

## Output Columns

The exported headers are Korean:

`번호` (No.), `차량명칭` (Vehicle), `부품번호` (Part No.), `품명코드` (PNC), `부품명칭` (Part Name), `수량` (Quantity), `가격` (Unit Price), `계` (Total)

CSV and clipboard output protect strings that could otherwise be interpreted as spreadsheet formulas.

## Permissions

| Setting | Purpose |
|---|---|
| Content Script for `https://wpc.mobis.com/*` | Read the WPC saved parts list and display the export menu |
| `clipboardWrite` | Copy the table for pasting into Google Sheets |

The extension does not request `<all_urls>`, downloads permission, or tabs permission. Files are generated locally with Blob URLs and download links, and no data is sent to a remote server.

## Project Structure

```text
wpc_plugin/
├─ manifest.json
├─ content.js
├─ export.js
├─ styles.css
├─ .gitattributes
├─ LICENSE
├─ PRIVACY.md
├─ THIRD_PARTY_NOTICES.md
├─ README.md
├─ README_kr.md
├─ icons/
│  ├─ icon-16.png
│  ├─ icon-32.png
│  ├─ icon-48.png
│  └─ icon-128.png
└─ vendor/
   ├─ xlsx.full.min.js
   └─ SheetJS-LICENSE.txt
```

- `content.js`: Detects dynamically opened saved parts lists and provides the menu and status messages.
- `export.js`: Handles table extraction, CSV/TSV conversion, XLSX generation, clipboard copying, and file downloads.
- `vendor/xlsx.full.min.js`: SheetJS Community Edition 0.20.3, bundled with the extension instead of loaded from a remote CDN.

## License and Privacy

The original project code, icons, and documentation are provided under the [MIT License](LICENSE). Third-party components retain their own licenses.

SheetJS Community Edition 0.20.3 is distributed under Apache License 2.0. Its full license is preserved in `vendor/SheetJS-LICENSE.txt`, and the required attribution is provided in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The bundled library is unmodified.

The local data-handling policy is described in [PRIVACY.md](PRIVACY.md).

## Publishing to the Chrome Web Store

1. Test all three export options and quantity changes with an actual WPC account.
2. ZIP only the required files, with `manifest.json` at the archive root. Include `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `vendor/SheetJS-LICENSE.txt` in the distribution. Exclude `.git` and temporary test files.
3. Register a developer account in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Select **Add new item**, upload the ZIP, and complete the store listing, screenshots, privacy disclosures, permission justifications, and distribution settings.
5. Explain any WPC login requirements in the test instructions, then click **Submit for review**.

Official documentation:

- [Register a developer account](https://developer.chrome.com/docs/webstore/register)
- [Publish an extension](https://developer.chrome.com/docs/webstore/publish)

## WPC Markup Dependencies

The extension uses the following WPC HTML selectors. If WPC changes this markup, the extraction code must be updated accordingly.

- `#cartModalTbody`
- `.cart-btn-box`
- `.qtyText`
- Nine `td` cells per row
- The quantity input's `data-price` attribute
