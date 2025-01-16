from mahjong.shanten import Shanten
from mahjong.tile import TilesConverter

def shaten(paiList):
    shanten = Shanten()
    man, pin, sou, honors =  convert_tiles_to_strings(paiList)
    tiles_str = TilesConverter.string_to_34_array(man=man, pin=pin, sou=sou, honors=honors)
    # シャンテン数を計算
    shanten_number = shanten.calculate_shanten(tiles_str)
    return shanten_number

def convert_tiles_to_strings(paiList):
    """
    麻雀牌の配列を萬子・筒子・索子・字牌の文字列に変換する
    
    Args:
        tiles (list): 麻雀牌の配列 (例: ['m3', 'm5', 'p3', 'p4', 'p0', ...])
        
    Returns:
        tuple: (man, pin, sou, honors) の形式で各種牌の文字列を返す
    """
    # 種類ごとの辞書を初期化
    categorized = {
        'm': [],  # 萬子
        'p': [],  # 筒子
        's': [],  # 索子
        'z': []   # 字牌
    }
    
    # 牌を種類ごとに分類
    for tile in paiList:
        tile_type = tile[0]    # 牌の種類 (m/p/s/z)
        number = tile[1]       # 数字
        
        # 赤ドラ(0)を5に変換
        if number == '0':
            number = '5'
            
        categorized[tile_type].append(number)
    
    # それぞれの種類でソートして文字列に変換
    man = ''.join(sorted(categorized['m']))
    pin = ''.join(sorted(categorized['p']))
    sou = ''.join(sorted(categorized['s']))
    honors = ''.join(sorted(categorized['z']))
    
    return man, pin, sou, honors

a = ['m1', 'm5', 'm6', 'p5', 'p6', 'p7', 'p8', 'p8', 'p9', 's2', 's8', 's8', 'z7', 'm7']
shaten(a)