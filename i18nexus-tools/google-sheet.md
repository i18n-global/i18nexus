## 기능 명세: i18n 리소스 관리 (Google Sheets 연동)

### 1. 개요

로컬의 i18n JSON 파일(`ko.json`, `en.json`)과 Google Sheets 간의 데이터를 동기화하는 기능입니다. 이 기능은 **`upload`**와 **`download`** 두 가지 핵심 명령으로 구성됩니다.

### 2. `upload` (로컬 → 구글 시트)

로컬 JSON 파일의 Key-Value를 Google Sheets로 업로드합니다. 업로드 시 두 가지 모드를 지원합니다.

#### 2.1. 기본 모드 (단순 텍스트 업로드)

- **명령 (예시):** `npm run upload:i18n`
- **동작:**
  - 로컬 `ko.json`과 `en.json` 파일의 **모든 값을 단순 텍스트(String)로** 읽어옵니다.
  - Google Sheets의 해당 Key 값에 텍스트를 그대로 덮어씁니다.
- **주요 용도:**
  - Google Sheets에서 수동 번역 및 검수가 완료된 버전을 `download` 받은 후, 다시 `upload`하여 시트와 로컬의 형상을 일치시킬 때 (Git 기반 형상 관리).
  - 기존에 있던 수식(`=GOOGLETRANSLATE`)을 제거하고 확정된 텍스트 값으로 고정시킬 때.

#### 2.2. 자동 번역 모드 (수식 업로드)

- **명령 (예시):** `npm run upload:i18n -- --auto-translate`
- **동작:**
  - `ko.json` 파일의 값은 **텍스트(String)**로 업로드합니다.
  - `en.json` 파일의 값은 **Google Sheets 수식 문자열** (`"=GOOGLETRANSLATE(C2, \"ko\", \"en\")"`)로 변환하여 업로드합니다. (C2는 한국어 텍스트가 있는 셀)
- **결과:**
  - 업로드 시점에 Google Sheets가 자동으로 기계 번역을 실행하여 영어 셀을 채웁니다.
- **주요 용도:**
  - 새로운 기능 개발로 한국어 Key-Value만 대량 추가되었을 때, 영어 초벌 번역을 빠르게 생성하기 위해 사용합니다.

---

### 3. `download` (구글 시트 → 로컬)

Google Sheets의 데이터를 로컬 `ko.json`과 `en.json` 파일로 다운로드합니다.

- **명령 (예시):** `npm run download:i18n`
- **동작:**
  - Google Sheets API 호출 시, `valueRenderOption` 값을 **`FORMATTED_VALUE`**로 설정하여 요청합니다.
  - 이 옵션은 셀의 원본 데이터(수식 등)가 아닌, **사용자 눈에 보이는 최종 결과값(계산된 값)**을 가져옵니다.
- **결과:**
  - **자동 번역 모드**로 업로드된 셀: 수식(`=GOOGLE...`)이 아닌, 번역된 텍스트("Hello")를 가져옵니다.
  - **기본 모드**로 업로드된 셀: 원래의 텍스트("Hello")를 가져옵니다.
- **주요 용도:**
  - Google Sheets에서 기계 번역되었거나, 번역가가 수동으로 수정한 최신 번역본을 코드로 적용할 때 사용합니다.
  - `upload` 방식과 관계없이 항상 일관된 텍스트 결과물을 확보할 수 있습니다.
