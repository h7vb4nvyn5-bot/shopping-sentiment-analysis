import json
import os
from db import collection
from flask import Blueprint, current_app, jsonify, request

keywords_bp = Blueprint(
    "keywords",
    __name__
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYWORDS_FILE = os.path.join(BASE_DIR, "data", "top50_keywords.json")

@keywords_bp.route("/api/keywords", methods=["GET"])
def keywords():
    top = request.args.get("top", default=50, type=int)

    if top < 1:
        top = 50

    if top > 50:
        top = 50

# Flask 的项目根目录就是 backend
    keywords_file = os.path.join(
        os.path.dirname(current_app.root_path),
        "data",
        "top50_keywords.json"
    )

    print("[Keywords] 文件路径：", keywords_file)
    print("[Keywords] 文件存在：", os.path.exists(keywords_file))

    try:
        with open(keywords_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        return jsonify(data[:top])

    except FileNotFoundError:
        return jsonify({
            "error": "top50_keywords.json not found",
            "path": keywords_file
        }), 500

    except json.JSONDecodeError:
        return jsonify({
            "error": "top50_keywords.json format invalid"
        }), 500