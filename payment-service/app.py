from flask import Flask, request, jsonify
import requests
import os
import random

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

resource = Resource.create({
    "service.name": "payment-service"
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
ORDER_SERVICE = os.getenv('ORDER_SERVICE', 'http://order-service:5002')
NOTIFICATION_SERVICE = os.getenv('NOTIFICATION_SERVICE', 'http://notification-service:5004')
USER_SERVICE = os.getenv('USER_SERVICE', 'http://user-service:5005')

payments = []

def validate_token(token):
    try:
        r = requests.post(f'{AUTH_SERVICE}/validate', headers={'Authorization': f'Bearer {token}'}, timeout=5)
        return r.json() if r.status_code == 200 else None
    except:
        return None

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'payment'})

@app.route('/charge', methods=['POST'])
def charge():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_data = validate_token(token)
    if not user_data or not user_data.get('valid'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    amount = data.get('amount', 0)
    order_id = data.get('order_id')

    # Mock payment
    success = True
    transaction_id = f'TXN{random.randint(100000, 999999)}'

    payment = {
        'transaction_id': transaction_id,
        'order_id': order_id,
        'amount': amount,
        'success': success,
        'message': 'Payment processed successfully',
        'user': user_data['user']
    }
    payments.append(payment)

    # Update Order Service
    try:
        requests.post(f'{ORDER_SERVICE}/orders/{order_id}/pay',
            headers={'Authorization': f'Bearer {token}'}, timeout=5)
    except Exception as e:
        payment['order_update_error'] = str(e)

    # Send Notification
    try:
        requests.post(f'{NOTIFICATION_SERVICE}/notify', json={
            'order_id': order_id,
            'user': user_data['user'],
            'status': 'paid',
            'amount': amount
        }, timeout=5)
    except:
        pass

    # Update User History
    try:
        requests.post(f'{USER_SERVICE}/history', json={
            'order_id': order_id,
            'user': user_data['user'],
            'total': amount,
            'status': 'paid'
        }, timeout=5)
    except:
        pass

    return jsonify(payment)

@app.route('/payments', methods=['GET'])
def get_payments():
    return jsonify(payments)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
