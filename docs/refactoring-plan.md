# FUMA 프론트 구조 리팩터링 계획

기능 명세는 화면 목록이 아니라 셀렉터스·관리자·시스템 배치가 섞인 백로그다. 이 저장소는 셀렉터스 클라이언트만 담당하므로, 행마다 화면을 만들지 않고 사용자가 완료해야 하는 흐름만 라우트로 둔다.

## 적용 구조

```text
src/
  App.tsx                # 앱 셸과 인증·OAuth 진입 제어
  routes.tsx             # 경로, 제목, 화면, 주요 섹션의 단일 정의
  components/
    layout/              # AppShell, MainNavigation, ServiceSidebar, QrMark
    BottomActionBar.tsx  # 여러 화면이 공유하는 하단 행동 영역
    ScreenHeader.tsx     # 여러 화면이 공유하는 화면 헤더
    Icons.tsx
  screens/
    login/               # 로그인 화면과 테스트
    apply/               # 지원 흐름과 테스트
    campaigns/           # 캠페인 목록·상세
    performance/         # 성과 요약·상품 상세
    settlement/          # 정산 정보·내역과 테스트
    shop/                # 샵 화면·상태·전용 UI·테스트
  styles/                # tokens / global / shop 유지
```

React Router, 전역 상태 라이브러리, API 캐시 라이브러리는 추가하지 않는다. 현재 해시 라우팅과 React context면 지금 범위에 충분하다.

테스트는 별도 중앙 폴더에 모으지 않는다. 기능 테스트는 구현 옆에 두고, 여러 화면을 함께 검증하는 앱 테스트만 `App.tsx` 옆에 둔다. 재수출용 `index.ts`와 단일 소비자를 위한 추상화는 만들지 않는다.

## 사용자 흐름

```text
로그인 ─┬─ 미지원 → SNS 인증·필수 동의 → 신청 완료/심사 대기
       └─ 승인됨 → 캠페인 → 캠페인 상세 → 상품 그룹 생성·관리 → 링크 공유
                                      └→ 성과 요약 → 상품별 성과
                                                     └→ 정산 정보 → 정산 내역
```

- 화면 카탈로그 `#/screens`는 제거하고 빈 주소·잘못된 주소는 로그인으로 보낸다.
- 로그인 성공 후에는 캠페인으로 바로 이동한다. 실제 API가 지원 상태와 역할을 제공하면 이 한 지점에서만 분기한다.
- 상품·그룹·샵 링크 복사는 별도 화면을 만들지 않고 해당 화면의 버튼으로 둔다.
- 상품 그룹 순서는 명세대로 생성 순서로 고정하며 정렬 UI를 만들지 않는다.
- 시스템 배치 50개 항목은 프론트 화면이 아니라 API 데이터 생성 책임이다.

## 단계별 정리

### 1차 — 흐름 복구

- 화면 카탈로그와 중복 registry/resolver 제거
- `routes.tsx`로 라우트 정의 통합
- 로그인→캠페인, 지원→심사 대기, 캠페인→그룹, 성과→정산 연결
- 정산 유형별 정보 입력 화면 추가
- 캠페인·샵·성과·정산 주요 내비게이션 제공

### 2차 — 구조 단순화

- 화면별 폴더를 만들고 기능 테스트를 구현 옆으로 이동
- `src/shop`과 `src/screens/shop`을 `src/screens/shop` 하나로 통합
- `ShopScreens.tsx` 같은 재수출 파일 제거 후 라우트에서 화면 직접 import
- `HiHiAside`, `PanelHeader`, `BottomAction`처럼 역할이 불명확한 이름을 `ServiceSidebar`, `ScreenHeader`, `BottomActionBar`로 변경
- 고정 그룹 ID `1`을 URL 파라미터에서 읽거나, 데모를 유지한다면 fixture를 한 그룹으로 축소
- `ShopDemoContext`의 dispatch 래퍼와 미사용 selector 제거
- `productData.ts`의 사용되지 않는 변환 필드 제거

### 3차 — 네이티브 UI와 테스트 정리

- 직접 만든 선택기·메뉴·모달을 가능한 범위에서 `<select>`, `<dialog>`, Popover API로 교체
- fixture 전체와 CSS 문자열을 복제하는 테스트를 줄이고 다음 핵심 흐름만 유지
  - 로그인 성공→캠페인
  - SNS 인증+필수 동의→신청 완료
  - 캠페인 상품→그룹 생성/수정
  - 성과→정산 정보→정산 내역
- Windows 줄바꿈에 따라 깨지는 OFL 원시 바이트 비교는 줄바꿈 정규화 후 비교

## 백엔드 연결 시 필요한 최소 상태

- 지원: `PENDING | APPROVED | REJECTED`
- 정산: `MISSING_INFO | READY | HELD | PAID`
- 현재/이전 기수와 블랙리스트 권한

정산 식별번호는 브라우저 저장소에 두지 않고 서버 전송·마스킹·재조회 정책을 별도 보안 설계 후 연결한다.

## 제외 범위

- 관리자 크리에이터 풀, 지원자 심사, 기수·캠페인·콘텐츠 검수 화면
- 배치, 알림톡, AI 분석, 정산 실지급
- 새 상태관리·라우팅·폼 라이브러리

관리자 프론트가 같은 저장소 범위로 확정될 때만 별도 `admin` 엔트리를 추가한다.
