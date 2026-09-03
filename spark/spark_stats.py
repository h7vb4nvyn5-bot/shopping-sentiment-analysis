import json
from pyspark.sql import SparkSession

# 1. 启动 Spark
spark = SparkSession.builder \
    .appName("ShoppingSentiment") \
    .master("local[*]") \
    .getOrCreate()

print("=" * 50)
print("Spark 启动成功！版本：", spark.version)
print("=" * 50)

# 2. 读取数据
df = spark.read.csv("D:/shopping-sentiment/data/clean.csv", header=True, inferSchema=True)

print(f"数据加载完成，总记录数：{df.count()}")

# 3. 总体统计
total = df.count()
positive = df.filter("label = 1").count()
negative = df.filter("label = 0").count()

print(f"总评论数：{total}")
print(f"正面评论：{positive}")
print(f"负面评论：{negative}")

# 4. 各类别统计（按类别 + 正负面分组）
cat_stats = df.groupBy("cat", "label").count().orderBy("cat").collect()

# 5. 整理成 C 需要的格式
categories_dict = {}
for row in cat_stats:
    cat = row["cat"]
    label = row["label"]
    count = row["count"]
    if cat not in categories_dict:
        categories_dict[cat] = {"cat": cat, "positive": 0, "negative": 0}
    if label == 1:
        categories_dict[cat]["positive"] = count
    else:
        categories_dict[cat]["negative"] = count

categories_list = list(categories_dict.values())

# 6. 保存总体统计到 JSON
statistics = {
    "total": total,
    "positive": positive,
    "negative": negative
}

with open("D:/shopping-sentiment/output/statistics.json", "w", encoding="utf-8") as f:
    json.dump(statistics, f, ensure_ascii=False, indent=2)

print("✅ 已保存：output/statistics.json")

# 7. 保存各类别统计到 JSON
with open("D:/shopping-sentiment/output/categories.json", "w", encoding="utf-8") as f:
    json.dump(categories_list, f, ensure_ascii=False, indent=2)

print("✅ 已保存：output/categories.json")
print("=" * 50)
print("Spark 统计完成！请将 output 文件夹中的 JSON 文件发给 C。")

spark.stop()
