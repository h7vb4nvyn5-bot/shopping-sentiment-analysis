/**
 * ============================================
 * 本地演示数据（Mock Data）
 * 用途：后端接口未就绪时，前端自动读取本文件渲染，保证页面可独立演示
 * 说明：以下数据均为演示示例（KPI/品类数字非数据库真实统计），
 *       接入后端后自动以 MongoDB 真实数据为准，本文件不影响正式数据
 * ============================================
 */
window.MOCK_DATA = {
    /**
     * 对应 /api/statistics
     * total 使用数据集真实总量 62,774；positive/negative 为演示示例分布
     */
    statistics: {
        total: 62774,
        positive: 32110,
        negative: 30664,
    },

    /**
     * 对应 /api/categories（10 品类，演示示例分布）
     */
    categories: [
        { cat: '手机', positive: 4210, negative: 1890 },
        { cat: '平板', positive: 2980, negative: 1120 },
        { cat: '电脑', positive: 2750, negative: 1350 },
        { cat: '服装', positive: 3520, negative: 1580 },
        { cat: '酒店', positive: 2600, negative: 2400 },
        { cat: '水果', positive: 3050, negative: 2050 },
        { cat: '洗发水', positive: 3180, negative: 920 },
        { cat: '蒙牛', positive: 2780, negative: 1320 },
        { cat: '书籍', positive: 3350, negative: 750 },
        { cat: '热水器', positive: 1690, negative: 1410 },
    ],

    /**
     * 对应 /api/reviews（示例评论，覆盖 10 品类和正负情感）
     */
    reviews: [
        { cat: '手机', label: 0, review: '手机质量太差了，用了不到一个月屏幕就坏了，客服态度也不好，申请退货还要自己出运费。' },
        { cat: '手机', label: 1, review: '手机物流很快，第二天就到了，包装很严实，质量也不错，客服态度很好。' },
        { cat: '手机', label: 0, review: '物流太慢了，等了整整一周才收到，而且包装都被压坏了，体验很差。' },
        { cat: '服装', label: 0, review: '衣服质量不行，洗了一次就变形了，客服说是正常现象，太失望了。' },
        { cat: '服装', label: 1, review: '衣服质量很好，面料舒服，物流也快，满意的一次购物。' },
        { cat: '酒店', label: 0, review: '房间卫生很差，前台服务态度不好，早餐质量也一般，入住体验很失望。' },
        { cat: '酒店', label: 1, review: '酒店环境不错，房间很干净，前台服务员态度很好，早餐也很丰富。' },
        { cat: '水果', label: 0, review: '水果质量太差了，收到的很多都烂了，客服态度也不好，太失望了。' },
        { cat: '水果', label: 1, review: '水果很新鲜，物流很快，包装也仔细，味道不错，还会回购。' },
        { cat: '电脑', label: 0, review: '电脑开机很慢，屏幕有亮点，联系客服处理了很久，态度也不好。' },
        { cat: '电脑', label: 1, review: '电脑质量不错，开机速度快，屏幕显示清晰，物流包装都很到位。' },
        { cat: '平板', label: 0, review: '平板续航太差，电池一下就没了，客服说正常，实在是不满意。' },
        { cat: '平板', label: 1, review: '平板屏幕清晰，运行流畅，物流很快，价格也实惠，满意。' },
        { cat: '洗发水', label: 0, review: '洗发水味道很怪，洗了头皮发痒，质量堪忧，不敢再用。' },
        { cat: '洗发水', label: 1, review: '洗发水味道不错，洗完头发很顺滑，包装严实，物流也快。' },
        { cat: '蒙牛', label: 0, review: '牛奶包装破损，收到时已经漏了，客服处理态度差，很失望。' },
        { cat: '蒙牛', label: 1, review: '牛奶味道纯正，日期新鲜，包装完好，物流速度快，满意。' },
        { cat: '书籍', label: 0, review: '书籍印刷质量差，有缺页，客服说不能退货，很失望。' },
        { cat: '书籍', label: 1, review: '书籍包装完好，印刷清晰，物流很快，内容也很不错。' },
        { cat: '热水器', label: 0, review: '热水器安装服务很差，师傅态度不好，设备质量也一般。' },
        { cat: '热水器', label: 1, review: '热水器质量不错，加热快，安装师傅服务态度很好，满意。' },
        { cat: '手机', label: 0, review: '收到的手机是假货，系统很卡，找客服退货还被拒绝，垃圾商家。' },
        { cat: '服装', label: 0, review: '裤子尺码不准，客服态度很差，退货流程麻烦，体验不好。' },
        { cat: '酒店', label: 0, review: '酒店设施陈旧，电话联系前台很久没人接，晚上还很吵，不满意。' },
        { cat: '水果', label: 1, review: '水果分量足，味道好，包装仔细，快递很给力，还会再来。' },
        { cat: '手机', label: 1, review: '手机外观漂亮，手感很好，系统流畅，价格实在，非常满意。' },
        { cat: '电脑', label: 0, review: '电脑配置与描述不符，跑分很低，客服推卸责任，非常失望。' },
        { cat: '酒店', label: 1, review: '酒店位置方便，房间设施齐全，服务员态度热情，满意。' },
        { cat: '服装', label: 1, review: '衣服款式好看，面料舒适，尺码标准，客服态度好，好评。' },
        { cat: '水果', label: 0, review: '水果很多是坏的，客服一直拖着不给处理，售后太差，差评。' },
        { cat: '手机', label: 0, review: '手机屏幕漏光，触摸不灵敏，客服态度恶劣，垃圾产品。' },
        { cat: '平板', label: 1, review: '平板很轻便，看视频很清晰，待机时间长，物流也快，不错。' },
        { cat: '酒店', label: 0, review: '房间有异味，床单不干净，前台态度傲慢，入住体验非常差。' },
        { cat: '手机', label: 1, review: '手机拍照效果很好，电池耐用，包装精美，值得购买。' },
        { cat: '服装', label: 0, review: '衣服掉色严重，质量堪忧，客服不理人，太让人失望了。' },
        { cat: '蒙牛', label: 0, review: '牛奶味道不对，怀疑是假货，客服不承认，体验很差。' },
        { cat: '水果', label: 1, review: '水果很甜，包装有冰袋，物流速度快，质量很好。' },
        { cat: '电脑', label: 1, review: '电脑散热不错，风扇声音小，屏幕素质高，物流包装严实，好评。' },
        { cat: '手机', label: 0, review: '手机边框有划痕，客服说是正常现象，不接受退换，太失望了。' },
        { cat: '书籍', label: 1, review: '书籍内容很实用，纸张质量好，物流快，满意。' },
        { cat: '热水器', label: 0, review: '热水器漏水，安装师傅态度差，客服电话打不通，很不满意。' },
        { cat: '洗发水', label: 1, review: '洗发水控油效果好，味道清新，包装严实，物流很快，满意。' },
        { cat: '手机', label: 0, review: '手机发热严重，玩一会游戏就烫手，客服说是正常，垃圾。' },
        { cat: '服装', label: 1, review: '衣服颜色正，做工细致，客服热情，物流快，物美价廉。' },
        { cat: '酒店', label: 1, review: '酒店服务贴心，前台笑容很好，房间宽敞明亮，早餐美味。' },
        { cat: '水果', label: 0, review: '水果包装太差，到货就压烂了，客服不给赔偿，差评。' },
        { cat: '蒙牛', label: 1, review: '牛奶新鲜，口感香浓，包装完好，快递准时，会回购。' },
        { cat: '电脑', label: 0, review: '电脑风扇噪音大，系统经常蓝屏，客服处理很慢，不满意。' },
        { cat: '手机', label: 1, review: '手机性价比高，系统干净无广告，物流很快，非常满意。' },
        { cat: '平板', label: 0, review: '平板屏幕有亮点，客服说正常，售后态度差，不满意。' },
    ],

    /**
     * 对应 /api/keywords（B 提供的差评 Top 50 真实数据）
     */
    keywords: [
        { name: '酒店', value: 5163 },
        { name: '京东', value: 4478 },
        { name: '房间', value: 3936 },
        { name: '不好', value: 2692 },
        { name: '苹果', value: 2119 },
        { name: '服务', value: 2038 },
        { name: '垃圾', value: 2009 },
        { name: '客服', value: 1961 },
        { name: '手机', value: 1885 },
        { name: '质量', value: 1685 },
        { name: '失望', value: 1507 },
        { name: '蒙牛', value: 1490 },
        { name: '前台', value: 1429 },
        { name: '价格', value: 1375 },
        { name: '入住', value: 1374 },
        { name: '快递', value: 1321 },
        { name: '结果', value: 1282 },
        { name: '不错', value: 1263 },
        { name: '收到', value: 1232 },
        { name: '裤子', value: 1024 },
        { name: '屏幕', value: 1020 },
        { name: '味道', value: 1005 },
        { name: '包装', value: 995 },
        { name: '携程', value: 957 },
        { name: '满意', value: 924 },
        { name: '服务员', value: 907 },
        { name: '水果', value: 895 },
        { name: '里面', value: 885 },
        { name: '不到', value: 876 },
        { name: '假货', value: 867 },
        { name: '系统', value: 837 },
        { name: '晚上', value: 836 },
        { name: '设施', value: 834 },
        { name: '觉得', value: 827 },
        { name: '实在', value: 816 },
        { name: '时间', value: 816 },
        { name: '电话', value: 815 },
        { name: '早餐', value: 793 },
        { name: '两个', value: 787 },
        { name: '打开', value: 781 },
        { name: '态度', value: 777 },
        { name: '一下', value: 774 },
        { name: '方便', value: 762 },
        { name: '其他', value: 753 },
        { name: '他们', value: 751 },
        { name: '购物', value: 748 },
        { name: '衣服', value: 746 },
        { name: '退货', value: 745 },
        { name: '华为', value: 742 },
        { name: '不想', value: 739 },
    ],
};
