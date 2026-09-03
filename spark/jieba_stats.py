import json
import jieba
from pyspark.sql import SparkSession

# 启动 Spark
spark = SparkSession.builder \
    .appName("JiebaStats") \
    .master("local[*]") \
    .getOrCreate()

# 读取数据
df = spark.read.csv("D:/shopping-sentiment/data/clean.csv", header=True, inferSchema=True)

# 筛选负面评论 (label=0)，取 review 列，转成 Pandas
negative_df = df.filter("label = 0").select("review").toPandas()

# 加载停用词表
with open("D:/shopping-sentiment/stopwords.txt", "r", encoding="utf-8") as f:
    stopwords = set(f.read().splitlines())

# 分词 + 过滤停用词
all_words = []
for text in negative_df["review"]:
    words = jieba.cut(text)
    for w in words:
        if len(w) > 1 and w not in stopwords:
            all_words.append(w)

# 词频统计
from collections import Counter
word_freq = Counter(all_words).most_common(50)

# 转成 JSON 格式
result = [{"name": w, "value": c} for w, c in word_freq]

# 保存到 output 文件夹
with open("D:/shopping-sentiment/output/top50_keywords.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("✅ Top 50 关键词已生成，共", len(result), "个")
print("保存位置：D:/shopping-sentiment/output/top50_keywords.json")
spark.stop()
