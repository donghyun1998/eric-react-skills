---
name: react-component-design
description: React 컴포넌트 설계 규칙을 적용하여 코드를 작성하거나 리뷰한다. 컴포넌트 분리, 커스텀 훅 설계, Suspense/ErrorBoundary 패턴, JSX 가독성 등 React 아키텍처 관련 작업에 사용한다. 코드 리뷰, 리팩토링 제안, 새 컴포넌트 작성 시 이 규칙을 따른다.
---

# React Component Design Rules

React 컴포넌트와 훅을 설계할 때 따르는 규칙 모음이다. 코드 작성, 리뷰, 리팩토링 시 이 규칙을 기준으로 판단한다.

---

## 1. 단일 관심사 (Single Concern)

컴포넌트는 **주제(concern)** 로 분리하고, 훅/함수는 **행동(responsibility)** 으로 분리한다.

### 규칙

- 하나의 컴포넌트는 하나의 도메인 주제만 다룬다
- 각 훅은 명확히 한 가지 일만 수행한다
- 상위 컴포넌트가 모든 로직을 들고 있지 않고, 각 관심사별 컴포넌트가 자신의 로직을 소유한다

### 위반 신호

- 하나의 컴포넌트나 훅에서 서로 다른 도메인의 데이터를 함께 패칭한다
- 한 케이스에서만 쓰는 상태가 다른 케이스에 불필요하게 존재한다
- 훅의 반환값이 3개 이상의 독립적인 관심사를 포함한다

```typescript
// ❌ Bad: 여러 관심사가 섞인 "몬스터 훅"
function useProductPage() {
  const product = useProduct();           // 상품 관심사
  const [quantity, setQuantity] = useState(1);  // 장바구니 관심사
  const reviews = useReviews();           // 리뷰 관심사
  const analytics = useAnalytics();       // 분석 관심사
  return { product, quantity, setQuantity, reviews, analytics };
}

// ✅ Good: 관심사별로 분리, 각 컴포넌트가 자신의 로직을 소유
function ProductPage() {
  return (
    <>
      <ProductInfoSection />
      <CartSection />
      <ReviewSection />
    </>
  );
}
```

### 몬스터 훅의 문제점

- 단일 책임 원칙이 깨진다
- 인지 강도가 급격히 올라간다
- 확장성이 떨어진다 — 새 기능 추가 시 훅 전체에 영향

**핵심: 추상화와 추출(단순히 코드를 옮기는 행위)을 구분해야 한다. 코드를 훅으로 옮겼다고 추상화가 된 게 아니다. 관심사별로 묶여야 추상화다.**

---

## 2. 분기는 상위로 끌어올리기

조건부 렌더링은 최상위에서 결정하고, 하위 컴포넌트는 자신의 케이스만 처리한다.

### 규칙

- 분기별로 다른 훅을 호출하면 **무조건 분리**한다
- 상위에서 Tagged Union처럼 분기를 결정하면 하위는 단순해진다
- 하위 컴포넌트는 옵셔널 처리 없이 성공 케이스만 다룬다

### 분리가 필요한 신호

- 조건별로 다른 훅이 호출된다
- 조건별로 UI 구조가 크게 다르다
- `if (canEdit)` 같은 분기 위에 특정 분기에서만 쓰는 훅이 선언되어 있다

```typescript
// ❌ Bad: 한 컴포넌트에서 분기 처리
function PostDialog({ canEdit }) {
  const form = useForm();       // canEdit일 때만 필요
  const mutate = useSavePost(); // canEdit일 때만 필요

  if (canEdit) return <EditUI form={form} />;
  return <ReadOnlyUI />;
}

// ✅ Good: 분기를 상위로
function PostDialogBranch({ postId }) {
  const { canEdit } = usePermission();
  return canEdit
    ? <EditablePost postId={postId} />
    : <ReadOnlyPost postId={postId} />;
}

function EditablePost({ postId }) {
  const form = useForm();
  const mutate = useSavePost();
  // ...
}
```

---

## 3. Suspense/ErrorBoundary와 Compound Pattern

Suspense는 "로딩 UI를 보여주는 도구"가 아니라, **성공 케이스만 신경쓸 수 있게 해주는 경계**다.

### 규칙

