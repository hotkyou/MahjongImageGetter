import pickle
import lightgbm
import numpy as np
import warnings

warnings.filterwarnings('ignore', category=UserWarning)

# モデルを一度だけ読み込む
with open("model/lightgbm.pkl", mode='rb') as fi:
    MODEL = pickle.load(fi)

with open("model/risky.pkl", mode='rb') as ri:
    MODEL_RISKY = pickle.load(ri)

with open("model/yaku.pkl", mode='rb') as ya:
    MODEL_YAKU = pickle.load(ya)

with open("model/pon_under.pkl", mode='rb') as po:
    MODEL_PON = pickle.load(po)

with open("model/chi.pkl", mode='rb') as ch:
    MODEL_CHI = pickle.load(ch)

with open("model/kan_under.pkl", mode='rb') as ka:
    MODEL_KAN = pickle.load(ka)

with open("model/reach_under.pkl", mode='rb') as ri:
    MODEL_RIICHI = pickle.load(ri)

# インデックス計算用の辞書
TILE_INDEX = {
    'm': lambda n: 9 if n == '0' else int(n) - 1,
    'p': lambda n: 19 if n == '0' else int(n) + 9,
    's': lambda n: 29 if n == '0' else int(n) + 19,
    'z': lambda n: int(n) + 29
}

