require("dotenv").config();
const express = require("express");
const app = express();

const { MongoClient, ServerApiVersion } = require("mongodb");

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

    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    app.post("/books", async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
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
