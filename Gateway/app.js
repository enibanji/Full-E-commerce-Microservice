require('dotenv').config()


const express = require('express')
const app = express()
const cors = require('cors')
const proxy = require('express-http-proxy')

app.use(cors())
app.use(express.json())

app.use('/customer', proxy('http://localhost:8001'))
app.use('/product', proxy('http://localhost:8002'))
app.use('/', proxy('http://localhost:8003'))



port = process.env.PORT || 8000

const start = async(req,res) => {
    try {

        app.listen(port, () => {
            console.log(`server is listening on port: ${port}`);
        })
    } catch (error) {
        console.log(error)
    }
}

start()






