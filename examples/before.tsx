// components/UserDashboard.tsx
import { useState, useEffect } from 'react';

const PAGE_TITLE = "대시보드";
const WELCOME_TEXT = "환영합니다";
const EDIT_BUTTON_LABEL = "수정";
const SAVE_BUTTON_LABEL = "저장";
const CANCEL_BUTTON_LABEL = "취소";
const LOADING_TEXT = "로딩 중...";
const ERROR_TEXT = "에러 발생";

interface Props {
  userId: string;
  canEdit: boolean;
  showAnalytics: boolean;
}

export function UserDashboard({ userId, canEdit, showAnalytics }: Props) {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/users/${userId}`).then(r => r.json()),
      fetch(`/api/users/${userId}/posts`).then(r => r.json()),
      fetch(`/api/users/${userId}/notifications`).then(r => r.json()),
      showAnalytics
        ? fetch(`/api/users/${userId}/analytics`).then(r => r.json())
        : Promise.resolve(null),
    ])
      .then(([userData, postsData, notiData, analyticsData]) => {
        setUser(userData);
        setPosts(postsData);
        setNotifications(notiData);
        setAnalytics(analyticsData);
        if (canEdit) {
          setFormData({ name: userData?.name, bio: userData?.bio });
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [userId, canEdit, showAnalytics]);

  const handleSave = async () => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setUser({ ...user, ...formData });
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (isLoading) return <div>{LOADING_TEXT}</div>;
  if (error) return <div>{ERROR_TEXT}: {error}</div>;

  return (
    <div>
      <h1>{PAGE_TITLE}</h1>
      <p>{WELCOME_TEXT}, {user?.name}</p>

      {canEdit && isEditing ? (
        <div>
          <CustomInput
            value={formData.name}
            onChange={(v: string) => setFormData({ ...formData, name: v })}
            showTooltip
            validateOnBlur
            asyncValidation={async (val: string) => {
              const res = await fetch(`/api/validate-name?name=${val}`);
              return res.ok;
            }}
            trackAnalytics
          />
          <button onClick={handleSave}>{SAVE_BUTTON_LABEL}</button>
          <button onClick={() => setIsEditing(false)}>{CANCEL_BUTTON_LABEL}</button>
        </div>
      ) : canEdit ? (
        <button onClick={() => setIsEditing(true)}>{EDIT_BUTTON_LABEL}</button>
      ) : null}

      <div>
        <h2>게시물</h2>
        {posts?.map((post: any) => (
          <div key={post?.id}>
            <h3>{post?.title}</h3>
            <p>{post?.content?.slice(0, 100)}</p>
          </div>
        ))}
      </div>

      {showAnalytics && analytics && (
        <div>
          <h2>분석</h2>
          <p>조회수: {analytics?.views}</p>
          <p>좋아요: {analytics?.likes}</p>
        </div>
      )}

      <div>
        <h2>알림</h2>
        {notifications?.map((noti: any) => (
          <span key={noti?.id}>{noti?.message}</span>
        ))}
      </div>
    </div>
  );
}
