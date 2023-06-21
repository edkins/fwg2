import transformer_lens
import torch
import numpy as np
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

def main():
    torch.set_grad_enabled(False)
    device = 'cpu'
    print(f'Using device: {device}')
    model = transformer_lens.HookedTransformer.from_pretrained('gpt2-small', device=device)

    stuff = torch.load('corpus_toks.pt')
    corpus_toks = stuff['corpus_toks']
    results = stuff['results']

    print(f'{len(corpus_toks)} sentences')

    doc_ixs = []
    tok_ixs = []
    for i, ts in enumerate(corpus_toks):
        for j in range(len(ts)):
            doc_ixs.append(i)
            tok_ixs.append(j)

    n_tokens = len(doc_ixs)
    doc_ixs = np.array(doc_ixs, dtype=np.int32)
    tok_ixs = np.array(tok_ixs, dtype=np.int32)
    print(f'{n_tokens} tokens')

    d_model = model.cfg.d_model
    print(f'd_model = {d_model}')
    X = np.zeros((n_tokens, d_model), dtype=np.float32)
    i = 0
    for res in results:
        j = i + res.shape[0]
        X[i:j] = res
        i = j
    if i != n_tokens:
        raise Exception(f'Expected {n_tokens} tokens but got {i}')

    X = PCA(n_components=50).fit_transform(X)

    # Active learning
    y = np.full(shape=(n_tokens,), fill_value=MISSING_LABEL)
    clf = SklearnClassifier(LogisticRegression(), classes=[0,1])
    qs = UncertaintySampling(method='entropy', random_state=42)
    n_cycles = 20

    clf.fit(X, y)
    for c in range(n_cycles):
        query_idx = qs.query(X=X, y=y, clf=clf, batch_size=1)[0]
        prompt = get_prompt(model, corpus_toks[doc_ixs[query_idx]], tok_ixs[query_idx])
        y[query_idx] = ask(prompt)
        clf.fit(X, y)

    print('Examples')
    print('-------')
    yguess = clf.predict_proba(X)[:,1]
    ix = np.argsort(yguess)
    for j in range(0, len(ix), 100):
        i = ix[j]
        print(f'{yguess[i]:.3f} {get_prompt(model, corpus_toks[doc_ixs[i]], tok_ixs[i])}')
    

if __name__ == '__main__':
    main()
