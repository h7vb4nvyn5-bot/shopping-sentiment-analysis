from flask import Flask
from flask_cors import CORS
from routes.statistics import statistics_bp
from routes.reviews import reviews_bp
from routes.keywords import keywords_bp
from routes.search import search_bp
from routes.analysis import analysis_bp
from routes.categories import categories_bp


app = Flask(__name__)
CORS(app)

# 注册 Blueprint
app.register_blueprint(categories_bp)
app.register_blueprint(statistics_bp)
app.register_blueprint(reviews_bp)
app.register_blueprint(keywords_bp)
app.register_blueprint(search_bp)
app.register_blueprint(analysis_bp)


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )