/**
 * ============================================
 * 电商评论情感分析 Dashboard - 主应用逻辑
 * 负责：ECharts 图表渲染、数据加载、交互事件
 * 依赖：api.js（API 封装）、echarts.min.js、echarts-wordcloud.min.js
 * ============================================
 */

// ========== 全局状态 ==========
const AppState = {
    // 筛选条件
    filter: {
        cat: '',      // 品类
        label: '',    // 情感标签
        keyword: '',  // 搜索关键词
    },
    // 分页
    pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        pageSize: Api.DEFAULT_PAGE_SIZE,
    },
    // 缓存数据
    cache: {
        statistics: null,
        categories: null,
        keywords: null,
    },
    // ECharts 实例
    charts: {
        pie: null,
        bar: null,
        wordcloud: null,
        categoryRisk: null,
    },
};

// ========== 配色方案 ==========
const COLORS = {
    positive: '#00e676',
    negative: '#ff5252',
    blue: '#4a9eff',
    cyan: '#00d4ff',
    purple: '#b388ff',
    orange: '#ffab40',
    textPrimary: '#e8edf2',
    textSecondary: '#8fa3b8',
    gridLine: '#2a3f52',
};

// ========== 初始化入口 ==========
document.addEventListener('DOMContentLoaded', async function () {
    initDateDisplay();
    initCharts();
    bindEvents();
    await loadAllData();
});

// ========== 日期显示 ==========
function initDateDisplay() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });
    document.getElementById('currentDate').textContent = dateStr;
}

