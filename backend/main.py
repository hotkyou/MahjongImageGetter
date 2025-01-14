from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import os
from datetime import datetime

app = FastAPI()

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 必要に応じて特定のオリジンを指定
    allow_credentials=True,
    allow_methods=["*"],  # 許可するHTTPメソッドを指定
    allow_headers=["*"],  # 許可するヘッダーを指定
)

# リクエストボディのスキーマ
class AnalyzeRequest(BaseModel):
    image: str  # Base64エンコードされた画像データ

@app.post("/analyze")
async def analyze_image(request: AnalyzeRequest):
    try:
        # Base64文字列から画像データをデコード
        header, encoded = request.image.split(",", 1)  # "data:image/png;base64," を分割
        image_data = base64.b64decode(encoded)

        # 画像データをPillowのImageオブジェクトとして読み込む
        image = Image.open(BytesIO(image_data))

        # 保存ディレクトリを設定
        save_dir = "uploaded_images"
        os.makedirs(save_dir, exist_ok=True)  # ディレクトリが存在しない場合は作成

        # 保存ファイル名を生成（例: 現在時刻を使用）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = os.path.join(save_dir, f"{timestamp}.png")

        # ファイルとして保存
        image.save(file_path)

        # 画像のサイズなどを取得（処理内容をカスタマイズ可能）
        width, height = image.size
        mode = image.mode

        # 処理結果を返却
        return {
            "message": "画像の処理と保存に成功しました",
            "file_path": file_path,  # 保存先を返却
            "width": width,
            "height": height,
            "mode": mode
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"画像の処理中にエラーが発生しました: {str(e)}")

# uvicorn main:app --port 8000