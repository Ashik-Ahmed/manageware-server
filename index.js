const express = require('express');
const cors = require('cors');
const port = process.env.port || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const app = express();

app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        console.log('Decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://manageware:manageware321@cluster0.m12jl.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const productsCollection = client.db('manageware').collection('products');


        app.put('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            // console.log('user:', user, 'Token:', accessToken);
            res.send({ accessToken });
        })

        //get all products
        app.get('/products', async (req, res)=>{
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
            })

            // get a single product by id
            app.get('/product/:id', verifyJWT, async (req, res)=>{
                const id = req.params.id;
                const query = {_id : ObjectId(id)};

                const product = await productsCollection.findOne(query);
                res.send(product);
            })

            // add a new item 
            app.post('/add-product', async (req, res) => {
                const newProduct = req.body;
                const result = await productsCollection.insertOne(newProduct);
                res.send(result)
            });

            // get products by user email 
            app.get('/myproducts', verifyJWT, async (req, res) => {

            const authHeader = req.headers.authorization;
            // console.log(authHeader);

            // const decodedEmail = req.decoded.email;
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productsCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }

        })


          // update product quantity
          app.put('/update-product/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const filter = { _id: ObjectId(id) };
            const ooptions = { upsert: true };

            console.log('ID:', id, 'product:', updatedProduct)

            const updatedDoc = {
                $set: {
                    quantity: updatedProduct.updatedQuantity,
                    // sold: updatedProduct?.sold,
                }
            };

            const result = await productsCollection.updateOne(filter, updatedDoc, ooptions);
            res.send(result);
        })


        //delete a product
        app.delete('/delete-product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        }
    
        finally{
    
        }
}

run().catch(console.dir);

    app.get('/', (req, res)=>{
        res.send("ManageWare Server is Running");
    })

    app.listen(port, ()=>{
        console.log("ManageWare server is Running");
    })