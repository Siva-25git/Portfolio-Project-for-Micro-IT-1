# app.py
from flask import Flask, render_template, jsonify, request, send_from_directory
import json
import os
import uuid # For generating unique IDs
from datetime import datetime # For setting post date

app = Flask(__name__)

# Path to your JSON data file
DATA_FILE = os.path.join(app.root_path, 'posts.json')

# Load blog posts from JSON file
def load_posts():
    try:
        if not os.path.exists(DATA_FILE):
            # If file doesn't exist, create it with an empty array
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=4)
            return []
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {DATA_FILE}. Returning empty list.")
        # Optionally, back up the corrupted file before returning empty
        return []
    except Exception as e:
        print(f"An unexpected error occurred while loading posts: {e}")
        return []

# Save blog posts to JSON file
def save_posts(posts_data):
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, indent=4) # indent for pretty printing
        return True
    except Exception as e:
        print(f"Error saving posts to {DATA_FILE}: {e}")
        return False

# Load posts once when the app starts
posts = load_posts()

@app.route('/')
def index():
    """Serves the main HTML page for the blog."""
    return render_template('index.html')

@app.route('/api/posts', methods=['GET'])
def get_all_posts():
    """Returns a list of all blog post summaries (id, title, date, author, excerpt)."""
    # Ensure posts list is up-to-date in case of changes
    global posts
    posts = load_posts() # Reload posts to get latest data
    summaries = [{k: post[k] for k in ('id', 'title', 'date', 'author', 'excerpt')} for post in posts]
    # Sort posts by date, newest first
    summaries.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'), reverse=True)
    return jsonify(summaries)

@app.route('/api/posts/<string:post_id>', methods=['GET'])
def get_single_post(post_id):
    """Returns the full content of a single blog post by its ID."""
    global posts
    posts = load_posts() # Reload posts to get latest data
    for post in posts:
        if post['id'] == post_id:
            return jsonify(post)
    return jsonify({"error": "Post not found"}), 404

@app.route('/api/posts/new', methods=['POST'])
def create_new_post():
    """Receives new post data and adds it to posts.json."""
    global posts # Declare global to modify the 'posts' list
    data = request.get_json()

    # Basic validation
    if not data or not all(k in data for k in ['title', 'author', 'excerpt', 'content']):
        return jsonify({"error": "Missing required fields (title, author, excerpt, content)"}), 400

    new_post = {
        "id": str(uuid.uuid4()), # Generate a unique ID
        "title": data['title'],
        "date": datetime.now().strftime('%Y-%m-%d'), # Current date
        "author": data['author'],
        "excerpt": data['excerpt'],
        "content": data['content']
    }

    posts.append(new_post)
    if save_posts(posts):
        return jsonify({"message": "Post created successfully", "post_id": new_post['id']}), 201
    else:
        # If saving failed, remove the post from memory to keep consistent
        posts.pop()
        return jsonify({"error": "Failed to save post to file"}), 500

# Serve favicon.ico (optional, to suppress 404 warnings)
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run(debug=True)