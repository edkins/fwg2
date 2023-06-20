from flask import Flask, url_for, redirect

app = Flask(__name__)

@app.route('/')
def index():
    return redirect('static/index.html')

@app.route('/api')
def hello_world():
    return 'Hello, World!'
