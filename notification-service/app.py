from flask import Flask, request, jsonify
import os

app = Flask(__name__)

notifications = []

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'notification'})

@app.route('/notify', methods=['POST'])
def notify():
    data = request.json
    notification = {
        'order_id': data.get('order_id'),
        'user': data.get('user'),
        'status': data.get('status'),
        'total': data.get('total'),
        'message': f"Order #{data.get('order_id')} status: {data.get('status')} - Total: ${data.get('total', 0)}",
        'sent': True
    }
    notifications.append(notification)
    return jsonify(notification)

@app.route('/notifications', methods=['GET'])
def get_notifications():
    return jsonify(notifications)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)
