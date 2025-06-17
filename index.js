require("dotenv").config();
const express = require("express");
const app = express();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const cors = require("cors");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster23.fbyecqb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster23`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const booksCollection = client.db("booksDB").collection("books");
    const borrowersCollection = client.db("booksDB").collection("borrowers");

    // getting all the books

    app.get("/books", async (req, res) => {
      const category = req.query.category;

      let query = {};
      if (category) {
        query = { category: { $regex: `^${category}$`, $options: "i" } };
      }

      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    // getting all the borrowed books

    app.get("/borrows", async (req, res) => {
      const email = req.query.email;
      if (email) {
        query = { borrowerEmail: email };
      }
      const result = await borrowersCollection.find(query).toArray();
      res.send(result);
    });

    // getting single books to update

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // adding books in database

    app.post("/books", async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });

    // adding borrowersData in different collection of database

    app.post("/borrows", async (req, res) => {
      const borrowersData = req.body;
      const result = await borrowersCollection.insertOne(borrowersData);
      res.send(result);
    });

    // updating books in database

    app.put("/books/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooks = req.body;
      const updatedDoc = {
        $set: updatedBooks,
      };

      const options = { upsert: true };

      const result = await booksCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // borrows a book

    app.patch("/borrow/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: { quantity: -1 },
      };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // returns a book

    app.patch("/return/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: { quantity: 1 },
      };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // remove the book from borrowers collection

    app.delete("/borrows/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowersCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Books are cooking");
});

app.listen(port, () => {
  console.log("app is listening", port);
});
