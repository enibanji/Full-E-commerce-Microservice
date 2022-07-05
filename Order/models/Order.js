const mongoose = require('mongoose')

const SingleOrderItemSchema = new mongoose.Schema({
    name: {type: String, require: true},
    image: {type: String, require: true},
    price: {type: Number, require: true},
    amount: {type: Number, require: true},
    product: {type: String,
        required: true,}
});

const OrderSchema = new mongoose.Schema({
    tax:{
        type: Number,
        required: true
    },
    shippingFee:{
        type: Number,
        required: true
    },
    subtotal:{
        type: Number,
        required: true
    },
    total:{
        type: Number,
        required: true
    },
    orderItems: [SingleOrderItemSchema],
    status: {
        type: String,
        enum: ['pending', 'failed', 'paid', 'delivered', 'canceled'],
        default: 'pending',
    },
    user:{
        type: String,
        required: true,
    },
    clientSecret:{
        type: String,
        required: true,
    },
    paymentIntentId:{
        type: String
    },
}, {timestamps:true})

module.exports = mongoose.model('Order', OrderSchema)