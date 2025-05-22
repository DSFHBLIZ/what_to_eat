# test_openai_env_proxy_envvar.py

from openai import OpenAI
from dotenv import load_dotenv
import os

# 加载 .env.local 文件
load_dotenv(dotenv_path=".env.local")

# 从环境变量读取 API Key 和代理地址
api_key = os.getenv("OPENAI_API_KEY")
proxy_url = os.getenv("OPENAI_PROXY")

if not api_key:
    print("❌ 没有找到 OPENAI_API_KEY，请检查 .env.local 文件")
    exit(1)

# 设置代理为环境变量（系统级）
if proxy_url:
    os.environ["HTTP_PROXY"] = proxy_url
    os.environ["HTTPS_PROXY"] = proxy_url

# 初始化 OpenAI 客户端（不再传 proxies）
client = OpenAI(api_key=api_key)

# 调用 Chat API
try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "你好，GPT。你能工作吗？"}
        ]
    )
    print("✅ API 返回成功，响应内容如下：")
    print(response.choices[0].message.content)

except Exception as e:
    print("❌ 请求失败，错误信息如下：")
    print(e)
