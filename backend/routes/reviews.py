from flask import Blueprint, jsonify, request
import re
from db import collection

reviews_bp = Blueprint(
    "reviews",
    __name__
)

@reviews_bp.route("/api/reviews", methods=["GET"])
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
