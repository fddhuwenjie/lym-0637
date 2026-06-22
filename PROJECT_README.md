# 员工培训考试与证书到期提醒系统

## 一、项目用途

本系统用于企业人事部门管理员工培训课程、在线考试、岗位资质认证和证书有效期跟踪，实现从课程报名、学习进度跟踪、在线考试、自动判分、补考管理、证书发放到到期提醒的完整闭环，确保员工岗位资质合规。

### 核心解决问题
- 培训管理流程繁琐，人工跟踪效率低
- 考试判分工作量大，补考管理混乱
- 证书到期遗忘，岗位资质合规风险
- 数据分散，员工达标状态不透明

---

## 二、启动方式

### 环境要求
- Node.js >= 18
- npm 或 pnpm

### 启动步骤

```bash
# 1. 进入项目目录
cd lym-0637

# 2. 安装依赖
npm install

# 3. 同时启动前端和后端（推荐）
npm run dev

# 或分别启动：
# 启动后端 API 服务（端口 3001）
npm run server:dev

# 启动前端开发服务（端口 5173）
npm run client:dev
```

### 访问地址
- 前端应用：http://localhost:5173
- 后端 API：http://localhost:3001/api

### 预设账号
登录页点击角色卡片即可登录，无需密码：
- **人事管理员**：张经理（HR）
- **员工**：李明（安全工程师）、王芳（质量管理员）、陈伟（安全工程师）

---

## 三、验收路径

### 3.1 正常主流程验收

#### 路径 1：员工报名、学习、考试、获证
1. 以员工「李明」身份登录 → /emp/dashboard
2. 进入「学习中心」→ /emp/learning
3. 浏览「可报名课程」Tab，点击课程的「报名」按钮
4. 切换到「已报名课程」Tab，点击「继续学习」增加学习进度（每次 +25%）
5. 学习进度达到 100% 后，「参加考试」按钮解锁
6. 进入「考试中心」→ /emp/exams，点击「开始考试」
7. 答题完成后提交，系统自动判分，显示成绩
8. 成绩 ≥ 及格线 → 自动生成证书，进入「我的证书」→ /emp/certificates 查看

#### 路径 2：人事管理配置
1. 以「张经理」身份登录 → /hr/dashboard
2. 「课程管理」→ 创建新课程、编辑课程信息
3. 「题库管理」→ 按课程添加题目（单选/多选/判断），编辑题目时版本号自动 +1
4. 「岗位管理」→ 创建岗位、设置必修课程、所需证书课程、最大补考次数
5. 「证书配置」→ 设置各课程证书有效期和提醒天数

#### 路径 3：补考流程
1. 员工参加考试未通过
2. 考试中心显示「参加补考」按钮
3. 点击补考 → 重新生成试卷 → 考试通过后覆盖原不合格记录
4. 补考次数达到岗位配置的 maxRetakeCount 后，按钮禁用

#### 路径 4：证书续期
1. 「我的证书」中查看即将到期或已过期的证书
2. 点击「续期考试」→ 重新参加考试
3. 通过后生成新版本证书（version++），旧版本保留为历史

#### 路径 5：数据导出
1. HR 进入「数据导出」→ /hr/export
2. 点击导出按钮：
   - 岗位达标报告
   - 考试成绩报告
   - 证书状态报告
   - 到期提醒记录
3. CSV 文件自动下载，同时记录到导出历史列表

### 3.2 拦截逻辑验收（关键验证点）

| # | 拦截场景 | 操作方式 | 预期结果 |
|---|----------|----------|----------|
| 1 | 未完成课程参加考试 | 学习进度 < 100% 点击「参加考试」 | 按钮禁用并提示"需先完成课程学习" |
| 2 | 重复提交试卷 | 对已提交的考试再次调用提交接口 | 返回错误"试卷已提交，不可重复提交" |
| 3 | 补考次数超限 | 同一课程考试失败超过岗位 maxRetakeCount 次 | 「参加补考」按钮禁用，提示"补考次数已达上限" |
| 4 | 岗位必修课缺失 | HR 达标看板查看未完成必修课程的员工 | 该行红色高亮，missingCourses 列出缺失课程 |
| 5 | 过期证书用于岗位达标 | 员工持有已过期证书，计算岗位达标时 | 该证书不计入达标条件，isPositionCompliant=false |

### 3.3 特殊验收点

#### 题库版本变更
- 操作：HR 在题库管理中编辑已有题目并保存
- 验证：题目 version 字段 +1；旧考试记录的 questionVersion 保持不变；新考试使用最新版本号

