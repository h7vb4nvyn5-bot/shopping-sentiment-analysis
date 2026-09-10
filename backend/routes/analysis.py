from flask import Blueprint, jsonify
from db import collection


analysis_bp = Blueprint(
    "analysis",
    __name__
)


@analysis_bp.route("/api/category-risk", methods=["GET"])
def category_risk():

    pipeline = [
        {
            "$group": {
                "_id": "$cat",

                "total": {
                    "$sum": 1
                },

                "negative": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$label", 0]},
                            1,
                            0
                        ]
                    }
                }
            }
        },

        {
            "$project": {
                "_id": 0,

                "cat": "$_id",

                "total": 1,

                "negative": 1,

                "negative_rate": {
                    "$multiply": [
                        {
                            "$divide": [
                                "$negative",
                                "$total"
                            ]
                        },
                        100
                    ]
                }
            }
        },

        {
            "$sort": {
                "negative_rate": -1
            }
        }
    ]

    result = list(
        collection.aggregate(pipeline)
    )

    return jsonify(result)

@analysis_bp.route("/api/category-detail", methods=["GET"])
def category_detail():

    from flask import request

    cat = request.args.get("cat", "").strip()

    if not cat:
        return jsonify({
            "error": "category required"
        }), 400


    # 当前类别所有评论
    total = collection.count_documents({
        "cat": cat
    })


    # 正面数量
    positive = collection.count_documents({
        "cat": cat,
        "label": 1
    })


    # 负面数量
    negative = collection.count_documents({
        "cat": cat,
        "label": 0
    })


    negative_rate = 0

    if total > 0:
        negative_rate = round(
            negative / total * 100,
            2
        )

    negative_reviews = list(
    collection.find(
        {
            "cat": cat,
            "label": 0
        },
        {
            "_id":0,
            "review":1
        }
    )
    .limit(5)
)

    return jsonify({

        "cat": cat,

        "total": total,

        "positive": positive,

        "negative": negative,

        "negative_rate": negative_rate,

        "negative_reviews": negative_reviews

    })


@analysis_bp.route("/api/diagnosis", methods=["GET"])
def diagnosis():

    from flask import request

    cat = request.args.get("cat","").strip()


    if not cat:
        return jsonify({
            "error":"category required"
        }),400


    negative = collection.count_documents({
        "cat":cat,
        "label":0
    })


    total = collection.count_documents({
        "cat":cat
    })


    rate = 0

    if total:
        rate = round(
            negative/total*100,
            2
        )


    if rate >= 50:
        level="高风险"

    elif rate >=30:
        level="中风险"

    else:
        level="低风险"



    text = f"""
当前分析类别为：{cat}

该类别共有评论 {total} 条，
其中负面评论 {negative} 条，
负面率为 {rate}%。

综合判断：
该类别属于 {level} 类别，
建议重点关注消费者反馈问题。
"""


    return jsonify({

        "cat":cat,

        "level":level,

        "content":text

    })