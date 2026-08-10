# Supabase 연동 저장 구현 계획서 (Google Sheets 동시 저장)

이 계획서는 현재 Google Sheets로만 연동되고 있는 자주측정 기록 저장 시스템에 Supabase 연동 기능을 추가하는 구현 방안을 정의합니다. 기존 구글 시트 연동 로직의 안정성을 100% 보장하면서, 동일한 데이터를 Supabase 테이블에 동시에 저장하도록 설계되었습니다.

---

## 1. 사전 동의 및 변경 범위 요약
- **목적**: 구글 시트 저장 기능과 Supabase 테이블(`Weight Measurement`, `Other Measurements`) 저장을 동시에 수행.
- **영향 범위**:
  - `src/lib/supabase.ts` [NEW]: Supabase 클라이언트 초기화 코드 추가.
  - `src/App.tsx` [MODIFY]: 저장 동작(`saveRecord`) 시 Supabase 호출 로직을 동시 실행하도록 변경.
  - `.env` [NEW / MODIFY]: 로컬 환경 변수 로드.
- **안전성 우선**: 구글 시트 저장 동작 및 기존 Firebase 동작 흐름은 전혀 건드리지 않고, 예외가 발생하더라도 구글 시트 저장을 방해하지 않도록 안전하게 분리 실행합니다.

---

## 2. 데이터베이스 스키마 및 매핑 매커니즘

Google Apps Script(`GOOGLE_APPS_SCRIPT.gs`)의 데이터 정제 방식을 그대로 분석하여 Supabase 테이블의 필드로 매핑합니다.

### A. `Weight Measurement` 테이블 (중량 측정 데이터)
*충진1의 '중량' 데이터만 저장됩니다.*

| Supabase 컬럼명 (예상) | 데이터 타입 | 설명 / 매핑 소스 |
| :--- | :--- | :--- |
| `filling_date` | Date / Text | 충진일 (`data.fillingDate`) |
| `item_name` | Text | 품목명 (`data.itemName`) |
| `lot_number` | Text | 로트번호 (`data.lotNumber`) |
| `measurement_time` | Text | 측정시간 (`m.time`) |
| `classification` | Text | 구분 (`"중량"`) |
| `standard_weight` | Numeric | 정식중량 (`data.standardWeight`) |
| `underweight_tolerance` | Numeric | 미달허용 (`data.underweightTolerance`) |
| `overweight_tolerance` | Numeric | 초과허용 (`data.overweightTolerance`) |
| `vial_1` | Text / Numeric | Vial 1 측정값 (`weights[0]`) |
| `vial_2` | Text / Numeric | Vial 2 측정값 (`weights[1]`) |
| `vial_3` | Text / Numeric | Vial 3 측정값 (`weights[2]`) |
| `average` | Text | 평균/판정 (`weightJudge` - "정상"/"불량") |
| `judgement` | Text | 판정 결과 (`weightRes` - "적합"/"부적합") |
| `operator` | Text | 작업자 (`data.operator`) |
| `verifier` | Text | 확인자 (`data.verifier`) |
| `memo` | Text | 비고/메모 (`m.vialMemo`) |

---

### B. `Other Measurements` 테이블 (그 외 측정 데이터)
*충진1의 '캡', 충진2의 '스티커/날인', 포장의 '날인/캡/스티커/스크래치/이물' 전체가 개별 행으로 저장됩니다.*

| Supabase 컬럼명 (예상) | 데이터 타입 | 설명 / 매핑 소스 |
| :--- | :--- | :--- |
| `filling_date` | Date / Text | 충진일 (`data.fillingDate`) |
| `item_name` | Text | 품목명 (`data.itemName`) |
| `lot_number` | Text | 로트번호 (`data.lotNumber`) |
| `measurement_time` | Text | 측정시간 (`m.time`) |
| `classification` | Text | 구분 (`"캡(충진1)"`, `"스티커(충진2)"` 등) |
| `vial_1` | Text | Vial 1 결과 ("정상"/"불량" 등) |
| `vial_2` | Text | Vial 2 결과 |
| `vial_3` | Text | Vial 3 결과 |
| `average` | Text | 평균/판정 ("정상"/"불량") |
| `judgement` | Text | 판정 결과 ("적합"/"부적합") |
| `operator` | Text | 작업자 (`data.operator`) |
| `verifier` | Text | 확인자 (`data.verifier`) |
| `memo` | Text | 개별 항목 메모 |

> [!NOTE]
> Supabase의 테이블은 대소문자와 띄어쓰기를 포함한 `'Weight Measurement'` 및 `'Other Measurements'` 테이블명을 직접 사용합니다.

---

## 3. 상세 구현 계획

### Step 1: 환경 변수 연동
현재 `docs/plans/.env`에 명시된 Supabase 자격증명을 활용해 프로젝트 루트의 `.env` 파일에 환경변수를 주입합니다.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Step 2: Supabase 클라이언트 초기화 파일 생성
[NEW] `src/lib/supabase.ts` 파일을 생성하여 싱글톤 클라이언트를 관리합니다.
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 3: `App.tsx` 저장 기능 확장
기존 `syncToGoogleSheets` 흐름과 완벽히 호환되는 `syncToSupabase` 함수를 구현합니다.
- `GOOGLE_APPS_SCRIPT.gs` 내 데이터 파싱 로직을 React(Typescript) 측으로 동일하게 재현합니다.
- 복수의 측정 이력(`measurements`) 루프를 돌며 `Weight Measurement` 또는 `Other Measurements` 테이블로 insert 쿼리를 실행합니다.
- `saveRecord` 함수에서 `Promise.allSettled` 혹은 순차 처리를 통해 Google Sheets와 Supabase가 동시에 저장되도록 감쌉니다.

---

## 4. 검증 계획 (Verification Plan)

### A. 빌드 테스트
- 변경 사항 적용 후 `npm run build` 또는 `npm run dev` 시 구동 및 타입 체크에 에러가 없는지 검증합니다.

### B. 시각적 검증 및 연동 테스트
- 브라우저를 통해 직접 임의의 데이터(충진1 중량/캡, 충진2 스티커, 포장 기록 등)를 입력하고 저장 버튼을 누릅니다.
- 구글 스프레드시트 기록이 이전과 다름없이 정확히 들어가는지 확인합니다.
- Supabase 대시보드에서 `Weight Measurement`와 `Other Measurements` 테이블에 동일한 정보가 누락 없이 기록되는지 대조 확인합니다.
