from flask import Flask, request, jsonify
import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

resource = Resource.create({
    "service.name": "notification-service"
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
