# MongoDB 数据存储说明 (A同学)

## 1. 数据库配置信息
- **数据库名称 (Database):** `shopping_sentiment`
- **集合名称 (Collection):** `reviews`
- **连接地址 (URI):** `mongodb://localhost:27017/`

## 2. 数据概览
- **总数据量:** 62,774 条
- **数据来源:** online_shopping_10_cats.csv

## 3. 字段说明

| 字段名 (Key) | 数据类型 (Type) | 说明 (Description) |
| :--- | :--- | :--- |
| `cat` | String (字符串) | 商品所属类别，如“手机”、“衣服”、“零食”等。 |
| `label` | Integer (整数) | 情感标签。`1` 代表正面/好评，`0` 代表负面/差评。 |
| `review` | String (字符串) | 用户具体的评论文本内容。 |

## 4. 如何运行导入脚本
确保本地已安装 Python 和 `pymongo`、`pandas` 库：
1. 在终端进入 `mongo/` 目录。
2. 运行命令：`python import_data.py`
3. 脚本将自动读取同层级目录下的 CSV 文件并导入本地 MongoDB。