- Suspense 경계 안에서는 "모든 데이터가 준비된 상황"만 다룬다
- 옵셔널 체이닝(`?.`)이 코드 전체로 전염되는 것을 Suspense로 차단한다
- `Component.loading`, `Component.error` 패턴으로 컴포넌트와 비동기 상태를 논리적으로 함께 관리한다

### Component.loading / Component.error 패턴

컴포넌트의 로딩·에러 상태를 컴포넌트 자체에 정적 프로퍼티로 붙여서 응집도를 높인다.

```typescript
function SelectedVariantUpdateForm({ onClose }: Props) {
  // Suspense 안이므로 데이터가 항상 존재한다고 가정
  const variant = useSuspenseVariant();
  return <Form variant={variant} onClose={onClose} />;
}

SelectedVariantUpdateForm.loading = function Loading() {
  return <FormSkeleton />;
};

SelectedVariantUpdateForm.error = function Error({ resetError }: { resetError: () => void }) {
  return <FormError onRetry={resetError} />;
};
```

### 사용부

```tsx
<ErrorBoundary
  fallback={({ resetError }) => (
    <SelectedVariantUpdateForm.error resetError={resetError} />
  )}
>
  <Suspense fallback={<SelectedVariantUpdateForm.loading />}>
    <SelectedVariantUpdateForm onClose={handleClose} />
  </Suspense>
</ErrorBoundary>
```

### 이점

- 성공/로딩/에러 UI가 한 컴포넌트 파일에 응집된다
- Suspense 내부 코드에서 옵셔널 체이닝이 사라진다
- 비동기 조합이 늘어나도 각 조합마다 로딩/에러를 일일이 처리하지 않아도 된다

---

## 4. 컴포넌트를 예측 가능하게 만들기

컴포넌트가 자신의 역할에 충실해야 한다. "input답지 않은" props를 받기 시작하면 인지 강도가 급격히 올라간다.

### 규칙

- 컴포넌트의 props는 해당 컴포넌트의 본래 역할과 일치해야 한다
- 역할 밖의 관심사(툴팁, 검증, 분석 등)는 별도 컴포넌트로 분리한다
- UI 형태와 코드 구조가 1:1로 매핑되어야 유지보수가 쉽다

```typescript
// ❌ Bad: input답지 않은 props
<CustomInput
  showTooltip
  validateOnBlur
  asyncValidation
  trackAnalytics
/>

// ✅ Good: input은 input답게, 나머지는 조합으로
<TooltipWrapper>
  <ValidationLayer validateOnBlur>
    <Input {...inputProps} />
  </ValidationLayer>
</TooltipWrapper>
```

**재사용성은 역할 충실에서 자연스럽게 따라온다.**

---

## 5. JSX와 UI를 일치시켜 가독성 올리기

JSX를 읽을 때 UI 구조가 바로 그려져야 한다.

### 규칙

- 단순 텍스트(title, label)를 상수로 빼지 않는다 — 이정표를 제거하는 행위다
- 코드 구조가 화면 레이아웃과 1:1로 매핑되도록 한다
- 매직넘버와 UI 텍스트를 구분한다: 숫자·설정값은 상수로, 화면에 보이는 텍스트는 JSX에 직접 작성

```typescript
// ❌ Bad: 이정표가 사라진 JSX
const TITLE = "사용자 프로필";
const SUBMIT_LABEL = "저장하기";

return (
  <div>
    <h1>{TITLE}</h1>
    <button>{SUBMIT_LABEL}</button>
  </div>
);

// ✅ Good: 코드만 봐도 UI가 그려진다
return (
  <div>
    <h1>사용자 프로필</h1>
    <button>저장하기</button>
  </div>
);
```

**예외: i18n이 필요한 경우에는 번역 키를 사용하는 것이 맞다. 이 규칙은 단일 언어 환경에서 불필요한 상수 추출을 막기 위한 것이다.**

---

## 요약: 위반 체크리스트

코드 리뷰 시 아래 항목을 확인한다:

| 위반 | 확인 질문 |
|------|-----------|
| 몬스터 훅 | 이 훅이 3개 이상의 독립적 관심사를 반환하는가? |
| 잘못된 분기 | 조건별로 다른 훅을 호출하는 컴포넌트가 있는가? |
| 옵셔널 전염 | Suspense 없이 `?.`가 코드 전체에 퍼져 있는가? |
| 역할 불일치 | 컴포넌트가 본래 역할 밖의 props를 받는가? |
| 이정표 제거 | 단순 UI 텍스트를 상수로 추출했는가? |
