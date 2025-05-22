import os
import time
import json
import csv
import threading
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from openai import OpenAI

# 初始化 OpenAI 客户端（注意替换你的 Key）
client = OpenAI(api_key="sk-proj-yGLV4C1X6nPU4Z2A7BXIT3BlbkFJZyjKxZEwNTwN0bF1itRr")  # ← 请替换

# 文件路径
INPUT_EXCEL = "12.xlsx"
OUTPUT_CSV = "output_embeddings.csv"
CACHE_FILE = "embedding_cache.json"

# 全局缓存 + 锁
cache_lock = threading.Lock()
write_lock = threading.Lock()
cache = {}

# 加载缓存
def load_cache():
    global cache
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)

# 保存缓存（线程安全）
def save_cache():
    with cache_lock:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False)

# 向量请求（带缓存 & 锁）
def get_embedding(text: str) -> list:
    with cache_lock:
        if text in cache:
            return cache[text]

    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
        with cache_lock:
            cache[text] = embedding
        return embedding
    except Exception as e:
        print(f"❌ 请求失败：{text} -> {e}")
        return None

# 单行处理逻辑（线程工作函数）
def process_text(text: str, writer, idx: int, total: int):
    print(f"➡️ 正在处理 {idx + 1} / {total}：{text}")
    embedding = get_embedding(text)
    if embedding:
        with write_lock:
            writer.writerow([text, json.dumps(embedding)])
        save_cache()

# 主程序
def process_excel_parallel(input_excel, output_csv, max_threads=10):
    load_cache()
    df = pd.read_excel(input_excel)
    texts = [str(row).strip() for row in df.iloc[:, 0] if str(row).strip()]
    total = len(texts)

    with open(output_csv, "a", encoding="utf-8", newline='') as f:
        writer = csv.writer(f)
        if os.stat(output_csv).st_size == 0:
            writer.writerow(["text", "embedding"])

        with ThreadPoolExecutor(max_workers=max_threads) as executor:
            futures = [
                executor.submit(process_text, text, writer, idx, total)
                for idx, text in enumerate(texts)
            ]
            for _ in as_completed(futures):
                pass  # 只是为了确保所有任务完成

    print("✅ 所有处理完成！")

if __name__ == "__main__":
    process_excel_parallel(INPUT_EXCEL, OUTPUT_CSV, max_threads=5)