// ========== ECharts 初始化 ==========
function initCharts() {
    // 饼图
    AppState.charts.pie = echarts.init(document.getElementById('pieChart'));
    // 柱状图
    AppState.charts.bar = echarts.init(document.getElementById('barChart'));
    // 词云（先初始化，数据到位后渲染）
    AppState.charts.wordcloud = echarts.init(document.getElementById('wordcloudChart'));

    // 响应式
    window.addEventListener('resize', function () {
        Object.values(AppState.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    });
}

// ========== 事件绑定 ==========
function bindEvents() {
    // 品类筛选
    document.getElementById('filterCat').addEventListener('change', function (e) {
        AppState.filter.cat = e.target.value;
        // 筛选变化时退出搜索模式
        clearSearchMode();
        AppState.pagination.currentPage = 1;
        loadReviews();
    });

    // 情感筛选
    document.getElementById('filterLabel').addEventListener('change', function (e) {
        AppState.filter.label = e.target.value;
        // 筛选变化时退出搜索模式
        clearSearchMode();
        AppState.pagination.currentPage = 1;
        loadReviews();
    });

    // 重置按钮
    document.getElementById('btnReset').addEventListener('click', function () {
        AppState.filter = { cat: '', label: '', keyword: '' };
        AppState.pagination.currentPage = 1;
        document.getElementById('filterCat').value = '';
        document.getElementById('filterLabel').value = '';
        document.getElementById('filterKeyword').value = '';
        clearSearchMode();
        loadReviews();
    });

    // 分页按钮
    document.getElementById('btnPrevPage').addEventListener('click', function () {
        if (AppState.pagination.currentPage > 1) {
            AppState.pagination.currentPage--;
            loadReviews();
        }
    });

    document.getElementById('btnNextPage').addEventListener('click', function () {
        if (AppState.pagination.currentPage < AppState.pagination.totalPages) {
            AppState.pagination.currentPage++;
            loadReviews();
        }
    });

    // 搜索按钮
    document.getElementById('btnSearch').addEventListener('click', function () {
        handleSearch();
    });

    // 回车搜索
    document.getElementById('filterKeyword').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// ========== 关键词搜索 ==========
/**
 * 搜索策略（与词云相同的降级模式）：
 * 1. 优先调用后端 /api/search（C 接入后自动生效）
 * 2. 接口未就绪时，回退"本地演示模式"：
 *    用已就绪的 /api/reviews 拉取一批数据，在前端做关键词过滤，
 *    保证搜索交互可以独立开发、调试和演示
 */
let localSearchCache = null; // { list: [...] } 本地演示模式的搜索结果缓存

/**
 * 退出搜索模式：清空搜索缓存和关键词
 */
function clearSearchMode() {
    localSearchCache = null;
    AppState.filter.keyword = '';
}

async function handleSearch() {
    const keyword = document.getElementById('filterKeyword').value.trim();
    AppState.filter.keyword = keyword;
    AppState.pagination.currentPage = 1;

    // 关键词为空 → 恢复正常列表
    if (!keyword) {
        localSearchCache = null;
        loadReviews();
        return;
    }

    // 第一步：尝试真实接口 /api/search
    AppState.filter.keyword = keyword;

    const result = await Api.searchReviews({
        keyword: keyword,
        cat: AppState.filter.cat,
        label: AppState.filter.label,
        page: AppState.pagination.currentPage,
    });

    if (result.success && result.data && Array.isArray(result.data.list)) {
        localSearchCache = null;
        const { list, total } = result.data;
        AppState.pagination.total = total;
        AppState.pagination.totalPages = Math.ceil(total / AppState.pagination.pageSize) || 1;
        renderReviewList(list);
        updatePaginationUI();
        console.log('[Search] 数据来源：后端 /api/search');
        return;
    }

    // 第二步：接口未就绪 → 本地演示模式（拉取一批数据前端过滤）
    console.log('[Search] /api/search 未就绪，使用本地演示模式');
    await loadLocalSearchDemo(keyword);
}

/**
 * 本地演示模式：
 * 从本地 mock 评论数据做关键词包含过滤（不依赖后端）
 */
async function loadLocalSearchDemo(keyword) {
    const listEl = document.getElementById('reviewList');

    // 显示加载状态
    listEl.innerHTML = `
        <div class="loading-tip">
            <div class="loading-spinner"></div>
            <p>搜索中...</p>
        </div>
    `;

    const all = await ensureLocalReviews();

    if (!all) {
        listEl.innerHTML = `
            <div class="empty-tip">
                <div class="empty-icon">⚠️</div>
                <p>搜索不可用</p>
                <p class="placeholder-sub">本地演示数据加载失败，且后端未连接</p>
            </div>
        `;
        return;
    }

    // 关键词过滤 + 品类/情感筛选
    const lowerKeyword = keyword.toLowerCase();
    let filtered = all.filter(item => {
        const reviewText = (item.review || '').toLowerCase();
        return reviewText.includes(lowerKeyword);
    });

    if (AppState.filter.cat) {
        filtered = filtered.filter(item => item.cat === AppState.filter.cat);
    }
    if (AppState.filter.label !== '' && AppState.filter.label !== undefined) {
        filtered = filtered.filter(item => String(item.label) === String(AppState.filter.label));
    }

    setDataModeTag('本地演示数据');
    localSearchCache = { list: filtered };
    AppState.pagination.total = filtered.length;
    AppState.pagination.totalPages = Math.ceil(filtered.length / AppState.pagination.pageSize) || 1;

    renderCurrentPageFromCache();
    updatePaginationUI();
    console.log(`[Search] 本地演示模式：mock 数据中匹配 ${filtered.length} 条`);
}

/**
 * 从本地搜索缓存渲染当前页
 */
function renderCurrentPageFromCache() {
    if (!localSearchCache) return;

    const { list } = localSearchCache;
    const { currentPage, pageSize } = AppState.pagination;

    const start = (currentPage - 1) * pageSize;
    const pageItems = list.slice(start, start + pageSize);

    renderReviewList(pageItems);
}

// ========== 加载全部数据 ==========
async function loadAllData() {
    // 并行加载统计、品类和品类风险数据
    const [statsResult, catResult, riskResult] = await Promise.all([
        Api.getStatistics(),
        Api.getCategories(),
        Api.getCategoryRisk(),
    ]);
    console.log('[Category Risk] API返回结果：', riskResult);

    if (
        riskResult.success &&
        riskResult.data &&
        Array.isArray(riskResult.data)
    ) {
        renderCategoryRiskChart(riskResult.data);
    } else {
        console.error('[Category Risk] 数据加载失败');
    }

    // 更新 API 连接状态
    updateApiStatus(statsResult.success);

    if (statsResult.success) {
        AppState.cache.statistics = statsResult.data;
        updateKPICards(statsResult.data);
        renderPieChart(statsResult.data);
    } else {
        // 后端未连接 → 降级到本地演示数据
        console.log('[KPI] 后端未连接，使用本地演示数据');
        const mockStats = await loadLocalJson('statistics', 'mock/statistics.json');
        if (mockStats) {
            updateKPICards(mockStats);
            renderPieChart(mockStats);
        } else {
            showError('KPI / 饼图', statsResult.error);
        }
    }

    if (catResult.success) {
        AppState.cache.categories = catResult.data;
        renderBarChart(catResult.data);
        populateCategoryFilter(catResult.data);
        // 更新品类数 KPI
        document.getElementById('kpiCategories').textContent = catResult.data.length;
    } else {
        // 后端未连接 → 降级到本地演示数据
        console.log('[Categories] 后端未连接，使用本地演示数据');
        const mockCats = await loadLocalJson('categories', 'mock/categories.json');
        if (mockCats) {
            AppState.cache.categories = mockCats;
            renderBarChart(mockCats);
            populateCategoryFilter(mockCats);
            document.getElementById('kpiCategories').textContent = mockCats.length;
        } else {
            showError('柱状图 / 品类筛选', catResult.error);
        }
    }

    // 加载评论列表
    await loadReviews();

    // 尝试加载词云数据（如果接口已就绪）
    await tryLoadWordcloud();
}

// ========== API 状态更新 ==========
function updateApiStatus(isOnline) {
    const dot = document.getElementById('apiStatusDot');
    const text = document.getElementById('apiStatusText');

    if (isOnline) {
        dot.className = 'status-dot online';
        text.textContent = '后端已连接';
        text.style.color = COLORS.positive;
    } else {
        dot.className = 'status-dot offline';
        text.textContent = '后端未连接';
        text.style.color = COLORS.negative;
    }
}

// ========== KPI 卡片更新 ==========
function updateKPICards(data) {
    // 数字动画效果
    animateNumber('kpiTotal', data.total || 0);
    animateNumber('kpiPositive', data.positive || 0);
    animateNumber('kpiNegative', data.negative || 0);
}

/**
 * 数字滚动动画
 */
function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (target - startValue) * easeProgress);
        element.textContent = Api.formatNumber(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ========== 饼图：情感占比 ==========
function renderPieChart(data) {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} 条 ({d}%)',
            backgroundColor: 'rgba(26, 39, 51, 0.95)',
            borderColor: COLORS.gridLine,
            textStyle: { color: COLORS.textPrimary },
        },
        legend: {
            bottom: 10,
            textStyle: { color: COLORS.textSecondary, fontSize: 13 },
            itemWidth: 14,
            itemHeight: 14,
        },
        series: [
            {
                name: '情感分布',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#1e2d3d',
                    borderWidth: 3,
                },
                label: {
                    show: true,
                    position: 'outside',
                    formatter: '{b}\n{d}%',
                    color: COLORS.textSecondary,
                    fontSize: 13,
                    lineHeight: 18,
                },
                labelLine: {
                    length: 15,
                    length2: 10,
                    lineStyle: { color: COLORS.gridLine },
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: COLORS.textPrimary,
                    },
                    itemStyle: {
                        shadowBlur: 20,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                data: [
                    {
                        value: data.positive || 0,
                        name: '正面评论',
                        itemStyle: { color: COLORS.positive },
                    },
                    {
                        value: data.negative || 0,
                        name: '负面评论',
                        itemStyle: { color: COLORS.negative },
                    },
                ],
            },
        ],
    };

    AppState.charts.pie.setOption(option);
}

