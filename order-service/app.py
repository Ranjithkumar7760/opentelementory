from flask import Flask, request, jsonify
import requests
import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

resource = Resource.create({
    "service.name": "order-service"
})

provider = TracerProvider(resource=resource)

trace.set_tracer_provider(provider)

provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            endpoint="http://otel-collector:4317",
            insecure=True
        )
    )
)

app = Flask(__name__)

FlaskInstrumentor().instrument_app(app)

RequestsInstrumentor().instrument()

AUTH_SERVICE = os.getenv('AUTH_SERVICE', 'http://auth-service:5001')

orders = []
order_id = 0

def validate_token(token):
    try:
        r = requests.post(f'{AUTH_SERVICE}/validate', headers={'Authorization': f'Bearer {token}'}, timeout=5)
        return r.json() if r.status_code == 200 else None
    except:
        return None

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'order'})

@app.route('/orders', methods=['POST'])
def create_order():
    global order_id
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    user_data = validate_token(token)
    if not user_data or not user_data.get('valid'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    order_id += 1
    order = {
        'id': order_id,
        'user': user_data['user'],
        'items': data.get('items', []),
        'total': data.get('total', 0),
        'status': 'pending'
    }
    orders.append(order)

    return jsonify(order), 201

@app.route('/orders/<int:order_id>/pay', methods=['POST'])
def pay_order(order_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_data = validate_token(token)
    if not user_data or not user_data.get('valid'):
        return jsonify({'error': 'Unauthorized'}), 401

    order = next((o for o in orders if o['id'] == order_id), None)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order['status'] != 'pending':
        return jsonify({'error': f'Order already {order["status"]}'}), 400

    order['status'] = 'paid'
    return jsonify(order)

@app.route('/orders', methods=['GET'])
def get_orders():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_data = validate_token(token)
    if not user_data or not user_data.get('valid'):
        return jsonify({'error': 'Unauthorized'}), 401
    user_orders = [o for o in orders if o['user'] == user_data['user']]
    return jsonify(user_orders)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
