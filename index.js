require("dotenv").config();
const express = require("express");
const app = express();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

var admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

// unauthorized verifying

const verifyFireBaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

// forbidden verifying

const verifyTokenEmail = (req, res, next) => {
  if (req.query.email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

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

    app.get(
      "/borrows",
      verifyFireBaseToken,
      verifyTokenEmail,
      async (req, res) => {
        const email = req.query.email;
        let query;
        if (email) {
          query = { borrowerEmail: email };
        }
        const result = await borrowersCollection.find(query).toArray();
        res.send(result);
      }
    );

    // getting single books to update

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.status(200).send(result);
    });

    // adding books in database

    app.post("/books", verifyFireBaseToken, async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });

    // adding borrowersData in different collection of database

    app.post("/borrows", verifyFireBaseToken, async (req, res) => {
      const borrowersData = req.body;
      const email = req.query.email;

      let query;

      if (email) {
        query = { borrowerEmail: email };
      }

      const resultBorrowBooks = await borrowersCollection.find(query).toArray();

      if (resultBorrowBooks.length >= 3) {
        return res
          .status(460)
          .send({ message: "You can't borrow more than 3 books" });
      } else {
        const result = await borrowersCollection.insertOne(borrowersData);
        res.send(result);
      }
    });

    // updating books in database

    app.put("/books/:id", verifyFireBaseToken, async (req, res) => {
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

    app.patch("/borrow/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: { quantity: -1 },
      };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // returns a book

    app.patch("/return/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: { quantity: 1 },
      };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // remove the book from borrowers collection

    app.delete("/borrows/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
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
