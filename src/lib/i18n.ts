// 奉天F4Club — Internationalization (i18n)

export type Lang = 'zh' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.gaming': { zh: '游戏', en: 'Gaming' },
  'nav.movies': { zh: '电影', en: 'Movies' },
  'nav.sports': { zh: '运动', en: 'Sports' },
  'nav.english': { zh: '学英语', en: 'English' },
  'nav.newPost': { zh: '发帖', en: 'New Post' },
  'nav.login': { zh: '登录', en: 'Login' },
  'nav.logout': { zh: '退出', en: 'Logout' },

  // Categories
  'cat.gaming': { zh: '🎮 游戏', en: '🎮 Gaming' },
  'cat.movies': { zh: '🎬 电影', en: '🎬 Movies' },
  'cat.sports': { zh: '🏀 运动', en: '🏀 Sports' },
  'cat.english': { zh: '📖 学英语', en: '📖 English' },

  // Sports subtypes
  'sport.basketball': { zh: '篮球', en: 'Basketball' },
  'sport.badminton': { zh: '羽毛球', en: 'Badminton' },
  'sport.marathon': { zh: '马拉松', en: 'Marathon' },

  // Roles
  'role.programmer': { zh: '程序', en: 'Dev' },
  'role.artist': { zh: '美术', en: 'Art' },

  // Login page
  'login.title': { zh: '欢迎回来', en: 'Welcome Back' },
  'login.subtitle': { zh: '选择你的身份', en: 'Choose your identity' },
  'login.password': { zh: '密码', en: 'Password' },
  'login.submit': { zh: '进入', en: 'Enter' },
  'login.error': { zh: '密码错误', en: 'Wrong password' },

  // Post
  'post.new': { zh: '发布新帖', en: 'New Post' },
  'post.title': { zh: '标题', en: 'Title' },
  'post.content': { zh: '内容（支持 Markdown）', en: 'Content (Markdown supported)' },
  'post.category': { zh: '分类', en: 'Category' },
  'post.sportType': { zh: '运动类型', en: 'Sport Type' },
  'post.publish': { zh: '发布', en: 'Publish' },
  'post.edit': { zh: '编辑', en: 'Edit' },
  'post.delete': { zh: '删除', en: 'Delete' },
  'post.deleteConfirm': { zh: '确定要删除这篇帖子吗？', en: 'Delete this post?' },
  'post.ago': { zh: '前', en: 'ago' },
  'post.uploadImage': { zh: '上传图片', en: 'Upload Image' },
  'post.uploading': { zh: '上传中...', en: 'Uploading...' },

  // Comments
  'comment.title': { zh: '评论', en: 'Comments' },
  'comment.placeholder': { zh: '说点什么...', en: 'Say something...' },
  'comment.submit': { zh: '发表', en: 'Post' },
  'comment.empty': { zh: '还没有评论', en: 'No comments yet' },
  'comment.login': { zh: '登录后才能评论', en: 'Login to comment' },

  // Likes
  'like.action': { zh: '赞', en: 'Like' },

  // General
  'general.all': { zh: '全部', en: 'All' },
  'general.empty': { zh: '暂无内容', en: 'Nothing here yet' },
  'general.loading': { zh: '加载中...', en: 'Loading...' },
  'general.member': { zh: '成员', en: 'Members' },
  'general.posts': { zh: '篇帖子', en: 'posts' },

  // Footer
  'footer.text': { zh: '奉天F4Club · 前同事们的秘密基地', en: 'F4Club · Our Secret Hangout' },
};

export function t(key: string, lang: Lang = 'zh'): string {
  return translations[key]?.[lang] ?? key;
}

export function getCategoryLabel(category: string, lang: Lang = 'zh'): string {
  return t(`cat.${category}`, lang);
}

export function getSportLabel(sport: string, lang: Lang = 'zh'): string {
  return t(`sport.${sport}`, lang);
}

export function getRoleLabel(role: string, lang: Lang = 'zh'): string {
  return t(`role.${role}`, lang);
}

export function timeAgo(date: string | Date, lang: Lang = 'zh'): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return lang === 'zh' ? '刚刚' : 'just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === 'zh' ? `${m}分钟前` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === 'zh' ? `${h}小时前` : `${h}h ago`;
  }
  if (diff < 2592000) {
    const d = Math.floor(diff / 86400);
    return lang === 'zh' ? `${d}天前` : `${d}d ago`;
  }
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}