TILE_INDEX_NOTDORA = {
    'm': lambda n: 4 if n == '0' else int(n) - 1,
    'p': lambda n: 13 if n == '0' else int(n) + 8,
    's': lambda n: 22 if n == '0' else int(n) + 17,
    'z': lambda n: int(n) + 26
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

def predict(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    result.append(dataHonba)
    result.append(0) #リーチ繰越 データが取得できていない
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    call1_array = convert_to_array37(dataCalls[1])
    result.extend(call1_array)
    call2_array = convert_to_array37(dataCalls[2])
    result.extend(call2_array)
    call3_array = convert_to_array37(dataCalls[3])
    result.extend(call3_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    discard1_array = convert_to_array37(dataDiscards[1])
    result.extend(discard1_array)
    discard2_array = convert_to_array37(dataDiscards[2])
    result.extend(discard2_array)
    discard3_array = convert_to_array37(dataDiscards[3])
    result.extend(discard3_array)
    result.append(dataScores[0] // 100)
    result.append(dataScores[1] // 100)
    result.append(dataScores[2] // 100)
    result.append(dataScores[3] // 100)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    result = MODEL.predict(result)
    return get_highest_probability_tile(result)

def predict_risky(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    result.append(dataHonba)
    result.append(0) #リーチ繰越 データが取得できていない
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    call1_array = convert_to_array37(dataCalls[1])
    result.extend(call1_array)
    call2_array = convert_to_array37(dataCalls[2])
    result.extend(call2_array)
    call3_array = convert_to_array37(dataCalls[3])
    result.extend(call3_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    discard1_array = convert_to_array37(dataDiscards[1])
    result.extend(discard1_array)
    discard2_array = convert_to_array37(dataDiscards[2])
    result.extend(discard2_array)
    discard3_array = convert_to_array37(dataDiscards[3])
    result.extend(discard3_array)
    result.append(dataScores[0] // 100)
    result.append(dataScores[1] // 100)
    result.append(dataScores[2] // 100)
    result.append(dataScores[3] // 100)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    result = MODEL_RISKY.predict(result)
    print(result)
    return get_highest_probability_tile(result)

def predict_yaku(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    result = MODEL_YAKU.predict(result)
    yakuArray = get_yaku_names(result[0])
    print(yakuArray)
    return yakuArray

def predict_pon(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    result.append(dataHonba)
    result.append(0) #リーチ繰越 データが取得できていない
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    call1_array = convert_to_array37(dataCalls[1])
    result.extend(call1_array)
    call2_array = convert_to_array37(dataCalls[2])
    result.extend(call2_array)
    call3_array = convert_to_array37(dataCalls[3])
    result.extend(call3_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    discard1_array = convert_to_array37(dataDiscards[1])
    result.extend(discard1_array)
    discard2_array = convert_to_array37(dataDiscards[2])
    result.extend(discard2_array)
    discard3_array = convert_to_array37(dataDiscards[3])
    result.extend(discard3_array)
    result.append(dataScores[0] // 100)
    result.append(dataScores[1] // 100)
    result.append(dataScores[2] // 100)
    result.append(dataScores[3] // 100)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    value = MODEL_PON.predict(result)
    print(result)
    result = value >= 0.75
    if result:
        return f"⭕️ {value[0] * 100:.1f}%"
    else:
        return f"❌ {value[0] * 100:.1f}%"

def predict_kan(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    result.append(dataHonba)
    result.append(0) #リーチ繰越 データが取得できていない
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    call1_array = convert_to_array37(dataCalls[1])
    result.extend(call1_array)
    call2_array = convert_to_array37(dataCalls[2])
    result.extend(call2_array)
    call3_array = convert_to_array37(dataCalls[3])
    result.extend(call3_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    discard1_array = convert_to_array37(dataDiscards[1])
    result.extend(discard1_array)
    discard2_array = convert_to_array37(dataDiscards[2])
    result.extend(discard2_array)
    discard3_array = convert_to_array37(dataDiscards[3])
    result.extend(discard3_array)
    result.append(dataScores[0] // 100)
    result.append(dataScores[1] // 100)
    result.append(dataScores[2] // 100)
    result.append(dataScores[3] // 100)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    value = MODEL_PON.predict(result)
    print(result)
    result = value >= 0.75
    if result:
        return f"⭕️ {value[0] * 100:.1f}%"
    else:
        return f"❌ {value[0] * 100:.1f}%"

def predict_chi(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    result.append(dataHonba)
    result.append(0) #リーチ繰越 データが取得できていない
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    call1_array = convert_to_array37(dataCalls[1])
    result.extend(call1_array)
    call2_array = convert_to_array37(dataCalls[2])
    result.extend(call2_array)
    call3_array = convert_to_array37(dataCalls[3])
    result.extend(call3_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    discard1_array = convert_to_array37(dataDiscards[1])
    result.extend(discard1_array)
    discard2_array = convert_to_array37(dataDiscards[2])
    result.extend(discard2_array)
    discard3_array = convert_to_array37(dataDiscards[3])
    result.extend(discard3_array)
    result.append(dataScores[0] // 100)
    result.append(dataScores[1] // 100)
    result.append(dataScores[2] // 100)
    result.append(dataScores[3] // 100)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    result = MODEL_CHI.predict(result)
    tile = get_highest_probability_tile(result)
    tile = f"{tile[0]} {tile[1]}%"
    return tile

def predict_riichi(dataHand, dataDiscards, dataDora, dataTilesLeft, dataScores, dataCalls, dataSeatWind, dataRoundWind, dataHonba, dataRiichi):
    result = []
    dataHand_array = convert_to_array37(dataHand)
    result.extend(dataHand_array)
    result.extend(dataRiichi)
    dora_array = convert_to_array34_notdora(dataDora)
    result.extend(dora_array)
    result.append(dataRoundWind)
    result.append(dataSeatWind) # 取得ミスっている
    result.append(dataHonba)
    result.append(0) #リーチ繰越 データが取得できていない
    call0_array = convert_to_array37(dataCalls[0])
    result.extend(call0_array)
    call1_array = convert_to_array37(dataCalls[1])
    result.extend(call1_array)
    call2_array = convert_to_array37(dataCalls[2])
    result.extend(call2_array)
    call3_array = convert_to_array37(dataCalls[3])
    result.extend(call3_array)
    discard0_array = convert_to_array37(dataDiscards[0])
    result.extend(discard0_array)
    discard1_array = convert_to_array37(dataDiscards[1])
    result.extend(discard1_array)
    discard2_array = convert_to_array37(dataDiscards[2])
    result.extend(discard2_array)
    discard3_array = convert_to_array37(dataDiscards[3])
    result.extend(discard3_array)
    result.append(dataScores[0] // 100)
    result.append(dataScores[1] // 100)
    result.append(dataScores[2] // 100)
    result.append(dataScores[3] // 100)
    result.append(dataTilesLeft)
    result = np.array(result).reshape(1, -1)
    result = MODEL_CHI.predict(result)
    print(result)
    return result

def convert_to_array37(paiList):
    array = [0] * 37
    for tile in paiList:
        index = TILE_INDEX[tile[0]](tile[1])
        array[index] += 1
    return array

def convert_to_array34_notdora(paiList):
    array = [0] * 34
    for tile in paiList:
        index = TILE_INDEX_NOTDORA[tile[0]](tile[1])
        array[index] += 1
    return array

def get_yaku_names(binary_array):
    yaku_dict = {
        '立直': 0, '一発': 1, '赤ドラ': 2, '裏ドラ': 3, '役牌 白': 4, '役牌 發': 5, '役牌 中': 6,
        '三色同刻': 7, '三色同順': 8, '混老頭': 9, '対々和': 10, '断幺九': 11, '場風 東': 12,
        '場風 南': 13, '自風 北': 14, '自風 東': 15, '自風 西': 16, '自風 南': 17, '平和': 18,
        '一盃口': 19, '七対子': 20, 'ドラ': 21, '一気通貫': 22, '混一色': 23, '三暗刻': 24,
        '流局': 25, '小三元': 26, '三貫子': 27, '清一色': 28, '四暗刻': 29, '大三元': 30,
        '小四喜': 31, '字一色': 32, '緑一色': 33, '九蓮宝燈': 34, '河底撈魚': 35, '九種九牌': 36,
        '門前清自摸和': 37, '場風 西': 38, '場風 北': 39, '四暗刻単騎': 40, '純全帯幺九': 41,
        '混全帯幺九': 42, '嶺上開花': 43, '海底摸月': 44, '槍槓': 45, '両立直': 46, '二盃口': 47,
        '国士無双': 48, '清老頭': 49, '天和': 50, '地和': 51, '三槓子': 52, '大四喜': 53,
        '純正九蓮宝燈': 54, '国士無双１３面': 55
    }
    # yaku_dictのキーをリストに変換
    yaku_names = list(yaku_dict.keys())
    
    # 結果を格納する配列
    result = []
    
    # binary_arrayの各要素をチェック
    for i, value in enumerate(binary_array):
        if value == 1:
            # 1の場合、対応するyaku_namesの要素を結果に追加
            result.append(yaku_names[i])
    
    return result

def get_highest_probability_tile(result):
    max_index = np.argmax(result[0])
    probability = int(result[0][max_index] * 100)
    if max_index == 37: # 鳴かない時
        return "❌", probability
    tile_code = INDEX_TO_TILE[max_index]
    return get_tile_name(tile_code), probability

# テスト実行
if __name__ == "__main__":
    b = ['m6', 'm6', 'p7', 'p7', 'p7', 'p8', 'p9', 's3', 's4', 's0', 's5', 's5', 's6', 's5']
    tile, prob = predict(b)
    print(f"最も打つべき牌: {tile}")
    print(f"確率: {prob}")