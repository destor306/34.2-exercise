const request = require("supertest");
const app = require("../app");
const db = require("../db");


process.env.NODE_ENV = "test"

let sample_book_isbn;

beforeEach(async function(){
    let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '123432122',
        'https://amazon.com/taco',
        'Elie',
        'English',
        100,
        'Nothing publishers',
        'my first book', 2008)
      RETURNING isbn`);
      sample_book_isbn = result.rows[0].isbn;
})

describe("GET /books", function(){
    test("can get all list of books", async function(){
        let response = await request(app).get("/books")
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");

    })
})
describe("GET /books/:id", function(){
    test("Can get a book", async function(){
        let response = await request(app).get(`/books/${sample_book_isbn}`)
        const book = response.body.book;
        expect(book).toHaveProperty("isbn");
        expect(book).toHaveProperty("amazon_url");

    })
})
describe("POST /books", function(){
    test("Can post a book", async function(){
        let response = await request(app).post(`/books`)
        .send({
            isbn: '1234',
            amazon_url: "https://amazon.com",
            author: "jason",
            language: "english",
            pages: 512,
            publisher: "idk",
            title: "amzon booK",
            year: 2009
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book).toHaveProperty("year");

    })
    test("Bad request to post a book", async function(){
        const response = await request(app).post("/books")
        .send({
            amazon_url: "https://google.com"
        });
        expect(response.statusCode).toBe(400);
    })
})

describe("PUT /books/:id", function(){
    test("Can update a book", async function(){
        let response = await request(app).put(`/books/${sample_book_isbn}`)
        .send({
            amazon_url: "https://amazon.com",
            author: "yoo",
            language: "english",
            pages: 123,
            publisher: "idk",
            title: "amzon booK",
            year: 2009
        });
        expect(response.body.book.author).toBe("yoo");
        expect(response.body.book.pages).toBe(123);
    })
    test("Wrong book update", async function(){
        const response = await request(app).put(`/books/${sample_book_isbn}`)
        .send({
            isbn: '1234',
            amazon_url: "https://amazon.com",
            weird_position: "hahahahaha",
            author: "yoo",
            language: "english",
            pages: 123,
            publisher: "idk",
            title: "amzon booK",
            year: 2009
        });
        expect(response.statusCode).toBe(400);
    })
})

describe("Delete /books/:id", function(){
    test("Deleting a book", async function(){
        const response = await request(app).delete(`/books/${sample_book_isbn}`)
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({message: "Book deleted"})
    })
    test("Deleting none existing book", async function(){
        const response = await request(app).delete(`/books/1`)
        expect(response.statusCode).toBe(404);
    })
})

afterEach(async function(){
    await db.query("DELETE FROM BOOKS");
})

afterAll(async function(){
    await db.end();
})