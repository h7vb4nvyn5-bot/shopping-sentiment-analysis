from pymongo import MongoClient


# MongoDB 客户端
client = MongoClient("mongodb://localhost:27017/")

# 选择数据库
db = client["shopping_sentiment"]

# 选择集合
collection = db["reviews"]