import torch
import numpy as np
import random
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from skactiveml.classifier import SklearnClassifier
from skactiveml.pool import UncertaintySampling
from skactiveml.utils import MISSING_LABEL

def get_prompt(model, toks, tok_ix) -> str:
    return model.tokenizer.decode(toks[:tok_ix]) + '[[' + model.tokenizer.decode(toks[tok_ix:tok_ix+1]) + ']]' + model.tokenizer.decode(toks[tok_ix+1:])

def ask(prompt:str) -> int:
    while True:
        s = input(f'{prompt}    ')
        if s == 'y':
            return 1
        elif s == 'n':
            return 0
        elif s == 'q':
            return None

def main():
    stuff = torch.load('corpus_toks_filtered.pt')
    X = stuff['X']
    prompts = stuff['prompts']

    n_tokens = len(prompts)
    print(f'{n_tokens} prompts')

    # Active learning
    y = np.full(shape=(n_tokens,), fill_value=MISSING_LABEL)
    clf = SklearnClassifier(LogisticRegression(), classes=[0,1])
    qs = UncertaintySampling(method='entropy', random_state=42)

    clf.fit(X, y)
    while True:
        query_idx = qs.query(X=X, y=y, clf=clf, batch_size=1)[0]
        prompt = prompts[query_idx]
        user_value = ask(prompt)
        if user_value == None:
            break
        y[query_idx] = user_value
        clf.fit(X, y)

    print('Examples')
    print('--------')
    yguess = clf.predict_proba(X)[:,1]
    ix = np.argsort(yguess)
    for j in range(0, len(ix), 100):
        i = ix[j]
        print(f'{yguess[i]:.3f} {prompts[i]}')
    coeffs = clf.coef_[0]
    print('Largest Coefficients')
    print('--------------------')
    ix = np.argsort(np.abs(coeffs))
    for i in ix[-20:]:
        print(f'{i}: {coeffs[i]:.3f}')

if __name__ == '__main__':
    main()
