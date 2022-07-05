require('dotenv').config()
require('express-async-errors')

const express = require('express')
const app = express()
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

//data base
const connectDB = require('./db/connect')

//routers
const authRouter = require('./routes/authroutes')
const userRouter = require('./routes/userRoutes')


//error middleware
const errorHandlerMiddleware = require('./middleware/error-handler')
const notFoundMiddleware = require('./middleware/not-found')

app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

app.get('/', (req,res) => {
    res.send('Ecommerce Customer')
})

//routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);


app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

port = process.env.PORT || 8001

const start = async(req,res) => {
    try {
        await connectDB(process.env.MONGO_URL)
        app.listen(port, () => {
            console.log(`server is listening on port: ${port}`);
        })
    } catch (error) {
        console.log(error)
    }
}

start()






