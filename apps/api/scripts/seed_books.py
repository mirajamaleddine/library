import os
import sys
import uuid

# Ensure the apps/api root (parent of scripts/) is on the path.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.domain.models import Book

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"


def fetch_books():
    params = {
        "q": "subject:fiction",
        "maxResults": 25,
        "printType": "books"
    }

    response = requests.get(GOOGLE_BOOKS_URL, params=params, timeout=20)
    response.raise_for_status()

    data = response.json()
    return data.get("items", [])


def seed():
    items = fetch_books()

    with SessionLocal() as db:
        for item in items:
            volume = item.get("volumeInfo", {})

            title = volume.get("title")
            authors = volume.get("authors", [])
            description = volume.get("description")
            published_date = volume.get("publishedDate")
            image_links = volume.get("imageLinks", {})

            if not title or not authors:
                continue

            author = ", ".join(authors)

            cover_image_url = image_links.get("thumbnail")

            # Avoid duplicates by title + author
            existing = db.query(Book).filter(
                Book.title == title,
                Book.author == author
            ).first()

            if existing:
                continue

            book = Book(
                id=uuid.uuid4(),
                title=title,
                author=author,
                description=description,
                published_year=int(published_date[:4]) if published_date and published_date[:4].isdigit() else None,
                available_copies=3,
                cover_image_url=cover_image_url
            )

            db.add(book)

        db.commit()

    print("Seeding complete.")


if __name__ == "__main__":
    seed()