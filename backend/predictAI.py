import pickle
import lightgbm
import numpy as np

# モデルを一度だけ読み込む
with open("model/lightgbm.pkl", mode='rb') as fi:
    MODEL = pickle.load(fi)

# インデックス計算用の辞書
TILE_INDEX = {
    'm': lambda n: 9 if n == '0' else int(n) - 1,
    'p': lambda n: 19 if n == '0' else int(n) + 9,
    's': lambda n: 29 if n == '0' else int(n) + 19,
    'z': lambda n: int(n) + 29
}

# 数字の漢数字変換用辞書
NUMBER_TO_KANJI = {
    '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
    '6': '六', '7': '七', '8': '八', '9': '九'
}

# 種類の漢字変換用辞書
SUIT_TO_KANJI = {
    'm': '萬',
    'p': '筒',
    's': '索',
    'z': {
        '1': '東',
        '2': '南',
        '3': '西',
        '4': '北',
        '5': '白',
        '6': '發',
        '7': '中'
    }
}

def get_tile_name(tile_code):
    suit = tile_code[0]
    number = tile_code[1]
    
    # 字牌の場合
    if suit == 'z':
        return SUIT_TO_KANJI[suit][number]
    
    # 赤ドラの場合
    if number == '0':
        return f"赤五{SUIT_TO_KANJI[suit]}"
    
    # 通常の牌
    return f"{NUMBER_TO_KANJI[number]}{SUIT_TO_KANJI[suit]}"

# 牌変換用の辞書（コードから日本語表記への変換）
INDEX_TO_TILE = {
    **{i: f"m{i + 1}" for i in range(9)},
    9: "m0",
    **{i: f"p{i - 9}" for i in range(10, 19)},
    19: "p0",
    **{i: f"s{i - 19}" for i in range(20, 29)},
    29: "s0",
    **{i: f"z{i - 29}" for i in range(30, 37)}
}

def predict(paiList):
    index_array = convert_to_array37(paiList)
    input_array = np.array([index_array], dtype=np.float32)
    result = MODEL.predict(input_array)
    return get_highest_probability_tile(result)

def convert_to_array37(paiList):
    result = [0] * 380
    for tile in paiList:
        index = TILE_INDEX[tile[0]](tile[1])
        result[index] += 1
    return result

def get_highest_probability_tile(result):
    max_index = np.argmax(result[0])
    tile_code = INDEX_TO_TILE[max_index]
    probability = int(result[0][max_index] * 100)
    return get_tile_name(tile_code), probability

# テスト実行
if __name__ == "__main__":
    b = ['m6', 'm6', 'p7', 'p7', 'p7', 'p8', 'p9', 's3', 's4', 's0', 's5', 's5', 's6', 's5']
    tile, prob = predict(b)
    print(f"最も打つべき牌: {tile}")
    print(f"確率: {prob}")