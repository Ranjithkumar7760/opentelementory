from flask import Flask, request, jsonify
import os

app = Flask(__name__)

user_histories = {}

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'user'})

@app.route('/history', methods=['POST'])
def add_history():
    data = request.json
    user = data.get('user')
    if user not in user_histories:
        user_histories[user] = []
    user_histories[user].append({
        'order_id': data.get('order_id'),
        'total': data.get('total'),
        'status': data.get('status')
    })
    return jsonify({'success': True, 'history': user_histories[user]})

@app.route('/history/<user>', methods=['GET'])
def get_history(user):
    return jsonify(user_histories.get(user, []))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)
