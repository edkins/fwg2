from flask import Flask, url_for, redirect, request

app = Flask(__name__)

documents = {}

def process_document(document):
    result = {'lines': [], 'strings': []}
    for line in document['lines']:
        text = line['text']
        pos = line['pos']
        breakdown = []
        if text.startswith('tokenize '):
            breakdown = [{
                'type': 'keyword',
                'text': 'tokenize ',
                'position': 0,
            },{
                'type': 'string',
                'text': text[9:],
                'position': 9,
            }]
        else:
            breakdown = [{
                'type': 'unknown',
                'text': text,
                'position': 0,
            }]
        result['lines'].append({'text': text, 'pos': pos, 'breakdown': breakdown})
    return result

@app.route('/')
def index():
    return redirect('static/index.html')

@app.put('/api/document/<document_id>')
def put_document(document_id):
    documents[document_id] = request.json
    return process_document(documents[document_id])
