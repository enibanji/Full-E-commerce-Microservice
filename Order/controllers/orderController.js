const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const { checkPermissions } = require('../utils')
const Order = require('../models/Order')
const stripe = require('stripe')(process.env.STRIPE_KEY);
const amqp = require('amqplib')


var channel, connection;
async function connect () {
    const amqpServer = "amqps://eocyfcod:10di7yuGkhLvkQ3FCzc9h6WkkT9OmeDd@rattlesnake.rmq.cloudamqp.com/eocyfcod"
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}

connect();

const makePayment = async ({orderItems,total,subtotal,tax,shippingFee,user}) => {
    // get client secret
    console.log(total,subtotal);
    // console.log(subtotal);
    try{

    const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
      });
      console.log(paymentIntent.client_secret);
      const order = await Order.create({
        orderItems,total,subtotal,tax,shippingFee,clientSecret: paymentIntent.client_secret,user
    })
    // console.log(order);
    return order
}
catch(err){
    throw err
}
}


const createOrder = async (req,res) => {
    const {items:cartItems, tax, shippingFee} = req.body;
    const user = req.user.userId
    if(!cartItems || cartItems.length < 1) {
        throw new CustomError.BadRequestError('No cart items provided');
    }
    if(!tax || !shippingFee){
        throw new CustomError.BadRequestError('Please provide tax and shipping fee')
    }
    // console.log(cartItems);
    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                cartItems,
                tax,
                shippingFee
            })
        )
    );
    channel.consume("PRODUCT", (data) => {
        console.log('Consuming product queue');
        // console.log(JSON.parse(data.content));
        newOrder = JSON.parse(data.content)
        // console.log(newOrder);
        // const{productId} = newOrder
        //     if (productId) {
        //         return res.status(StatusCodes.OK).json({msg:`No Product with id: ${productId} found`})
        //     } 
        
        const{total, subtotal, orderItems} = newOrder
        console.log(subtotal, total);
        makePayment({total:total, subtotal:subtotal, orderItems:orderItems, tax, shippingFee, user})
        .then(val =>{
               return res.status(StatusCodes.OK).json({order: val, clientSecret: val.clientSecret})
            }).catch(err => console.log(err))
        channel.ack(data);
        
         
        
    })
 }

const getAllOrders = async (req,res) => {
    const orders = await Order.find({})
    res.status(StatusCodes.OK).json({orders, count: orders.length})
}

const getSingleOrders = async (req,res) => {
    const {id:orderId} = req.params
    const order = await Order.findOne({_id:orderId})
    if(!order){
        throw new CustomError.NotFoundError(`No product with id : ${orderId}`)
    }
    checkPermissions(req.user, order.user)
    res.status(StatusCodes.OK).json({order})
}

const getCurrentUserOrders = async (req,res) => {
    const orders = await Order.find({user:req.user.userId})
    res.status(StatusCodes.OK).json({orders, count: orders.length})
}

const updateOrder = async (req,res) => {
    const {id:orderId} = req.params;
    const {paymentIntentId} = req.body
    const order = await Order.findOne({_id:orderId})
    if(!order){
        throw new CustomError.NotFoundError(`No product with id : ${orderId}`)
    }
    checkPermissions(req.user, order.user)
    order.paymentIntentId = paymentIntentId
    order.status = 'paid'
    await order.save()
    res.status(StatusCodes.OK).json({order})
}

module.exports = {
    createOrder,
    getAllOrders,
    getSingleOrders,
    getCurrentUserOrders,
    updateOrder,
}