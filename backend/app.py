import os

from flask import Flask
from flask_cors import CORS
from routes.translate import translate_bp

frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
app = Flask(__name__, static_folder=frontend_path, static_url_path="")

CORS(app)

app.register_blueprint(translate_bp)

@app.route("/")
def home():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)