function renderCategoryRiskChart(data) {
    const chartDom = document.getElementById('categoryRiskChart');

    if (!chartDom) {
        console.error('[Category Risk] 找不到 #categoryRiskChart');
        return;
    }

    // 如果之前已经创建过图表，先销毁
    if (AppState.charts.categoryRisk) {
        AppState.charts.categoryRisk.dispose();
    }

    // 初始化 ECharts
    AppState.charts.categoryRisk = echarts.init(chartDom);

    // 按负面率从高到低排序，取 TOP 5
    const top5 = [...data]
        .sort((a, b) => b.negative_rate - a.negative_rate)
        .slice(0, 5);

    // 提取品类名称
    const categories = top5.map(item => item.cat);

    // 提取负面率，并保留两位小数
    const rates = top5.map(item =>
        Number(item.negative_rate.toFixed(2))
    );

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function (params) {
                const item = params[0];

                return `
                    <strong>${item.name}</strong><br/>
                    负面率：${item.value}%
                `;
            }
        },

        grid: {
            left: '15%',
            right: '10%',
            top: '10%',
            bottom: '10%'
        },

        xAxis: {
            type: 'value',
            name: '负面率 (%)',
            axisLabel: {
                formatter: '{value}%'
            }
        },

        yAxis: {
            type: 'category',
            data: categories.reverse()
        },

        series: [
            {
                name: '负面率',
                type: 'bar',
                data: rates.reverse(),

                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c}%'
                }
            }
        ]
    };

    AppState.charts.categoryRisk.setOption(option);
    // 点击柱状图后，获取该品类详细分析
    AppState.charts.categoryRisk.on('click', async function (params) {
        const selectedCat = params.name;

        console.log('[Category Risk] 点击品类：', selectedCat);

        // 使用项目统一的 API 请求函数
        const result = await apiRequest(
            '/api/category-detail',
            {
                cat: selectedCat
            }
        );

        if (result.success) {
            console.log('[Category Detail] 获取成功：', result.data);

            const detail = result.data;

            // 设置标题
            document.getElementById('categoryDetailTitle').textContent =
                `${detail.cat}类商品分析`;

            // 设置基础统计
            document.getElementById('detailTotal').textContent =
                detail.total;

            document.getElementById('detailPositive').textContent =
                detail.positive;

            document.getElementById('detailNegative').textContent =
                detail.negative;

            document.getElementById('detailNegativeRate').textContent =
                `${detail.negative_rate}%`;

            // 生成代表性负面评论
            const reviewsContainer =
                document.getElementById('detailNegativeReviews');

            if (detail.negative_reviews &&
                detail.negative_reviews.length > 0) {

                reviewsContainer.innerHTML =
                    detail.negative_reviews.map(item => `
                        <div class="detail-review-item">
                            ${item.review}
                        </div>
                    `).join('');

            } else {

                reviewsContainer.innerHTML = `
                    <div class="detail-empty">
                        暂无代表性负面评论
                    </div>
                `;
            }

            // 显示弹窗
            document.getElementById('categoryDetailModal').classList.add('show');

        } else {
            console.error(
                '[Category Detail] 获取失败：',
                result.error
            );
        }
    });

    // 关闭品类详情弹窗
    const categoryDetailClose =
        document.getElementById('categoryDetailClose');

    const categoryDetailModal =
        document.getElementById('categoryDetailModal');

    if (categoryDetailClose && categoryDetailModal) {

        categoryDetailClose.addEventListener('click', function () {
            categoryDetailModal.classList.remove('show');
        });

        // 点击弹窗外部区域关闭
        categoryDetailModal.addEventListener('click', function (event) {

            if (event.target === categoryDetailModal) {
                categoryDetailModal.classList.remove('show');
            }

        });
    }
}

