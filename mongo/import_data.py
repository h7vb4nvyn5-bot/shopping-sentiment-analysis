import pandas as pd
from pymongo import MongoClient


def import_data_to_mongodb():
    # 1. 连接本机 MongoDB
    client = MongoClient("mongodb://localhost:27017/")

    # 2. 选择数据库和集合
    db = client["shopping_sentiment"]
    collection = db["reviews"]

    print("✅ MongoDB 连接成功！")

    # 3. 读取 clean.csv
    csv_path = "../data/clean.csv"

    try:
        df = pd.read_csv(csv_path)
        print(f"📖 成功读取 CSV，共 {len(df)} 条数据。")
    except FileNotFoundError:
        print("❌ 找不到 clean.csv，请检查文件路径。")
        return

    # 4. 检查字段
    required_columns = ["cat", "label", "review"]

    if not all(column in df.columns for column in required_columns):
        print("❌ CSV 字段不符合要求！")
        print("当前字段：", list(df.columns))
        return

    # 5. 只保留项目需要的三个字段
    df = df[required_columns]

    # 6. 转换成 MongoDB 文档
    data = df.to_dict("records")

    # 7. 清空原来的 reviews 集合
    collection.delete_many({})

    # 8. 批量插入数据
    if data:
        result = collection.insert_many(data)

        print("🚀 数据导入完成！")
        print(f"📊 成功导入：{len(result.inserted_ids)} 条")

    # 9. 建立索引
    collection.create_index([("cat", 1)])
    collection.create_index([("label", 1)])
    collection.create_index([("review", "text")])

    print("📑 MongoDB 索引创建完成。")

    # 10. 关闭连接
    client.close()
    print("🔌 MongoDB 连接已关闭。")


if __name__ == "__main__":
    import_data_to_mongodb()