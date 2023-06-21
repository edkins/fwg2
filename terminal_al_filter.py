import transformer_lens
import torch
import numpy as np
import random

def get_prompt(model, toks, tok_ix) -> str:
    return model.tokenizer.decode(toks[:tok_ix]) + '[[' + model.tokenizer.decode(toks[tok_ix:tok_ix+1]) + ']]' + model.tokenizer.decode(toks[tok_ix+1:])

def main():
    torch.set_grad_enabled(False)
    device = 'cpu'
    print(f'Using device: {device}')
    model = transformer_lens.HookedTransformer.from_pretrained('gpt2-small', device=device)

    stuff = torch.load('corpus_toks.pt')
    corpus_toks = stuff['corpus_toks']
    results = stuff['results']

    print(f'{len(corpus_toks)} sentences')

    doc_ixs0 = []
    tok_ixs0 = []
    for i, ts in enumerate(corpus_toks):
        for j in range(1, len(ts)):   # don't ask about the first token
            doc_ixs0.append(i)
            tok_ixs0.append(j)

    want_keep = 10000
    d_model = model.cfg.d_model
    i = 0
    X = np.zeros((want_keep, d_model))
    doc_ixs = []
    tok_ixs = []
    random.seed(42)
    printed = 0
    prompts = []
    for ix in random.sample(range(len(doc_ixs0)), len(doc_ixs0)):
        new_res = results[doc_ixs0[ix]][tok_ixs0[ix]]
        if i > 0:
            distances = np.linalg.norm(X[:i,:] - new_res.reshape((1, d_model)), axis=1)
            distance = distances.min()
            if distance < 25:
                if printed < 30:
                    print(get_prompt(model, corpus_toks[doc_ixs0[ix]], tok_ixs0[ix]))
                    ix2 = np.argmin(distances)
                    print(get_prompt(model, corpus_toks[doc_ixs[ix2]], tok_ixs[ix2]))
                    print()
                    printed += 1
                continue

        X[i,:] = new_res
        doc_ixs.append(doc_ixs0[ix])
        tok_ixs.append(tok_ixs0[ix])
        prompts.append(get_prompt(model, corpus_toks[doc_ixs0[ix]], tok_ixs0[ix]))
        i += 1
        if i >= want_keep:
            break

    n_tokens = len(doc_ixs)
    doc_ixs = np.array(doc_ixs, dtype=np.int32)
    tok_ixs = np.array(tok_ixs, dtype=np.int32)
    print(f"Wanted {want_keep}. Got {n_tokens}.")
    X = X[:n_tokens,:]

    print(f'd_model = {d_model}')
    out_stuff = {
        'X': X,
        'prompts': prompts,
    }
    torch.save(out_stuff, 'corpus_toks_filtered.pt')

if __name__ == '__main__':
    main()