// ========== 柱状图：各品类负面评论 ==========
function renderBarChart(categories) {
    // 按负面评论数降序排列
    const sorted = [...categories].sort((a, b) => b.negative - a.negative);

    const catNames = sorted.map(item => item.cat);
    const negativeData = sorted.map(item => item.negative);
    const positiveData = sorted.map(item => item.positive);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(26, 39, 51, 0.95)',
            borderColor: COLORS.gridLine,
            textStyle: { color: COLORS.textPrimary },
            formatter: function (params) {
                let result = `<strong>${params[0].name}</strong><br/>`;
                params.forEach(p => {
                    result += `${p.marker} ${p.seriesName}: ${Api.formatNumber(p.value)} 条<br/>`;
                });
                return result;
            },
        },
        legend: {
            data: ['负面评论', '正面评论'],
            top: 0,
            textStyle: { color: COLORS.textSecondary, fontSize: 12 },
            itemWidth: 14,
            itemHeight: 10,
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            top: '15%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: catNames,
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 11,
                rotate: 30,
                interval: 0,
            },
            axisLine: { lineStyle: { color: COLORS.gridLine } },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            name: '评论数',
            nameTextStyle: { color: COLORS.textSecondary, fontSize: 12 },
            axisLabel: {
                color: COLORS.textSecondary,
                fontSize: 11,
                formatter: function (value) {
                    return value >= 10000 ? (value / 10000).toFixed(1) + 'w' : value;
                },
            },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: COLORS.gridLine, type: 'dashed' } },
        },
        series: [
            {
                name: '负面评论',
                type: 'bar',
                data: negativeData,
                barWidth: '30%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#ff5252' },
                        { offset: 1, color: '#b71c1c' },
                    ]),
                    borderRadius: [4, 4, 0, 0],
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#ff8a80' },
                            { offset: 1, color: '#ff5252' },
                        ]),
                    },
                },
            },
            {
                name: '正面评论',
                type: 'bar',
                data: positiveData,
                barWidth: '30%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#00e676' },
                        { offset: 1, color: '#00c853' },
                    ]),
                    borderRadius: [4, 4, 0, 0],
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#69f0ae' },
                            { offset: 1, color: '#00e676' },
                        ]),
                    },
                },
            },
        ],
    };

    AppState.charts.bar.setOption(option);
}

