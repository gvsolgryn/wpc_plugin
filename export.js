(() => {
  'use strict';

  const HEADERS = Object.freeze([
    '번호',
    '차량명칭',
    '부품번호',
    '품명코드',
    '부품명칭',
    '수량',
    '가격',
    '계'
  ]);

  const FILES = Object.freeze({
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv;charset=utf-8'
  });

  function cleanText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function parseNumber(value, fieldName, rowNumber) {
    const normalized = String(value ?? '').replace(/,/g, '').trim();
    const number = normalized === '' ? Number.NaN : Number(normalized);

    if (!Number.isFinite(number)) {
      throw new Error(`${rowNumber}번 행의 ${fieldName} 값이 올바르지 않습니다.`);
    }

    return number;
  }

  function extractCartRows(doc = document) {
    const tbody = doc.getElementById('cartModalTbody');
    if (!tbody) {
      throw new Error('보관목록을 찾을 수 없습니다. 보관목록 창을 먼저 열어 주세요.');
    }

    return Array.from(tbody.querySelectorAll(':scope > tr'), (row, index) => {
      const cells = row.querySelectorAll(':scope > td');
      const rowNumber = index + 1;

      if (cells.length < 9) {
        throw new Error(`${rowNumber}번 행의 표 구조가 변경되어 읽을 수 없습니다.`);
      }

      const quantityInput = cells[6].querySelector('.qtyText');
      if (!quantityInput) {
        throw new Error(`${rowNumber}번 행에서 수량 입력란을 찾을 수 없습니다.`);
      }

      const quantity = parseNumber(quantityInput.value, '수량', rowNumber);
      const unitPrice = parseNumber(
        quantityInput.getAttribute('data-price') || cells[7].textContent,
        '가격',
        rowNumber
      );

      if (quantity <= 0) {
        throw new Error(`${rowNumber}번 행의 수량은 0보다 커야 합니다.`);
      }
      if (unitPrice < 0) {
        throw new Error(`${rowNumber}번 행의 가격은 0 이상이어야 합니다.`);
      }

      const displayedNumber = Number.parseInt(cleanText(cells[1].textContent), 10);

      return {
        no: Number.isFinite(displayedNumber) ? displayedNumber : rowNumber,
        carName: cleanText(cells[2].textContent),
        partNumber: cleanText(cells[3].textContent),
        pnc: cleanText(cells[4].textContent),
        partName: cleanText(cells[5].textContent),
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice
      };
    });
  }

  function toArray(row) {
    return [
      row.no,
      row.carName,
      row.partNumber,
      row.pnc,
      row.partName,
      row.quantity,
      row.unitPrice,
      row.totalPrice
    ];
  }

  // Spreadsheet applications can interpret text beginning with these characters as formulas.
  function protectText(value) {
    return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (typeof value === 'string') {
      text = protectText(text);
    }
    if (/[",\r\n]/.test(text)) {
      text = `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function createCsv(rows) {
    const lines = [HEADERS, ...rows.map(toArray)];
    return `\uFEFF${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n`;
  }

  function tsvCell(value) {
    const text = String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
    return typeof value === 'string' ? protectText(text) : text;
  }

  function createTsv(rows) {
    const lines = [HEADERS, ...rows.map(toArray)];
    return lines.map((line) => line.map(tsvCell).join('\t')).join('\r\n');
  }

  function timestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  }

  function downloadCsv(rows) {
    const filename = `WPC_보관목록_${timestamp()}.csv`;
    return downloadBlob(new Blob([createCsv(rows)], { type: FILES.csv }), filename);
  }

  function createWorkbook(rows) {
    if (!globalThis.XLSX) {
      throw new Error('Excel 변환 라이브러리를 불러오지 못했습니다.');
    }

    const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows.map(toArray)]);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 18 },
      { wch: 14 },
      { wch: 42 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 }
    ];
    worksheet['!autofilter'] = { ref: worksheet['!ref'] };

    rows.forEach((row, index) => {
      const sheetRow = index + 2;
      for (const column of ['C', 'D']) {
        const cell = worksheet[`${column}${sheetRow}`];
        if (cell) cell.z = '@';
      }
      for (const column of ['G', 'H']) {
        const cell = worksheet[`${column}${sheetRow}`];
        if (cell) cell.z = '#,##0';
      }
    });

    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: 'WPC 보관목록',
      Subject: 'WPC 부품 보관목록',
      Creator: 'WPC 보관목록 저장·복사',
      CreatedDate: new Date()
    };
    XLSX.utils.book_append_sheet(workbook, worksheet, '보관목록');
    return workbook;
  }

  function downloadXlsx(rows) {
    const workbook = createWorkbook(rows);
    const output = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true
    });
    const filename = `WPC_보관목록_${timestamp()}.xlsx`;
    return downloadBlob(new Blob([output], { type: FILES.xlsx }), filename);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fall through for browsers that deny asynchronous clipboard access in content scripts.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();

    if (!copied) {
      throw new Error('클립보드 복사가 차단되었습니다. 브라우저의 클립보드 권한을 확인해 주세요.');
    }
  }

  async function copyForGoogleSheets(rows) {
    await copyText(createTsv(rows));
  }

  globalThis.WpcCartExport = Object.freeze({
    HEADERS,
    extractCartRows,
    createCsv,
    createTsv,
    createWorkbook,
    downloadCsv,
    downloadXlsx,
    copyForGoogleSheets
  });
})();
