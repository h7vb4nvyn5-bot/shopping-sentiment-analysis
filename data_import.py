import pandas as pd
from pymongo import MongoClient


def import_data_to_mongodb():
    # 1. 连接 MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['shopping_sentiment']
    collection = db['reviews']

    print("✅ 数据库连接成功...")

    # 2. 读取 CSV 数据
    try:
        # 根据实际情况修改文件名或路径
        df = pd.read_csv('E:\online_shopping_10_cats\clean.csv')

        # 清洗数据，只保留需要的列，并去除空值
        if df.isnull().sum().sum() > 0:
            df.dropna(inplace=True)

        data_to_insert = df[['cat', 'label', 'review']].to_dict('records')
        print(f"📖 成功读取 {len(data_to_insert)} 条数据。")

    except FileNotFoundError:
        print("❌ 错误：找不到 online_shopping_10_cats.csv 文件，请检查路径！")
        return

    # 3. 批量导入 MongoDB
    if data_to_insert:
        # 如果 collection 已存在，先清空（防止重复导入导致数据翻倍）
        collection.delete_many({})

        result = collection.insert_many(data_to_insert)
        print(f"\n🚀 数据导入完成！")
        print(f"📊 成功导入数据量: {len(result.inserted_ids)} 条")

        # 4. 自动建立索引（配合你之前手动建的操作，这里写上也更完整）
        collection.create_index([('cat', 1)])
        collection.create_index([('label', 1)])
        collection.create_index([('review', 'text')])
        print("📑 索引已确认/建立完毕。")
    else:
        print("⚠️ 警告：没有有效数据可供导入。")


if __name__ == "__main__":
    import_data_to_mongodb()