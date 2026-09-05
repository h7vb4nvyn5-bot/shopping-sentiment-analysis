# 前端 Dashboard - 电商商品评论情感分析可视化系统

> D 角色负责模块 | 技术栈：HTML + CSS + JavaScript + ECharts 5

## 一、模块概述

本模块为系统的交互层，负责将 Flask 后端返回的 JSON 数据以可视化图表形式展示，提供单页 Dashboard 五区布局：

| 区域 | 功能 | 对接接口 | 状态 |
|------|------|----------|------|
| 顶部 KPI 区 | 总评论数、正面/负面数、品类数 | `/api/statistics` | ✅ 已完成 |
| 情感占比区 | 正面/负面环形饼图 | `/api/statistics` | ✅ 已完成 |
| 类别差评区 | 各品类负面/正面评论柱状图 | `/api/categories` | ✅ 已完成 |
| 差评关键词区 | Top 50 词云 | `/api/keywords` | ⏳ 待 B 提供数据后接入 |
| 评论搜索区 | 品类筛选 + 情感筛选 + 分页列表 | `/api/reviews` | ✅ 已完成 |
| 评论搜索区 | 关键词全文搜索 | `/api/search` | ⏳ 待 C 完成接口后接入 |

## 二、目录结构

```
frontend/
├── index.html          # 主页面（Dashboard 五区布局）
├── css/
│   └── style.css       # 样式表（深蓝灰主题 + 响应式）
├── js/
│   ├── api.js          # API 调用封装（5 个接口，含 2 个预留）
│   └── app.js          # 主应用逻辑（ECharts 渲染 + 交互 + 分页）
└── README.md           # 本文件
```

## 三、接口契约（与 C 约定，v1.0）

### 3.1 已接入接口

#### GET /api/statistics
- **入参**：无
- **返回**：
```json
{
  "total": 62774,
  "positive": 32000,
  "negative": 30774
}
```

#### GET /api/categories
- **入参**：无
- **返回**：
```json
[
  { "cat": "手机", "positive": 5000, "negative": 3000 },
  { "cat": "服装", "positive": 4000, "negative": 2500 }
]
```

#### GET /api/reviews
- **入参**：
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | cat | string | 否 | 商品品类筛选 |
  | label | string/number | 否 | 情感标签：1=正面, 0=负面 |
  | page | number | 否 | 页码，默认 1 |
  | size | number | 否 | 每页条数，默认 10 |
- **返回**：
```json
{
  "list": [
    { "cat": "手机", "label": 1, "review": "手机质量很好..." }
  ],
  "total": 100,
  "page": 1
}
```

### 3.2 预留接口（代码已封装，待后端就绪自动启用）

#### GET /api/keywords
- **入参**：`cat`（可选）、`top`（默认 50）
- **返回**：`[{ "name": "质量", "value": 523 }, ...]`
- **状态**：等待 B 提供 `top50_keywords.json` → C 接入 Flask → 前端自动渲染词云

#### GET /api/search
- **入参**：`keyword`（必填）、`cat`（可选）、`page`（可选）
- **返回**：`{ "list": [...], "total": 100 }`
- **状态**：Day 6（09.08）由 C 基于 MongoDB `$text` 全文索引完成

## 四、运行方式

### 4.1 前置条件
1. Flask 后端已启动（默认 `http://127.0.0.1:5000`）
2. MongoDB 数据已导入（62,774 条）
3. 浏览器可访问互联网（ECharts 通过 CDN 加载）

### 4.2 启动前端
前端为纯静态页面，无需构建：

**方式一：直接打开**
```
双击 index.html 即可在浏览器中打开
```

**方式二：本地 HTTP 服务（推荐，避免 CORS 问题）**
```bash
# Python 3
cd frontend
python -m http.server 8080

# 然后访问 http://127.0.0.1:8080
```

### 4.3 修改后端地址
如 Flask 后端不在默认地址，编辑 `js/api.js` 第 12 行：
```javascript
const API_BASE_URL = 'http://127.0.0.1:5000';  // 修改为实际地址
```

## 五、功能特性

### 5.1 已实现
- ✅ 顶部 4 张 KPI 卡片（数字滚动动画）
- ✅ 情感占比环形饼图（渐变色 + 悬浮提示）
- ✅ 各品类正/负面评论对比柱状图（渐变 + 排序）
- ✅ 评论列表（品类筛选 + 情感筛选 + 分页）
- ✅ 分页组件（页码 + 上一页/下一页 + 省略号）
- ✅ API 连接状态指示器（实时显示后端是否在线）
- ✅ 加载动画 + 空数据提示 + 错误提示
- ✅ 响应式布局（适配桌面/平板/手机）
- ✅ 深蓝灰专业主题配色

### 5.2 待接入（代码预留，数据到位后自动启用）
- ⏳ 差评关键词 Top 50 词云（`/api/keywords`）
- ⏳ 关键词全文搜索框（`/api/search`）

## 六、前后端联调注意事项

1. **CORS 跨域**：Flask 后端需启用 CORS（`flask-cors`），否则浏览器会拦截请求
2. **字段对齐**：前端严格按接口契约解析，如后端字段名变更需同步更新 `js/api.js`
3. **数据类型**：`label` 字段前端兼容数字（1/0）和字符串（"1"/"0"）
4. **分页约定**：前端默认 `size=10`，后端需支持 `page` 和 `size` 参数
5. **词云数据格式**：必须为 `[{name, value}, ...]` 数组，`value` 为词频数字

## 七、Git 提交规范

```
[frontend] 做了什么
示例：
[frontend] add Dashboard five-region layout
[frontend] integrate /api/statistics and /api/categories
[frontend] add review list with pagination
```

分支：`feat/d-frontend`

## 八、DDL 进度

| 日期 | 计划产出 | 状态 |
|------|----------|------|
| 09.05 (Day3) | 页面框架 + 情感饼图 | ✅ 已完成（超额：柱状图+评论列表也完成） |
| 09.06 (Day4) | 柱状图 + 评论列表 | ✅ 已提前完成 |
| 09.07 (Day5) | 词云 | ⏳ 待 B 提供 top50_keywords.json |
| 09.08 (Day6) | 搜索框 + 类别筛选联动 | ⏳ 待 C 完成 /api/search |
| 09.09 (Day7) | 第一版完整页面（全链路跑通） | 📅 待联调 |
| 09.11 (Day9) | 界面美化完成 | 🔄 进行中（基础美化已完成） |
| 09.15 (Day13) | PPT 初稿 | 📅 待开始 |
| 09.16 (Day14) | PPT 定稿 | 📅 待开始 |
| 09.17 (Day15) | 演示视频录制完成 | 📅 待开始 |

## 九、联系方式与协作

- **D（前端）**：本模块负责人
- **C（后端）**：接口对接 / 联调
- **B（Spark+jieba）**：top50_keywords.json 提供方
- **A（数据+MongoDB）**：数据质量 / 索引确认

每日 21:00 站会同步进度，阻塞项及时在群内反馈。
