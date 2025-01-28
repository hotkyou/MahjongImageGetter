import pickle
import lightgbm
import numpy as np

with open("model/risky.pkl", mode='rb') as fi:
    MODEL = pickle.load(fi)
    
    