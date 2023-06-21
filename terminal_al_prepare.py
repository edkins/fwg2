import transformer_lens
import torch
from nltk.corpus import brown

def process_words(ws:list[str]) -> str:
    result = []
    start = True
    for w in ws:
        if w == "''":
            p = '"'
            start = False
        elif w == '``':
            p = ' "'
            start = True
        elif w == "." or w == ",":
            p = w
            start = False
        else:
            if start:
                p = w
            else:
                p = ' ' + w
            start = False
        result.append(p)
    return ''.join(result)

def main():
    torch.set_grad_enabled(False)
    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')
    model = transformer_lens.HookedTransformer.from_pretrained('gpt2-small', device=device)

    corpus = [process_words(s) for s in brown.sents()]
    print(f'{len(corpus)} sentences')

    shortest_sentence = 10
    corpus_toks = list(sorted((ts for ts in (model.tokenizer.encode(s) for s in corpus) if len(ts) >= shortest_sentence), key=len))
    print(f'Tokenized and sorted by length. n = {len(corpus_toks)}. Shortest: {len(corpus_toks[0])}. Longest: {len(corpus_toks[-1])}')

    appetite = 2560
    mini_batch = 16
    d_model = model.cfg.d_model
    results = []
    used_toks = []
    for i in range(0, appetite, mini_batch):
        j = min(appetite, i + mini_batch)
        max_length = max(len(ts) for ts in corpus_toks[i:j])
        print(i, max_length)
        t = torch.zeros((j - i, max_length), dtype=torch.long, device=device)
        for k, ts in enumerate(corpus_toks[i:j]):
            t[k, :len(ts)] = torch.tensor(ts, dtype=torch.long)
        used_toks += [t0.cpu().numpy() for t0 in t]
        _, stuff = model.run_with_cache(t)
        for k in range(j - i):
            results.append(stuff['blocks.3.hook_resid_pre'][k].cpu().numpy())

    to_store = {
        'corpus_toks': used_toks,
        'results': results,
    }
    torch.save(to_store, 'corpus_toks.pt')

if __name__ == '__main__':
    main()
