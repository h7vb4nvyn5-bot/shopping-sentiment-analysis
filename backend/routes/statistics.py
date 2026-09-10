from flask import Blueprint, jsonify
from db import collection

statistics_bp = Blueprint(
    "statistics",
    __name__
)

@statistics_bp.route("/api/statistics", methods=["GET"])
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