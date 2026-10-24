

from flask import Flask, render_template, request, jsonify
import sqlite3
import os

# Define paths for flask
basedir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(basedir, '../frontend')
static_dir = os.path.join(basedir, '../frontend')

# Tell flask where templates and static files are located
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Database path
db_path = os.path.join(basedir, 'database.db')

def get_db_connection():
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection

# Shows the main page of the application
@app.route('/')
def index():
    return render_template('index.html')


# Api route, add new book to database
@app.route('/api/add_book', methods=['POST'])
def add_book():
    # Get the data from the request
    title = request.form.get('title')
    author = request.form.get('author')
    pages = request.form.get('pages')

    if not title or not author or not pages:
        return jsonify({'error': 'Täytä kaikki kentät'}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO books (title, author, pages) VALUES (?, ?, ?)',
                 (title, author, int(pages)))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Kirja lisätty onnistuneesti'}), 201

# API route, get statistic for report winwdow
@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    
    # Get statistics: total number of books and total pages
    stats = conn.execute('SELECT COUNT(*) as total_books, SUM(pages) as total_pages FROM books').fetchone()
    
    # Fetch all books from database
    books_query = conn.execute('SELECT id,title, author, pages FROM books ORDER BY id DESC').fetchall()
    conn.close()

    total_books = stats['total_books'] if stats['total_books'] is not None else 0
    total_pages = stats['total_pages'] if stats['total_pages'] is not None else 0

    # Change the books_query to a list of dictionaries for JSON serialization
    books_list = [dict(book) for book in books_query]

    return jsonify({
        "total_books": total_books,
        "total_pages": total_pages,
        "books": books_list
    })

# API route, update book information in the database
@app.route('/api/update_book', methods=['POST'])
def update_book():
    book_id = request.form.get('id')
    title = request.form.get('title')
    author = request.form.get('author')
    pages = request.form.get('pages')

    # Check that all data exists and is valid
    if not book_id or not title or not author or not pages:
        return jsonify({'error': 'Puuttuvia tietoja'}), 400

    conn = get_db_connection()
    # Change the query just to be sure that the pages and id are stored as an integer
    conn.execute('UPDATE books SET title = ?, author = ?, pages = ? WHERE id = ?',
                 (title, author, int(pages), int(book_id)))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Kirja päivitetty onnistuneesti'}), 200

# Delete book from database
@app.route('/api/delete_book', methods=['POST'])
def delete_book():
    book_id = request.form.get('id')

    if not book_id:
        return jsonify({'error': 'ID puuttuu'}), 400

    conn = get_db_connection()
    conn.execute('DELETE FROM books WHERE id = ?', (int(book_id),))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Kirja poistettu onnistuneesti'}), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
    