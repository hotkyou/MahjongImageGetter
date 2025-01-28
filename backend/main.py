from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import os
from datetime import datetime

import templatematch, shanten, predictAI, risky

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
        
        paiList = templatematch.tmpMatch(f"{timestamp}.png") # 手牌のリスト
        shantenNum = shanten.shaten(paiList) # シャンテン数
        discardTile, prob = predictAI.predict(paiList)

        # 処理結果を返却
        return {
            "system": {
                "message": "画像の処理と保存に成功しました",
                "file_path": file_path,  # 保存先を返却
                "width": width,
                "height": height,
                "mode": mode
            },
            "handAnalysis": {
                "recognizedTiles": paiList,
                "shanten": shantenNum,
                "yaku": ['pinfu', 'tanyao']
            },
            "aiSuggestion": {
                "discardTile": discardTile,
                "reason": '外側の牌を切ることで、より効率的な待ちを作れます',
                "winningProbability": prob
            },
            "waitingTiles": ['2m', '5m', '8m'],
            "dangerAnalysis": {
                "dangerLevel": 'medium',
                "dangerousTiles": ['1p', '9p'],
                "safeTiles": ['1s', '9s']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"画像の処理中にエラーが発生しました: {str(e)}")

class GameData(BaseModel):
    hand: list # 手牌
    discards: list # 捨て牌 (自分から見て順番に並ぶ)
    dora: list # ドラ表示牌
    tilesLeft: int # 残り牌数
    scores: list # 点数 (自分から見て順番に並ぶ)
    calls: list # プレイヤーの鳴き情報(自分から見て順番に並ぶ)
    seatWind: int # 自風
    roundWind: int # 場風
    honba: int # 本場
    riichi: list # リーチ情報 (自分から見て順番に並ぶ)
    canDo: list # 自分の行動可能リスト

@app.post("/game_data")
async def process_game_data(data: GameData):
    pon = None
    chi = None
    kan = None
    riichi = None
    try:
        # ゲームデータを処理
        # 例: シャンテン数計算、AIの提案生成など
        # print(data.hand) # hand.discards.dora.tilesLeft
        # print(data.discards)
        # print(data.dora)
        # print(data.tilesLeft)
        # print(data.scores)
        # print(data.calls)
        # print(data.seatWind)
        # print(data.roundWind)
        # print(data.honba)
        # print(data.riichi)
        dataHand = convert_tiles(data.hand)
        #print(dataHand)
        dataDiscards = convert_tiles(data.discards)
        #print(dataDiscards)
        dataDora = convert_tiles(data.dora)
        #print(dataDora)
        dataCalls = convert_tiles(data.calls)
        #print(dataCalls)
        dataRiichi = bool_to_int(data.riichi)
        #print(dataRiichi)
        shantenNum = shanten.shaten(dataHand)
        
        print("捨て牌スタート")
        discardTile, prob = predictAI.predict(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
        print("危険牌スタート")
        riskyTiles, riskyProb = predictAI.predict_risky(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
        print("役スタート")
        yakuArray = predictAI.predict_yaku(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
        print("鳴き")
        for i in range(len(data.canDo)):
            print(data.canDo[i]["type"])
            if data.canDo[i]["type"] == 1: # 打牌
                print("打牌")
                pass
            elif data.canDo[i]["type"] == 2:    # チー
                print("チー")
                chi = predictAI.predict_chi(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
                print(chi)
            elif data.canDo[i]["type"] == 3:    # ポン
                print("ポン")
                pon = predictAI.predict_pon(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
                print(pon)
            elif data.canDo[i]["type"] == 4 or data.canDo[i] == 5 or data.canDo[i] == 6:    # カン
                print("カン")
                kan = predictAI.predict_kan(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
            elif data.canDo[i]["type"] == 7:    # リーチ
                riichi = predictAI.predict_riichi(dataHand, dataDiscards, dataDora, data.tilesLeft, data.scores, dataCalls, data.seatWind, data.roundWind, data.honba, dataRiichi)
                print("リーチ")
                pass
            else:
                pass

        return {
            "success": True,
            "handAnalysis": {
                "recognizedTiles": dataHand,
                "shanten": shantenNum,
                "yaku": yakuArray
            },
            "aiSuggestion": {
                "discardTile": discardTile,
                "winningProbability": prob,
                "riskyTiles": riskyTiles,
                "riskyProbability": riskyProb,
                "pon": pon,
                "chi": chi,
                "kan": kan,
                "riichi": riichi,
            },
            # 他の分析結果を追加
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def convert_tiles(tiles):
    suit_map = {0: 'p', 1: 'm', 2: 's', 3: 'z'}
    
    if not isinstance(tiles[0], list):  # 1次元配列の場合
        result = []
        for tile in tiles:
            suit = suit_map[tile['type']]
            number = tile['index']
            tile_str = f'{suit}0' if tile['dora'] else f'{suit}{number}'
            result.append(tile_str)
        return result
    
    # 2次元配列の場合
    result = []
    for row in tiles:
        row_result = []
        for tile in row:
            suit = suit_map[tile['type']]
            number = tile['index']
            tile_str = f'{suit}0' if tile['dora'] else f'{suit}{number}'
            row_result.append(tile_str)
        result.append(row_result)
    return result

def bool_to_int(bool_list):
    return [int(x) for x in bool_list]
# uvicorn main:app --port 8000