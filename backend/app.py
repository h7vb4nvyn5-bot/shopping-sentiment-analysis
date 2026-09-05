from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)

# 允许前端跨域访问
CORS(app)

# 连接 MongoDB
client = MongoClient("mongodb://localhost:27017/")

# 选择数据库
db = client["shopping_sentiment"]

# 选择集合
collection = db["reviews"]


@app.route("/")
def home():
    return "Flask backend is running!"


@app.route("/api/statistics", methods=["GET"])
def statistics():
    # 查询总评论数
    total = collection.count_documents({})

    # 查询正面评论数
    positive = collection.count_documents({"label": 1})

    # 查询负面评论数
    negative = collection.count_documents({"label": 0})

    # 返回 JSON
    return jsonify({
        "total": total,
        "positive": positive,
        "negative": negative
    })
@app.route("/api/categories", methods=["GET"])
def categories():
    pipeline = [
        {
            "$group": {
                "_id": "$cat",
                "positive": {
                    "$sum": {
                        "$cond": [{"$eq": ["$label", 1]}, 1, 0]
                    }
                },
                "negative": {
                    "$sum": {
                        "$cond": [{"$eq": ["$label", 0]}, 1, 0]
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "cat": "$_id",
                "positive": 1,
                "negative": 1
            }
        },
        {
            "$sort": {
                "cat": 1
            }
        }
    ]

    result = list(collection.aggregate(pipeline))

    return jsonify(result)

@app.route("/api/reviews", methods=["GET"])
def reviews():
    # 获取参数
    cat = request.args.get("cat")
    label = request.args.get("label")

    page = request.args.get("page", default=1, type=int)
    size = request.args.get("size", default=20, type=int)

    # 防止 page 和 size 出现非法值
    if page < 1:
        page = 1

    if size < 1:
        size = 20

    # 构造 MongoDB 查询条件
    query = {}

    if cat:
        query["cat"] = cat

    if label is not None:
        query["label"] = int(label)

    # 查询总数量
    total = collection.count_documents(query)

    # 计算跳过多少条
    skip = (page - 1) * size

    # 查询评论
    cursor = (
        collection.find(
            query,
            {
                "_id": 0,
                "cat": 1,
                "label": 1,
                "review": 1
            }
        )
        .skip(skip)
        .limit(size)
    )

    review_list = list(cursor)

    return jsonify({
        "list": review_list,
        "total": total,
        "page": page
    })

if __name__ == "__main__":
    app.run(debug=True)