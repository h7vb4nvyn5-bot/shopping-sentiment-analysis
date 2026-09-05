/**
 * ============================================
 * 电商评论情感分析系统 - API 调用封装
 * 对接 Flask 后端 REST 接口
 * 接口契约版本：v1.0（与 C 约定）
 * ============================================
 */

// API 基础地址（Flask 默认端口 5000）
// 如后端部署在其他地址，修改此处即可
const API_BASE_URL = 'http://127.0.0.1:5000';

// 每页默认评论数
const DEFAULT_PAGE_SIZE = 10;

/**
 * 通用请求封装
 * @param {string} endpoint - API 路径
 * @param {object} params - 查询参数
 * @returns {Promise<object>} 返回 JSON 数据
 */
async function apiRequest(endpoint, params = {}) {
    const url = new URL(API_BASE_URL + endpoint);

    // 拼接查询参数（过滤空值）
    Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * ============================================
 * 已完成接口（C 端已开发并测试）
 * ============================================
 */

/**
 * API 1: 获取统计概览
 * GET /api/statistics
 * 返回：{ total, positive, negative }
 */
async function getStatistics() {
    return apiRequest('/api/statistics');
}

/**
 * API 2: 获取各品类情感统计
 * GET /api/categories
 * 返回：[{ cat, positive, negative }, ...]
 */
async function getCategories() {
    return apiRequest('/api/categories');
}

/**
 * API 3: 获取评论列表（支持筛选 + 分页）
 * GET /api/reviews
 * @param {object} options - 筛选选项
 * @param {string} options.cat - 商品品类（可选）
 * @param {string|number} options.label - 情感标签：1=正面, 0=负面（可选）
 * @param {number} options.page - 页码，默认 1
 * @param {number} options.size - 每页条数，默认 10
 * 返回：{ list: [{cat, label, review}], total, page }
 */
async function getReviews(options = {}) {
    const params = {
        cat: options.cat || '',
        label: options.label !== undefined && options.label !== '' ? options.label : '',
        page: options.page || 1,
        size: options.size || DEFAULT_PAGE_SIZE,
    };
    return apiRequest('/api/reviews', params);
}

/**
 * ============================================
 * 待接入接口（预留，后续开发）
 * ============================================
 */

/**
 * API 4: 差评关键词 Top 50（词云）
 * GET /api/keywords
 * @param {object} options - 选项
 * @param {string} options.cat - 按品类筛选（可选）
 * @param {number} options.top - 返回前 N 个，默认 50
 * 返回：[{ name, value }, ...]
 *
 * 状态：等待 B 提供 top50_keywords.json 后，由 C 接入 Flask
 *       完成后取消下方注释即可使用
 */
async function getKeywords(options = {}) {
    const params = {
        cat: options.cat || '',
        top: options.top || 50,
    };
    return apiRequest('/api/keywords', params);
}

/**
 * API 5: 关键词全文搜索
 * GET /api/search
 * @param {object} options - 搜索选项
 * @param {string} options.keyword - 搜索关键词（必填）
 * @param {string} options.cat - 品类筛选（可选）
 * @param {number} options.page - 页码，默认 1
 * 返回：{ list: [{cat, label, review}], total }
 *
 * 状态：Day 6（09.08）由 C 完成，基于 MongoDB $text 全文索引
 *       完成后取消下方注释即可使用
 */
async function searchReviews(options = {}) {
    const params = {
        keyword: options.keyword || '',
        cat: options.cat || '',
        page: options.page || 1,
    };
    return apiRequest('/api/search', params);
}

/**
 * ============================================
 * 工具函数
 * ============================================
 */

/**
 * 检测后端 API 是否可用
 * @returns {Promise<boolean>}
 */
async function checkApiHealth() {
    const result = await getStatistics();
    return result.success;
}

/**
 * 格式化数字（加千分位）
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '--';
    return num.toLocaleString('zh-CN');
}

// 导出到全局作用域
window.Api = {
    getStatistics,
    getCategories,
    getReviews,
    getKeywords,
    searchReviews,
    checkApiHealth,
    formatNumber,
    API_BASE_URL,
    DEFAULT_PAGE_SIZE,
};
