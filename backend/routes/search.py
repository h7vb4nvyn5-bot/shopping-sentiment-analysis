import re
from db import collection
from flask import Blueprint, jsonify, request

search_bp = Blueprint(
    "search",
    __name__
)

@search_bp.route("/api/search", methods=["GET"])
def search_reviews():
    keyword = request.args.get("keyword", "").strip()
    cat = request.args.get("cat", "").strip()
    label = request.args.get("label", "").strip()
    page = request.args.get("page", default=1, type=int)
    size = request.args.get("size", default=10, type=int)

    # 关键词为空
    if not keyword:
        return jsonify({
            "list": [],
            "total": 0,
            "page": page
        })

    # 防止页码和每页数量出现非法值
    if page < 1:
        page = 1

    if size < 1:
        size = 10

    # MongoDB 查询条件
    query = {
    "review": {
        "$regex": re.escape(keyword),
        "$options": "i"
        }
    }

    # 如果选择了品类，则增加品类条件
    if cat:
        query["cat"] = cat
    # 如果选择了情感，则增加label条件
    if label:
        query["label"] = int(label)

    # 查询总数
    total = collection.count_documents(query)

    # 分页
    skip = (page - 1) * size

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