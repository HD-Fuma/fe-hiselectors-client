# HI Selectors Client

현대백화점 셀렉터스의 캠페인 참여와 상품 큐레이션 활동을 지원하는 웹 서비스입니다.

## 주요 기능

- 셀렉터스 신청 및 SNS·카카오 계정 연동
- 캠페인 탐색과 상품 큐레이션
- 셀렉터스샵·프로필·상품 그룹 관리
- 공개 샵 및 상품 공유
- 판매 성과와 정산 관리

## 기술 스택

React · TypeScript · Vite

## 화면 라우팅

| 화면 | 경로 |
| --- | --- |
| 로그인 | `/login` |
| 셀렉터스 홈 | `/home` |
| 회원정보 변경 | `/mypage/member` |
| 셀렉터스 신청 안내 | `/apply` |
| 셀렉터스 신청서 | `/apply/form` |
| 신청 완료 | `/apply/status` |
| 캠페인 목록 | `/campaigns` |
| 캠페인 상세 | `/campaigns/:campaignId` |
| 공개 셀렉터스샵 | `/shop/:selectorsCode` |
| 셀렉터스샵 그룹 상세 | `/shop/:selectorsCode/:groupId` |
| 상품 상세 | `/product/:productCode?ptrsRefCd=:selectorsCode` |
| 상품 그룹 목록 | `/shop/groups` |
| 샵 프로필 수정 | `/shop/profile/edit` |
| 상품 그룹 생성 | `/shop/groups/new` |
| 상품 그룹 편집 | `/shop/groups/:groupId/edit` |
| 캠페인 상품으로 그룹 생성 | `/shop/groups/new/campaign/:campaignId` |
| 성과 요약 | `/performance` |
| 상품별 성과 | `/performance/products` |
| 정산 진입 | `/settlement/check` |
| 정산 정보 입력 | `/settlement/info` |
| 정산 내역 | `/settlement` |

화면 경로의 기준은 [`src/routes.tsx`](src/routes.tsx)입니다.
