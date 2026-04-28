# 奉天 F4Club - 私人社区网站

> 四位前游戏开发同事的私人社区，记录生活、分享兴趣。

**在线访问：** https://fengtian-f4club.pages.dev

---

## 🧑‍🤝‍🧑 社区成员

| 昵称 | 角色 | 头像 |
|------|------|------|
| 阿星 | 程序员 | 🐧 |
| 阿平 | 程序员 | 🐼 |
| 阿健 | 程序员 | 🦁 |
| 阿卓 | 美术 | 🐯 |

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | **Astro 5** (SSR 模式) | 服务端渲染，支持动态路由 |
| 部署 | **Cloudflare Pages** | Edge 部署，全球加速 |
| 数据库 | **Cloudflare D1** | SQLite，存储用户/帖子/评论 |
| 会话 | **Cloudflare KV** | 存储登录 session |
| 样式 | **Vanilla CSS** | 自定义设计系统 |
| 字体 | **Inter + Noto Sans SC** | 中英双语 |

---

## 📂 项目结构

```
fengtian-f4club/
├── astro.config.mjs      # Astro + Cloudflare adapter 配置
├── wrangler.toml         # D1 / KV 绑定配置
├── db/
│   └── schema.sql        # 数据库初始化脚本
├── public/               # 静态资源
└── src/
    ├── layouts/
    │   └── Layout.astro   # 基础布局（含语言切换）
    ├── components/
    │   ├── Nav.astro            # 导航栏
    │   ├── PostCard.astro       # 帖子卡片
    │   ├── CommentSection.astro # 评论区
    │   ├── PostEditor.astro     # 发帖/编辑器
    │   ├── MemberBadge.astro    # 成员标识
    │   ├── CategoryTag.astro   # 分类标签
    │   └── LangSwitch.astro     # 中英文切换
    ├── pages/
    │   ├── index.astro          # 首页（动态 Feed）
    │   ├── login.astro          # 登录页
    │   ├── post/
    │   │   ├── [id].astro       # 帖子详情页
    │   │   └── new.astro        # 发帖页
    │   ├── category/
    │   │   └── [slug].astro     # 分类页 (gaming/movies/sports/english)
    │   ├── member/
    │   │   └── [name].astro     # 成员个人页
    │   └── api/                 # RESTful API
    │       ├── auth/login.ts
    │       ├── auth/logout.ts
    │       ├── posts/index.ts
    │       ├── posts/[id].ts
    │       └── comments/index.ts
    └── lib/
        ├── db.ts    # D1 数据库封装
        ├── auth.ts  # 认证 & Session 工具
        └── i18n.ts  # 国际化工具
```

---

## 🎨 设计系统

### 配色

| 用途 | 色值 |
|------|------|
| 深色背景 | `#1a1a2e` `#16213e` `#0f3460` |
| 强调色 | `#e94560` |
| 文字（亮/次） | `#eaeaea` `#8892b0` |
| 卡片背景 | `rgba(255,255,255,0.03)` |
| 边框 | `rgba(255,255,255,0.06)` |

### 分类颜色

| 分类 | 色值 |
|------|------|
| 🎮 游戏 | `#6c5ce7` |
| 🎬 影视 | `#fd79a8` |
| ⚽ 运动 | `#00b894` |
| 📝 英语 | `#0984e3` |

---

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（本地 D1）
npm run dev

# 初始化本地数据库
npm run db:init

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## ☁️ 部署到 Cloudflare

```bash
# 登录 Cloudflare
npx wrangler login

# 部署到远程
npx wrangler pages deploy

# 初始化远程 D1 数据库（首次）
npm run db:init:remote

# 验证远程数据
npm run db:verify:remote
```

---

## 🔐 数据库结构

### users 表
- `id` / `nickname` / `role` (programmer / artist) / `password_hash` / `avatar_emoji` / `created_at`

### posts 表
- `id` / `author_id` / `title` / `content` (Markdown) / `category` (gaming/movies/sports/english) / `sport_type` / `lang` (zh/en) / `created_at` / `updated_at`

### comments 表
- `id` / `post_id` / `author_id` / `content` / `created_at`

---

## 🌐 国际化

支持 **中/英文** 切换，后端内容按语言字段独立存储，前端 UI 跟随语言设置实时切换。

---

## 📌 进行中的功能

- [ ] 图片上传（计划接入 CF R2）
- [ ] 高级搜索
- [ ] 会员个人主页完善
