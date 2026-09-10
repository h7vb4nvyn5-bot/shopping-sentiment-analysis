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
