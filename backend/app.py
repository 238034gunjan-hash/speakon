from flask import Flask
from flask_cors import CORS
from routes.translate import translate_bp

app = Flask(__name__)

CORS(app)

app.register_blueprint(translate_bp)

@app.route("/")
def home():
    return "SpeakOn Backend Running"

if __name__ == "__main__":
    app.run(debug=True)