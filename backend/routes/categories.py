from flask import Blueprint, jsonify
from db import collection

categories_bp = Blueprint(
    "categories",
    __name__
)

@categories_bp.route("/api/categories", methods=["GET"])
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