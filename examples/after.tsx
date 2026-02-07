// components/UserDashboard.tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// --- UserDashboard: 분기와 조합만 담당 ---

interface Props {
  userId: string;
  canEdit: boolean;
  showAnalytics: boolean;
}

export function UserDashboard({ userId, canEdit, showAnalytics }: Props) {
  return (
    <div>
      <h1>대시보드</h1>

      <ErrorBoundary fallback={<ProfileError />}>
        <Suspense fallback={<ProfileSkeleton />}>
          {canEdit
            ? <EditableProfile userId={userId} />
            : <ReadOnlyProfile userId={userId} />
          }
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<SectionError title="게시물" />}>
        <Suspense fallback={<SectionSkeleton title="게시물" />}>
          <UserPosts userId={userId} />
        </Suspense>
      </ErrorBoundary>

      {showAnalytics && (
        <ErrorBoundary fallback={<SectionError title="분석" />}>
          <Suspense fallback={<SectionSkeleton title="분석" />}>
            <UserAnalytics userId={userId} />
          </Suspense>
        </ErrorBoundary>
      )}

      <ErrorBoundary fallback={<SectionError title="알림" />}>
        <Suspense fallback={<SectionSkeleton title="알림" />}>
          <UserNotifications userId={userId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// --- 프로필: canEdit 분기를 상위에서 결정, 각 컴포넌트는 자기 케이스만 처리 ---

function ReadOnlyProfile({ userId }: { userId: string }) {
  const user = useSuspenseUser(userId);

  return (
    <p>환영합니다, {user.name}</p>
  );
}

function EditableProfile({ userId }: { userId: string }) {
  const user = useSuspenseUser(userId);
  const { formData, setField, isEditing, setIsEditing, save } = useProfileForm(user);

  if (!isEditing) {
    return (
      <div>
        <p>환영합니다, {user.name}</p>
        <button onClick={() => setIsEditing(true)}>수정</button>
      </div>
    );
  }

  return (
    <div>
      <TooltipWrapper content="이름을 입력하세요">
        <ValidationLayer
          validateOnBlur
          asyncValidate={(val: string) =>
            fetch(`/api/validate-name?name=${val}`).then(r => r.ok)
          }
        >
          <Input
            value={formData.name}
            onChange={(v: string) => setField('name', v)}
          />
        </ValidationLayer>
      </TooltipWrapper>
      <button onClick={save}>저장</button>
      <button onClick={() => setIsEditing(false)}>취소</button>
    </div>
  );
}

// --- 게시물 섹션: 자신의 데이터를 자신이 소유 ---

function UserPosts({ userId }: { userId: string }) {
  const posts = useSuspensePosts(userId);

  return (
    <div>
      <h2>게시물</h2>
      {posts.map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content.slice(0, 100)}</p>
        </div>
      ))}
    </div>
  );
}

// --- 분석 섹션 ---

function UserAnalytics({ userId }: { userId: string }) {
  const analytics = useSuspenseAnalytics(userId);

  return (
    <div>
      <h2>분석</h2>
      <p>조회수: {analytics.views}</p>
      <p>좋아요: {analytics.likes}</p>
    </div>
  );
}

// --- 알림 섹션 ---

function UserNotifications({ userId }: { userId: string }) {
  const notifications = useSuspenseNotifications(userId);

  return (
    <div>
      <h2>알림</h2>
      {notifications.map((noti) => (
        <span key={noti.id}>{noti.message}</span>
      ))}
    </div>
  );
}

// --- 훅: 각 훅은 한 가지 행동만 수행 ---

function useSuspenseUser(userId: string): User {
  // useSuspenseQuery 등으로 구현
  // Suspense 경계 안이므로 반환값은 항상 존재
  return useSuspenseQuery(['user', userId], () =>
    fetch(`/api/users/${userId}`).then(r => r.json())
  ).data;
}

function useSuspensePosts(userId: string): Post[] {
  return useSuspenseQuery(['posts', userId], () =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
  ).data;
}

function useSuspenseAnalytics(userId: string): Analytics {
  return useSuspenseQuery(['analytics', userId], () =>
    fetch(`/api/users/${userId}/analytics`).then(r => r.json())
  ).data;
}

function useSuspenseNotifications(userId: string): Notification[] {
  return useSuspenseQuery(['notifications', userId], () =>
    fetch(`/api/users/${userId}/notifications`).then(r => r.json())
  ).data;
}

function useProfileForm(user: User) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, bio: user.bio });

  return {
    formData,
    setField: (key: string, value: string) =>
      setFormData(prev => ({ ...prev, [key]: value })),
    isEditing,
    setIsEditing,
    save: async () => {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setIsEditing(false);
    },
  };
}

// --- Fallback 컴포넌트 ---

function ProfileSkeleton() {
  return <div>프로필 로딩 중...</div>;
}

function ProfileError() {
  return <div>프로필을 불러올 수 없습니다</div>;
}

function SectionSkeleton({ title }: { title: string }) {
  return <div>{title} 로딩 중...</div>;
}

function SectionError({ title }: { title: string }) {
  return <div>{title}을(를) 불러올 수 없습니다</div>;
}

// --- 타입 ---

interface User {
  id: string;
  name: string;
  bio: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
}

interface Analytics {
  views: number;
  likes: number;
}

interface Notification {
  id: string;
  message: string;
}
