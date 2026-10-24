import sqlite3
import os

def create_database():

    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'database.db')

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    cursor.execute('DROP TABLE IF EXISTS books')


    # Create table for books
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            pages INTEGER NOT NULL)'''
                   )

    # Save changes and close the connection
    connection.commit()
    connection.close()
    print("Tietokanta 'books' luotu")

if __name__ == "__main__":
    create_database()