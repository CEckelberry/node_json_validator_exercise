/*Integration tests for books routes*/

process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO books 
    (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES('1101965886', 'https://amzn.to/3sfq10b', 'George RR Martin', 'English', 
    368, 'Bantam', 'A Knight of the Seven Kingdoms', 2020) RETURNING isbn`);

    book_isbn = result.rows[0].isbn
})

describe("POST /books", async () => {
    test("Creates a new book", async () => {
        const response = await request(app)
            .post(`/books`)
            .send({
                    "isbn": "0691161518",
                    "amazon_url": "http://a.co/eobPtX2",
                    "author": "Matthew Lane Jr",
                    "language": "english",
                    "pages": 264,
                    "publisher": "Princeton University Press",
                    "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                    "year": 2017
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });

    test("Prevents creation of book without required title", async () => {
        const response = await request(app)
            .post(`/books`)
            .send({
                "isbn": "0691161515",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane Jr",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "year": 2017
            })
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /books", async () => {
    test("Get list of a single book back", async () => {
        const response = await request(app)
            .get(`/books`)
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('isbn');    
        expect(books[0]).toHaveProperty('amazon_url');    
    });
});

describe("PUT /books/:isbn", async () => {
    test("Update a single book year", async () => {
        const response = await request(app)
            .put(`/books/1101965886`)
            .send({
                "isbn": "1101965886",
                "amazon_url": "https://amzn.to/3sfq10b",
                "author": "George RR Martin",
                "language": "English",
                "pages": 368,
                "publisher": "Bantam",
                "title": "A Knight of the Seven Kingdoms",
                "year": 1998
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.book).toHaveProperty("isbn");
    });
    test("Try to update a book with invalid publisher type", async () => {
        const response = await request(app)
            .put(`/books/1101965886`)
            .send({
                "isbn": "1101965886",
                "amazon_url": "https://amzn.to/3sfq10b",
                "author": "George RR Martin",
                "language": "English",
                "pages": 368,
                "publisher": 6698,
                "title": "A Knight of the Seven Kingdoms",
                "year": 1998
            })
        expect(response.statusCode).toBe(400);
    })
});

describe("GET /books/:isbn", async () => {
    test("Get a single book", async () => {
        const response = await request(app)
            .get(`/books/1101965886`)

        expect(response.body.book).toHaveProperty('isbn');    
        expect(response.body.book).toHaveProperty('amazon_url'); 
    });
    test("Get a single book that doesn't exist", async () => {
        const response = await request(app)
        .get(`/books/11019658`)
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /books/:isbn", async () => {
    test("Delete a single book", async () => {
        const response = await request(app)
            .delete(`/books/1101965886`)
        expect(response.body).toEqual({message: "Book deleted"})
    });
});

afterEach(async () => {
    await db.query(`DELETE FROM BOOKS`);
})

afterAll(async () => {
    await db.end();
})