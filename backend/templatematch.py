import cv2
import os
import numpy as np

def tmpMatch(image):
    img = cv2.imread(f"uploaded_images/{image}")
    myHandImage, myTsumoImage = cropMyHandImage(img)
    myHandImageList = divideMyHandImage(myHandImage)
    paiList = []
    for i in range(13):
        paiList.append(recogPaiImage(myHandImageList[i], './template_images/paiList.png'))
    paiList.append(recogPaiImage(myTsumoImage, './template_images/paiList.png'))
    print(paiList)

def cropMyHandImage(img):
    height, width = img.shape[:2]
    myHandLeft = int(width*193/1665)
    myHandRight = int(width*1261/1665)
    myHandTop = int(height*800/938)
    myHandBottom = int(height*931/938)
    tsumoLeft = int(width*1289/1665)
    tsumoRight = int(width*1368/1665)

    myHandImage = img[myHandTop:myHandBottom, myHandLeft:myHandRight]
    myTsumoImage = img[myHandTop:myHandBottom, tsumoLeft:tsumoRight]
    myHandImage = cv2.resize(myHandImage, dsize = (1068,131))
    myTsumoImage = cv2.resize(myTsumoImage, dsize = (81,131))

    return [myHandImage, myTsumoImage]

def divideMyHandImage(myHandImage):
    width = myHandImage.shape[1]
    myHandImageList = []
    for i in range(2,1068,82):
        myHandImageList.append(myHandImage[:,i:i+81])
    return myHandImageList

def recogPaiImage(paiImage, paiListImagePath):
    # 雀牌表画像の読み込み + グレースケール化
    try:
        paiListImage = cv2.imread(paiListImagePath)
        paiListImage_gray = cv2.cvtColor(paiListImage, cv2.COLOR_BGR2GRAY)
    except Exception as e:
        print('雀牌表画像の読み込みエラーです。')
        print(e)
        return
    
    # 識別する雀牌画像のグレースケール化
    paiImage_gray = cv2.cvtColor(paiImage, cv2.COLOR_BGR2GRAY)

    # キャプチャ画像に対して、テンプレート画像との類似度を算出する
    res = cv2.matchTemplate(paiListImage_gray, paiImage_gray, cv2.TM_CCOEFF_NORMED)

    # 類似度の高い部分を検出する
    threshold = 0.7
    loc_candidate = np.where(res >= threshold)

    # マッチング座標の中で最頻値座標を求める
    mode = []
    for loc_it in loc_candidate:
        unique, freq = np.unique(loc_it, return_counts=True) 
        mode.append(unique[np.argmax(freq)])    #ここでエラーがあればどこかの牌検知できず(類似度を下げよ)
    
    # 座標を元に牌の種類を識別する
    paiList = (
        ('m1','m2','m3','m4','m5','m6','m7','m8','m9'),
        ('p1','p2','p3','p4','p5','p6','p7','p8','p9'),
        ('s1','s2','s3','s4','s5','s6','s7','s8','s9'),
        ('z1','z2','z3','z4','z5','z6','z7')
    )
    listHeight, listWidth = paiListImage.shape[:2]
    paiKind = int((mode[0]+listHeight/8)/(listHeight/4))
    paiNum = int((mode[1]+listWidth/18)/(listWidth/9))
    return paiList[paiKind][paiNum]

tmpMatch("20250115_162826.png")