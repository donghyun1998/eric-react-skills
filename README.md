# React Component Design Skill

React 컴포넌트 설계 규칙을 적용하여 코드를 작성하거나 리뷰하는 Claude 스킬.

## 포함된 규칙

1. **단일 관심사** - 컴포넌트는 주제로, 훅은 행동으로 분리
2. **분기는 상위로** - 조건부 렌더링은 최상위에서 결정
3. **Suspense/ErrorBoundary** - 성공 케이스만 신경쓸 수 있는 경계 설정
4. **예측 가능한 컴포넌트** - props는 본래 역할과 일치
5. **JSX 가독성** - 코드 구조와 UI 레이아웃 1:1 매핑

## 설치

Claude Code에서:

```
/plugin marketplace add donghyun1998/eric-react-skills
/plugin install react-component-design@eric-react-skills
```

## 사용 예시

스킬 설치 후 React 코드를 작성하거나 리뷰를 요청하면 자동으로 규칙이 적용됩니다.

```
"이 컴포넌트 리뷰해줘"
"UserDashboard 리팩토링해줘"
"새 컴포넌트 만들어줘"
```

## Before / After 예시

[`examples/`](./examples) 디렉토리에서 실제 리팩토링 예시를 확인할 수 있습니다.

- [`before.tsx`](./examples/before.tsx) - 규칙 위반 코드 (몬스터 컴포넌트, 옵셔널 전염, 이정표 제거 등)
- [`after.tsx`](./examples/after.tsx) - 스킬 규칙 적용 후 리팩토링된 코드