// ========== 词云：差评关键词 ==========
/**
 * 词云数据加载策略：
 * 1. 优先调用后端 /api/keywords 接口（C 接入后自动生效）
 * 2. 接口未就绪时，回退读取本地 mock 数据（B 提供的 top50_keywords.json）
 *    保证前端可以独立开发、调试和演示
 */
async function tryLoadWordcloud() {
    // 第一步：尝试后端接口
    const result = await Api.getKeywords({ top: 50 });

    if (result.success && result.data && result.data.length > 0) {
        AppState.cache.keywords = result.data;
        renderWordcloud(result.data);
        document.getElementById('wordcloudTag').textContent = 'Top 50 已加载';
        const placeholder = document.getElementById('wordcloudPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        console.log('[Wordcloud] 数据来源：后端 /api/keywords');
        return;
    }

    // 第二步：接口未就绪，回退到本地 mock 数据
    const mockData = await loadLocalJson('keywords', 'mock/top50_keywords.json');
    if (mockData && mockData.length > 0) {
        AppState.cache.keywords = mockData;
        renderWordcloud(mockData);
        document.getElementById('wordcloudTag').textContent = 'Top 50 已加载（本地预览）';
        const placeholder = document.getElementById('wordcloudPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        console.log('[Wordcloud] 数据来源：本地 mock（/api/keywords 尚未接入）');
        return;
    }

    // 兜底：都不可用时保持占位
    console.log('[Wordcloud] 词云数据暂不可用，保持占位');
}

function renderWordcloud(keywords) {
    const option = {
        tooltip: {
            show: true,
            formatter: function (params) {
                return `${params.name}: 出现 ${params.value} 次`;
            },
            backgroundColor: 'rgba(26, 39, 51, 0.95)',
            borderColor: COLORS.gridLine,
            textStyle: { color: COLORS.textPrimary },
        },

        series: [
            {
                type: 'wordCloud',
                shape: 'circle',
                left: 'center',
                top: 'center',
                width: '90%',
                height: '90%',
                sizeRange: [14, 60],
                rotationRange: [-45, 45],
                rotationStep: 15,
                gridSize: 8,
                drawOutOfBound: false,
                layoutAnimation: true,

                textStyle: {
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    color: function () {
                        const palette = [
                            '#4a9eff', '#00d4ff', '#00e676', '#ffab40',
                            '#ff5252', '#b388ff', '#ff80ab', '#64ffda',
                        ];

                        return palette[Math.floor(Math.random() * palette.length)];
                    },
                },

                emphasis: {
                    textStyle: {
                        textShadowBlur: 10,
                        textShadowColor: '#333',
                    },
                },

                data: keywords.map(item => ({
                    name: item.name,
                    value: item.value,
                })),
            },
        ],
    };

    // 绘制词云
    AppState.charts.wordcloud.setOption(option);

    // 点击关键词 → 自动筛选负面评论
    AppState.charts.wordcloud.off('click');

    AppState.charts.wordcloud.on('click', function (params) {
        const selectedKeyword = params.name;

        console.log('[Wordcloud] 点击关键词：', selectedKeyword);

        // 设置关键词筛选条件
        AppState.filter.keyword = selectedKeyword;

        // 只查看负面评论
        AppState.filter.label = '0';

        // 保留当前品类
        // 如果之前点击了“蒙牛”，这里仍然会保留蒙牛
        AppState.filter.cat = AppState.filter.cat || '';

        // 从第一页开始
        AppState.pagination.currentPage = 1;

        // 同步更新页面筛选框
        const filterCat = document.getElementById('filterCat');
        const filterLabel = document.getElementById('filterLabel');
        const filterKeyword = document.getElementById('filterKeyword');

        if (filterCat) {
            filterCat.value = AppState.filter.cat;
        }

        if (filterLabel) {
            filterLabel.value = '0';
        }

        if (filterKeyword) {
            filterKeyword.value = selectedKeyword;
        }

        // 加载筛选后的评论
        loadReviews();

        // 自动滚动到评论列表
        const reviewList = document.getElementById('reviewList');

        if (reviewList) {
            reviewList.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}

// ========== 品类筛选下拉框填充 ==========
function populateCategoryFilter(categories) {
    const select = document.getElementById('filterCat');
    // 保留第一个"全部品类"选项
    select.innerHTML = '<option value="">全部品类</option>';

    categories.forEach(item => {
        const option = document.createElement('option');
        option.value = item.cat;
        option.textContent = item.cat;
        select.appendChild(option);
    });
}

// ========== 本地 mock 数据工具 ==========
/**
 * 读取本地演示数据（演示模式使用）
 * 优先级：内联 MOCK_DATA（js/mock-data.js，双击打开也能用）→ fetch mock/ 目录 JSON
 * @param {string} key - MOCK_DATA 中的键名（statistics/categories/reviews/keywords）
 * @param {string} filePath - 对应的 mock 目录文件路径（兜底用）
 */
async function loadLocalJson(key, filePath) {
    // 优先使用内联数据（file:// 协议下 fetch 会被浏览器拦截）
    if (window.MOCK_DATA && window.MOCK_DATA[key]) {
        return window.MOCK_DATA[key];
    }

    // 兜底：尝试 fetch mock 目录 JSON
    try {
        const response = await fetch(filePath);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn(`[Mock] 本地文件 ${filePath} 加载失败:`, error.message);
        return null;
    }
}

/**
 * 本地评论数据缓存（演示模式用，从 mock/reviews.json 读取）
 */
let localReviewsCache = null;

async function ensureLocalReviews() {
    if (localReviewsCache) return localReviewsCache;
    const data = await loadLocalJson('reviews', 'mock/reviews.json');
    if (data && Array.isArray(data) && data.length > 0) {
        localReviewsCache = data;
        return data;
    }
    return null;
}

/**
 * 设置数据来源标识标签
 */
function setDataModeTag(text) {
    const tag = document.getElementById('dataModeTag');
    if (tag) {
        if (text) {
            tag.textContent = text;
            tag.style.display = 'inline-block';
        } else {
            tag.style.display = 'none';
        }
    }
}

// ========== 评论列表加载 ==========
async function loadReviews() {
    const listEl = document.getElementById('reviewList');

    // 处于本地搜索模式时，分页从缓存取
    if (localSearchCache) {
        renderCurrentPageFromCache();
        updatePaginationUI();
        return;
    }

    // 显示加载状态
    listEl.innerHTML = `
        <div class="loading-tip">
            <div class="loading-spinner"></div>
            <p>加载评论中...</p>
        </div>
    `;

    let result;

    // 当前存在关键词搜索
    if (AppState.filter.keyword) {

        result = await Api.searchReviews({
            keyword: AppState.filter.keyword,
            cat: AppState.filter.cat,
            label: AppState.filter.label,
            page: AppState.pagination.currentPage,
        });

    } 
    // 普通评论浏览
    else {

        result = await Api.getReviews({
            cat: AppState.filter.cat,
            label: AppState.filter.label,
            page: AppState.pagination.currentPage,
            size: AppState.pagination.pageSize,
        });

    }

    if (result.success) {
        setDataModeTag('');
        const { list, total, page } = result.data;
        AppState.pagination.total = total;
        AppState.pagination.currentPage = page || AppState.pagination.currentPage;
        AppState.pagination.totalPages = Math.ceil(total / AppState.pagination.pageSize) || 1;

        renderReviewList(list);
        updatePaginationUI();
    } else {
        // 后端未连接 → 降级到本地演示数据
        const mockList = await ensureLocalReviews();
        if (mockList) {
            setDataModeTag('本地演示数据');
            let filtered = mockList;

            if (AppState.filter.cat) {
                filtered = filtered.filter(item => item.cat === AppState.filter.cat);
            }
            if (AppState.filter.label !== '' && AppState.filter.label !== undefined) {
                filtered = filtered.filter(item => String(item.label) === String(AppState.filter.label));
            }

            AppState.pagination.total = filtered.length;
            AppState.pagination.totalPages = Math.ceil(filtered.length / AppState.pagination.pageSize) || 1;

            const start = (AppState.pagination.currentPage - 1) * AppState.pagination.pageSize;
            const pageItems = filtered.slice(start, start + AppState.pagination.pageSize);

            renderReviewList(pageItems);
            updatePaginationUI();
            console.log('[Reviews] 后端未连接，使用本地演示数据');
            return;
        }

        setDataModeTag('');
        listEl.innerHTML = `
            <div class="empty-tip">
                <div class="empty-icon">⚠️</div>
                <p>评论加载失败</p>
                <p class="placeholder-sub">${result.error}</p>
                <p class="placeholder-sub">请确认 Flask 后端已启动（默认端口 5000）</p>
            </div>
        `;
        document.getElementById('reviewTotal').textContent = '0';
        document.getElementById('reviewCurrentPage').textContent = '1';
        document.getElementById('reviewTotalPages').textContent = '1';
    }
}

// ========== 评论列表渲染 ==========
function renderReviewList(list) {
    const listEl = document.getElementById('reviewList');

    if (!list || list.length === 0) {
        listEl.innerHTML = `
            <div class="empty-tip">
                <div class="empty-icon">📭</div>
                <p>暂无符合条件的评论</p>
                <p class="placeholder-sub">试试调整筛选条件</p>
            </div>
        `;
        return;
    }

    let html = '';
    list.forEach((review, index) => {
        const isPositive = review.label === 1 || review.label === '1';
        const labelClass = isPositive ? 'positive' : 'negative';
        const labelText = isPositive ? '正面' : '负面';

        html += `
            <div class="review-item ${labelClass}">
                <div class="review-meta">
                    <span class="review-cat">${escapeHtml(review.cat || '未知品类')}</span>
                    <span class="review-label ${labelClass}">${labelText}</span>
                </div>
                <div class="review-text">${escapeHtml(review.review || '')}</div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

// ========== 分页 UI 更新 ==========
function updatePaginationUI() {
    const { currentPage, totalPages, total } = AppState.pagination;

    document.getElementById('reviewTotal').textContent = Api.formatNumber(total);
    document.getElementById('reviewCurrentPage').textContent = currentPage;
    document.getElementById('reviewTotalPages').textContent = totalPages;

    // 上一页/下一页按钮状态
    document.getElementById('btnPrevPage').disabled = currentPage <= 1;
    document.getElementById('btnNextPage').disabled = currentPage >= totalPages;

    // 页码按钮
    renderPageNumbers();
}

function renderPageNumbers() {
    const container = document.getElementById('pageNumbers');
    const { currentPage, totalPages } = AppState.pagination;

    let html = '';
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
        // 页数少，全部显示
        for (let i = 1; i <= totalPages; i++) {
            html += createPageNumber(i, i === currentPage);
        }
    } else {
        // 页数多，显示省略号
        html += createPageNumber(1, currentPage === 1);

        if (currentPage > 3) {
            html += '<span class="page-ellipsis">...</span>';
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            html += createPageNumber(i, i === currentPage);
        }

        if (currentPage < totalPages - 2) {
            html += '<span class="page-ellipsis">...</span>';
        }

        html += createPageNumber(totalPages, currentPage === totalPages);
    }

    container.innerHTML = html;

    // 绑定页码点击事件
    container.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = parseInt(this.dataset.page);
            if (page !== AppState.pagination.currentPage) {
                AppState.pagination.currentPage = page;
                loadReviews();
            }
        });
    });
}

function createPageNumber(page, isActive) {
    return `<span class="page-number ${isActive ? 'active' : ''}" data-page="${page}">${page}</span>`;
}

// ========== 工具函数 ==========

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 显示错误提示
 */
function showError(area, error) {
    console.error(`[Error] ${area}: ${error}`);
}

// ========== 导出（供调试） ==========
window.App = {
    state: AppState,
    loadAllData,
    loadReviews,
    renderPieChart,
    renderBarChart,
    renderWordcloud,
};
