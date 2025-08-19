from flask import Flask
from routes.query_route import query_bp

app = Flask(__name__)

# Register Blueprint
app.register_blueprint(query_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)