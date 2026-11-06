(() => {
  'use strict';

  const CONTROLS_ID = 'wpc-cart-export-controls';
  const STATUS_VISIBLE_MS = 3000;
  const statusTimers = new WeakMap();
  const Exporter = globalThis.WpcCartExport;

  function setStatus(controls, message, isError = false) {
    window.clearTimeout(statusTimers.get(controls));

    const status = controls.querySelector('.wpc-cart-export__status');
    status.textContent = message;
    status.classList.toggle('wpc-cart-export__status--error', isError);

    if (!message) {
      statusTimers.delete(controls);
      return;
    }

    statusTimers.set(controls, window.setTimeout(() => {
      status.textContent = '';
      status.classList.remove('wpc-cart-export__status--error');
      statusTimers.delete(controls);
    }, STATUS_VISIBLE_MS));
  }

  async function runExport(controls, action) {
    const buttons = controls.querySelectorAll('button[data-export-action]');
    buttons.forEach((button) => {
      button.disabled = true;
    });

    try {
      const rows = Exporter.extractCartRows(document);
      if (rows.length === 0) {
        throw new Error('저장할 보관목록 항목이 없습니다.');
      }

      let message;
      if (action === 'google-sheets') {
        await Exporter.copyForGoogleSheets(rows);
        message = `${rows.length}건 복사 완료 — 구글 시트에 Ctrl+V`;
      } else if (action === 'xlsx') {
        const filename = Exporter.downloadXlsx(rows);
        message = `${rows.length}건 Excel 저장 완료`;
        console.info(`[WPC 보관목록] ${filename} 생성`);
      } else if (action === 'csv') {
        const filename = Exporter.downloadCsv(rows);
        message = `${rows.length}건 CSV 저장 완료`;
        console.info(`[WPC 보관목록] ${filename} 생성`);
      } else {
        return;
      }

      controls.querySelector('details').open = false;
      setStatus(controls, message);
    } catch (error) {
      console.error('[WPC 보관목록] 저장·복사 실패:', error);
      setStatus(controls, error instanceof Error ? error.message : '저장·복사에 실패했습니다.', true);
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  function createControls() {
    const controls = document.createElement('div');
    controls.id = CONTROLS_ID;
    controls.className = 'wpc-cart-export';
    controls.innerHTML = `
      <details class="wpc-cart-export__details">
        <summary class="wpc-cart-export__summary" title="보관목록을 다른 프로그램으로 옮깁니다">저장·복사</summary>
        <div class="wpc-cart-export__menu" role="group" aria-label="보관목록 저장·복사 형식">
          <button type="button" data-export-action="google-sheets" title="복사 후 Google 스프레드시트에서 Ctrl+V를 누르세요">
            Google 시트용 복사
          </button>
          <button type="button" data-export-action="xlsx" title="Excel 및 Google 스프레드시트에서 사용할 수 있는 XLSX 파일">
            Excel(.xlsx) 다운로드
          </button>
          <button type="button" data-export-action="csv" title="UTF-8 BOM이 적용된 CSV 파일">
            CSV 다운로드
          </button>
        </div>
      </details>
      <span class="wpc-cart-export__status" role="status" aria-live="polite"></span>
    `;

    controls.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-export-action]');
      if (button) {
        void runExport(controls, button.dataset.exportAction);
      }
    });

    return controls;
  }

  function attachControls() {
    const tbody = document.getElementById('cartModalTbody');
    if (!tbody) return;

    const layer = tbody.closest('.layer-box');
    const buttonBox = layer?.querySelector('.cart-btn-box');
    if (!buttonBox || buttonBox.querySelector(`#${CONTROLS_ID}`)) return;

    buttonBox.appendChild(createControls());
  }

  let scheduled = false;
  function scheduleAttach() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      attachControls();
    });
  }

  document.addEventListener('click', (event) => {
    const controls = document.getElementById(CONTROLS_ID);
    const details = controls?.querySelector('details');
    if (details?.open && !controls.contains(event.target)) {
      details.open = false;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const details = document.querySelector(`#${CONTROLS_ID} details`);
    if (details?.open) {
      details.open = false;
      details.querySelector('summary')?.focus();
    }
  });

  const observer = new MutationObserver(scheduleAttach);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  attachControls();
})();
