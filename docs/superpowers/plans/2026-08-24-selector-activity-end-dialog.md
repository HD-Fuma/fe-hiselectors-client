# 셀렉터스 활동 종료 확인 팝업 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 브라우저 기본 확인창을 기존 서비스 스타일의 활동 종료 확인 팝업으로 교체한다.

**Architecture:** `MemberInfoScreen` 내부에 화면 전용 다이얼로그를 두고 기존 `group-dialog` 스타일과 `useModalFocus`를 재사용한다. 확인 팝업을 닫은 뒤 기존 종료 핸들러를 실행해 성공·오류 알림과 겹치지 않게 한다.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS

---

## Chunk 1: 확인 팝업 구현과 검증

### Task 1: 확인 팝업 동작을 테스트로 고정

**Files:**
- Modify: `src/screens/mypage/MemberInfoScreen.test.tsx`

- [ ] **Step 1: 기존 성공 테스트를 서비스 팝업 기준으로 변경한다**

Testing Library import에 `within`을 추가한다. `window.confirm`은 관찰용으로 `vi.spyOn(window, 'confirm').mockReturnValue(true)`를 만들되 새 팝업 테스트 외 기존 mock은 제거한다. 활동 종료 버튼 클릭 후 `role="dialog"`인 `셀렉터스 활동을 종료할까요?` 팝업을 확인한다. 네이티브 confirm이 호출되지 않았는지, 본문 문자열에 아래 줄바꿈이 있는지 검증한 뒤 `활동 종료` 버튼을 눌러 기존 DELETE·성공 알림 검증을 이어간다.

```ts
expect(window.confirm).not.toHaveBeenCalled()
const dialog = screen.getByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })
expect(dialog.querySelector('p')?.textContent).toBe(
  '종료 즉시 셀렉터스 자격이 사라지며 이 작업은 되돌릴 수 없습니다.\n미정산 금액은 예정대로 정산됩니다.',
)
fireEvent.click(within(dialog).getByRole('button', { name: '활동 종료' }))
```

성공 알림이 나타났을 때 확인 팝업이 이미 사라졌는지도 `queryByRole('dialog', ...)`로 검증한다.

- [ ] **Step 2: 취소와 Escape 테스트를 변경·추가한다**

취소 또는 Escape 후 팝업이 사라지고 DELETE가 호출되지 않으며 호출 버튼으로 포커스가 돌아오는지 검증한다.

- [ ] **Step 3: 기존 종료 실행 테스트를 공용 테스트 헬퍼로 전환한다**

성공 테스트의 네이티브 confirm 관찰 spy를 제외한 기존 `window.confirm` mock을 제거하고 아래 헬퍼로 팝업을 열고 확인한다.

```ts
async function confirmSelectorActivityEnd() {
  fireEvent.click(await screen.findByRole('button', { name: '셀렉터스 활동 종료' }))
  fireEvent.click(screen.getByRole('button', { name: '활동 종료' }))
}
```

- [ ] **Step 4: 요청 대기 중 중복 방지 테스트를 추가한다**

지연된 DELETE를 사용해 확인 팝업이 닫힌 뒤 화면 버튼이 `종료 처리 중...`으로 비활성화되는지 검증한다. DELETE 호출 수가 1인지 확인하고 비활성 버튼을 다시 클릭한 뒤에도 호출 수가 정확히 1인지 다시 확인한다.

- [ ] **Step 5: 오류 알림 전환 테스트를 보강한다**

기존 종료 실패 테스트를 서비스 팝업 확인 방식으로 바꾸고, 오류 알림이 나타났을 때 확인 팝업이 이미 사라졌는지 검증한다.

- [ ] **Step 6: 테스트를 실행해 RED를 확인한다**

Run: `npm test -- --run src/screens/mypage/MemberInfoScreen.test.tsx`

Expected: 서비스 팝업이 아직 없어 `dialog` 조회 또는 확인 버튼 조회가 실패한다.

### Task 2: 최소 확인 팝업 구현

**Files:**
- Modify: `src/screens/mypage/MemberInfoScreen.tsx`
- Modify: `src/styles/shop.css`
- Test: `src/screens/mypage/MemberInfoScreen.test.tsx`

- [ ] **Step 1: 화면 전용 다이얼로그를 추가한다**

`MemberInfoScreen.tsx`에 `SelectorActivityEndDialog`를 추가한다. `useId`, `useRef`, `useModalFocus`, 호출 버튼 ref를 사용하고 기존 `group-dialog` 마크업을 따른다.

```tsx
<div className="group-dialog-backdrop">
  <section
    aria-describedby={descriptionId}
    aria-labelledby={titleId}
    aria-modal="true"
    className="group-dialog selector-activity-end-dialog"
    ref={containerRef}
    role="dialog"
  >
    <h2 id={titleId}>셀렉터스 활동을 종료할까요?</h2>
    <p id={descriptionId}>{'종료 즉시 셀렉터스 자격이 사라지며 이 작업은 되돌릴 수 없습니다.\n미정산 금액은 예정대로 정산됩니다.'}</p>
    <div className="group-dialog-actions">
      <button onClick={onClose} type="button">취소</button>
      <button onClick={onConfirm} type="button">활동 종료</button>
    </div>
  </section>
</div>
```

- [ ] **Step 2: 기본 confirm을 상태 기반 팝업으로 교체한다**

`isEndActivityDialogOpen` 상태와 호출 버튼 ref를 추가한다. 화면 버튼은 팝업만 열고, 팝업 확인은 먼저 팝업을 닫은 뒤 기존 `handleEndActivity`를 호출한다. `handleEndActivity`에서 `window.confirm` 조건을 제거한다.

- [ ] **Step 3: 본문 줄바꿈 스타일을 추가한다**

```css
.selector-activity-end-dialog > p {
  margin-top: 12px;
  color: var(--gray-700);
  font-size: 13px;
  line-height: 20px;
  white-space: pre-line;
}
```

- [ ] **Step 4: 대상 테스트를 실행해 GREEN을 확인한다**

Run: `npm test -- --run src/screens/mypage/MemberInfoScreen.test.tsx`

Expected: 모든 MemberInfoScreen 테스트 통과.

- [ ] **Step 5: 전체 회귀와 빌드를 검증한다**

Run: `npm test -- --run`

Expected: 22개 테스트 파일 전체 통과.

Run: `npm run build -- --base=/`

Expected: TypeScript와 Vite production build 성공.

- [ ] **Step 6: 변경을 커밋한다**

```bash
git add src/screens/mypage/MemberInfoScreen.tsx src/screens/mypage/MemberInfoScreen.test.tsx src/styles/shop.css docs/superpowers/plans/2026-08-24-selector-activity-end-dialog.md
git commit -m "Fix: 활동 종료 확인 팝업 적용"
```
