import os

from flask import Flask, redirect, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from routes.translate import translate_bp
from routes.auth import auth_bp
from db import init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
app = Flask(__name__, static_folder=frontend_path, static_url_path="")

CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours
jwt = JWTManager(app)

if not app.config['JWT_SECRET_KEY']:
    raise RuntimeError("JWT_SECRET_KEY is not configured")

init_db()

# Register blueprints
app.register_blueprint(translate_bp)
app.register_blueprint(auth_bp)


@app.before_request
def use_canonical_local_origin():
    """Keep Google OAuth on one configured local browser origin."""
    if request.host.split(':', 1)[0] == '127.0.0.1':
        return redirect(request.url.replace('//127.0.0.1', '//localhost', 1), code=308)


@app.after_request
def allow_oauth_popup_messages(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    return response

@app.route("/")
def home():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)
