from flask_limiter import Limiter
import bcrypt

# Initialize the limiter
limiter = Limiter(app, key_func=get_remote_address)

@limiter.limit("5 per minute")
@app.route('/verdicts', methods=['GET'])
def get_verdicts():
    pass

@limiter.limit("5 per minute")
@app.route('/news/latest', methods=['GET'])
def get_latest_news():
    pass

@limiter.limit("5 per minute")
@app.route('/news/live-facts', methods=['GET'])
def get_live_facts():
    pass

@limiter.limit("5 per minute")
@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    pass

@limiter.limit("5 per minute")
@app.route('/admin/fetch-news', methods=['POST'])
def post_fetch_news():
    pass

@limiter.limit("5 per minute")
@app.route('/admin/extract-claims', methods=['POST'])
def post_extract_claims():
    pass

@limiter.limit("5 per minute")
@app.route('/admin/update-index', methods=['POST'])
def post_update_index():
    pass


#Updated function for API key verification

def verify_api_key(api_key):
    try:
        # Hashing the API key using bcrypt
        hashed_api_key = bcrypt.hashpw(api_key.encode('utf-8'), bcrypt.gensalt())
        return hashed_api_key
    except Exception as e:
        app.logger.error(f'An error occurred while verifying the API key: {str(e)}')
        return None


# Importing bcrypt for security
import bcrypt
