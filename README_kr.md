# WPC 보관목록 저장·복사

[English documentation](README.md)

WPC 보관목록을 현재 화면의 DOM에서 읽어 다음 세 가지 형식으로 옮기는 Chromium 확장 프로그램입니다.

- **Google 시트용 복사**: 탭으로 구분한 표를 클립보드에 복사합니다.
- **Excel(.xlsx) 다운로드**: 부품번호와 품명코드를 문자열로 저장하고 금액에 숫자 서식을 적용합니다.
- **CSV 다운로드**: Excel의 한글 인식을 위해 UTF-8 BOM을 포함한 CSV를 생성합니다.

WPC 로그인 정보를 읽거나 저장하지 않으며, 추출한 데이터를 외부 서버로 전송하지 않습니다.

## 적용 사이트

- 보관목록: `https://wpc.mobis.com/search/fullVinSearchPage.do?midx=3`

확장 프로그램은 `https://wpc.mobis.com/*`에서만 실행됩니다. 로그인 사이트인 `https://www.mobis-as.com/wpc_login_new.do`에서는 실행되지 않으며, 로그인은 해당 페이지에서 직접 진행합니다.

## 로컬 설치

1. Chrome 또는 Chromium 기반 브라우저에서 `chrome://extensions`를 엽니다.
2. **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 선택합니다.
4. `manifest.json`이 있는 현재 디렉터리를 선택합니다.
5. WPC에 로그인한 뒤 보관목록 창을 엽니다.

코드를 변경한 경우 확장 프로그램 관리 페이지에서 확장 프로그램을 새로고침하고 WPC 페이지도 새로고침합니다.

## 사용 방법

1. WPC 보관목록 창 상단의 **저장·복사** 버튼을 클릭합니다.
2. 원하는 출력 방식을 선택합니다.
3. Google 스프레드시트를 사용하는 경우:
   - **Google 시트용 복사**를 선택했다면 빈 시트의 `A1` 셀에서 `Ctrl+V`를 누릅니다.
   - **Excel(.xlsx) 다운로드**를 선택했다면 Google 스프레드시트의 **파일 → 가져오기 → 업로드**로 파일을 가져올 수 있습니다. Microsoft Excel은 필요하지 않습니다.

수량은 HTML의 원래 `data-qty` 값이 아니라 출력할 때 입력란에 표시된 현재 값을 사용합니다. 행 합계는 현재 수량과 단가를 곱해 다시 계산합니다. 출력 결과 메시지는 3초 후 자동으로 사라집니다.

## 출력 열

`번호`, `차량명칭`, `부품번호`, `품명코드`, `부품명칭`, `수량`, `가격`, `계`

CSV와 클립보드 출력에서는 스프레드시트가 외부 텍스트를 수식으로 실행하지 않도록 위험한 문자로 시작하는 문자열을 보호합니다.

## 권한

| 설정 | 이유 |
|---|---|
| `https://wpc.mobis.com/*` Content Script | WPC 보관목록 읽기와 저장·복사 메뉴 표시 |
| `clipboardWrite` | Google 스프레드시트 붙여넣기용 표 복사 |

모든 사이트 접근 권한(`<all_urls>`), 다운로드 권한, 탭 권한, 원격 서버는 사용하지 않습니다. 파일 다운로드는 브라우저의 Blob URL과 다운로드 링크로 생성합니다.

## 프로젝트 구조

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

- `content.js`: 동적으로 열리는 보관목록을 감지하고 메뉴와 상태 메시지를 제공합니다.
- `export.js`: 표 추출, CSV/TSV 변환, XLSX 생성, 클립보드 복사와 파일 다운로드를 담당합니다.
- `vendor/xlsx.full.min.js`: SheetJS Community Edition 0.20.3. 외부 CDN 실행 없이 확장 프로그램에 포함했습니다.

## 라이선스 및 개인정보 처리방침

프로젝트의 원본 코드, 아이콘, 문서는 [MIT License](LICENSE)로 제공합니다. 외부 오픈소스 구성 요소에는 각 구성 요소의 라이선스가 그대로 적용됩니다.

SheetJS Community Edition 0.20.3은 Apache License 2.0으로 배포됩니다. 전체 라이선스는 `vendor/SheetJS-LICENSE.txt`에 보존하고, 필수 출처 고지는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 포함했습니다. 포함된 라이브러리는 수정하지 않았습니다.

로컬 데이터 처리 방식은 [PRIVACY.md](PRIVACY.md)에서 확인할 수 있습니다.

## Chrome Web Store 배포

1. 실제 WPC 계정으로 세 가지 출력 방식과 수량 변경 동작을 검증합니다.
2. `manifest.json`이 ZIP 최상단에 오도록 필요한 파일만 압축합니다. 배포 ZIP에는 `LICENSE`, `THIRD_PARTY_NOTICES.md`, `vendor/SheetJS-LICENSE.txt`를 반드시 포함하고 `.git`과 검증용 임시 파일은 제외합니다.
3. [Chrome Web Store 개발자 대시보드](https://chrome.google.com/webstore/devconsole)에서 개발자 계정을 등록합니다.
4. **새 항목 추가**로 ZIP을 업로드하고 스토어 설명, 스크린샷, 개인정보 처리 방식, 권한 사유, 배포 범위를 입력합니다.
5. WPC 로그인이 필요한 심사 기능은 테스트 지침에 설명하고 **검토를 위해 제출**합니다.

공식 문서:

- [개발자 계정 등록](https://developer.chrome.com/docs/webstore/register?hl=ko)
- [확장 프로그램 게시](https://developer.chrome.com/docs/webstore/publish?hl=ko)

## 사이트 구조 의존성

다음 WPC HTML 선택자를 사용합니다. 사이트의 HTML 구조가 바뀌면 추출 코드도 맞춰야 합니다.

- `#cartModalTbody`
- `.cart-btn-box`
- `.qtyText`
- 각 행의 9개 `td`
- 수량 입력란의 `data-price`