#### 补考成绩覆盖
- 操作：员工首次考试不合格 → 补考通过
- 验证：考试明细中最新记录为通过状态；证书基于最新通过记录发放；历史不合格记录保留可查

#### 证书续期
- 操作：在「我的证书」中对即将到期证书点击续期 → 通过考试
- 验证：生成 version+1 的新证书；旧证书状态保留；新证书有效期从续期通过日重新计算

#### 数据持久化（重启可查）
- 操作：进行任意数据变更（报名、考试、创建课程等）→ 重启服务
- 验证：重启后 data/*.json 文件保留变更，所有学习进度、成绩、证书状态、导出历史均可查

---

## 四、关键数据流转

### 4.1 系统数据流架构

```
用户操作 → 前端页面(React) → API请求 → Express路由层
                                     ↓
                              业务逻辑层(businessService)
                                     ↓
                              数据持久化层(dataStore)
                                     ↓
                              data/*.json 文件
```

### 4.2 核心数据实体流转

#### 课程与题库数据流
```
HR创建课程(Course) → 添加题目(Question, version=1) → 员工报名(Enrollment)
   ↓                                                    ↓
编辑题目(version++)                          学习进度更新(progress: 0→100)
   ↓                                                    ↓
旧考试引用旧version                           解锁考试资格
```

#### 考试成绩流转
```
开始考试(startExam) → 生成ExamAttempt(attemptNumber=N, submitted=false)
        ↓
答题并提交(submitExam) → 自动判分(calculateScore)
        ↓
passed=true → 生成Certificate → 加入有效期追踪
passed=false → 记录成绩 → 可补考(attemptNumber+1)
```

#### 证书状态流转
```
发证(Certificate, status='valid')
    ↓
到期前N天 → 生成Reminder(type='expiring_30d'/'expiring_7d', status='expiring')
    ↓
超过expiresAt → Certificate.status='expired' + Reminder(type='expired')
    ↓
续期考试通过 → 生成新Certificate(version++)
```

#### 岗位达标计算流
```
员工User + 岗位Position
    ↓
检查requiredCourseIds中每门课
    ├─ 是否有Enrollment且progress=100%
    └─ 是否有已通过的ExamAttempt(passed=true)
    ↓
检查requiredCertificateCourseIds中每门课
    └─ 是否有Certificate且status='valid'(过期拦截)
    ↓
输出 ComplianceRecord { isPositionCompliant, missingCourses, expiredCertificates }
```

### 4.3 数据存储文件

所有数据存储于 `data/` 目录（首次启动时自动生成初始数据）：

| 文件 | 内容 |
|------|------|
| users.json | 用户列表（HR和员工） |
| positions.json | 岗位定义及要求 |
| courses.json | 课程信息及证书配置 |
| questions.json | 题库题目（含版本号） |
| enrollments.json | 报名记录及学习进度 |
| examAttempts.json | 考试记录及成绩 |
| certificates.json | 证书记录及状态 |
| reminders.json | 到期提醒记录 |
| exportHistory.json | 导出历史记录 |

---

## 五、目录结构说明

```
lym-0637/
├── api/                       # 后端 Express
│   ├── routes/                # API 路由
│   │   ├── users.ts
│   │   ├── courses.ts
│   │   ├── questions.ts
│   │   ├── positions.ts
│   │   ├── enrollments.ts
│   │   ├── exams.ts
│   │   ├── certificates.ts
│   │   ├── reminders.ts
│   │   ├── compliance.ts
│   │   └── export.ts
│   ├── services/              # 业务逻辑与数据层
│   │   ├── businessService.ts # 核心业务规则
│   │   └── dataStore.ts       # JSON 文件持久化
│   ├── app.ts
│   └── server.ts
├── data/                      # 数据存储（自动生成）
├── shared/
│   └── types.ts               # 前后端共享类型定义
├── src/                       # 前端 React
│   ├── api/                   # API 客户端
│   ├── components/
│   │   ├── Layout/            # AppLayout, Sidebar, Header
│   │   └── common/            # StatCard, Table, Modal, Badge, ProgressBar
│   ├── pages/
│   │   ├── hr/                # HR 管理页面（8个）
│   │   ├── employee/          # 员工页面（4个）
│   │   └── Login.tsx
│   ├── stores/                # Zustand 状态管理
│   ├── App.tsx                # 路由配置
│   └── main.tsx
└── .trae/documents/           # 需求和技术文档
```
