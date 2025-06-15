from flask import Flask
from config import SECRET_KEY
from db import init_db
from routes import register_routes

app = Flask(__name__)
app.secret_key = SECRET_KEY

# Register routes
register_routes(app)

# Production config
@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

if __name__ == '__main__':
    init_db()
    app.run(debug=True)