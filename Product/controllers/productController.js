const Product = require('../models/Product')
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const path = require('path')
const amqp = require('amqplib')


const createProduct = async (req,res) => {
    req.body.user = req.user.userId;
    const product = await Product.create(req.body)
    res.status(StatusCodes.CREATED).json({product});
}

const getAllProducts = async (req,res) => {
    const products = await Product.find({})
    res.status(StatusCodes.OK).json({ products });
}

const getSingleProduct = async (req,res) => {
    const {id: productId} = req.params
    const product = await Product.findOne({_id:productId}).populate('reviews')
    if (!product) {
        throw new  CustomError.NotFoundError(`no product with id ${productId} found`)
    }
    res.status(StatusCodes.OK).json({ product });
}



const updateProduct = async (req,res) => {
    console.log(req.body);
    const {id: productId} = req.params
    const product =  await Product.findOneAndUpdate(
        {_id: productId},
        req.body,
        {new:true, runValidators: true})
        if (!product) {
            throw new CustomError.NotFoundError(`no product with id ${productId} found`)
        }
        res.status(StatusCodes.CREATED).json({ product })
}

const deleteProduct = async (req,res) => {
    const {id: productId} = req.params
    // const product = await Product.findByIdAndDelete({_id:productId})
    const product = await Product.findOne({_id:productId})
    if (!product) {
        throw new CustomError.NotFoundError(`no product with id ${productId} found`)
    }
    await product.remove()
    res.status(StatusCodes.OK).json({ msg:"success, product removed" })
}



const uploadImage = async (req,res) => {
    // console.log(req.files);
    if (!req.files) {
        throw new CustomError.BadRequestError('No file uploaded')
    };
    const productImage = req.files.image;
    if(!productImage.mimetype.startsWith('image')){
        throw new CustomError.BadRequestError('Please Upload image')
    }

    const maxSize = 1024 * 1024;
    if (productImage.size > maxSize) {
        throw new CustomError.BadRequestError('Please upload image smaller than 1MB')
    };
    const imagePath = path.join(__dirname,'../public/uploads/'+`${productImage.name}`)

    await productImage.mv(imagePath)
    res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}`})
}

var channel, connection;
async function connect () {
    const amqpServer = "amqps://eocyfcod:10di7yuGkhLvkQ3FCzc9h6WkkT9OmeDd@rattlesnake.rmq.cloudamqp.com/eocyfcod"
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}

const createOrder = async (cartItems, tax, shippingFee) => { 
    try{
    let orderItems = [];
    let subtotal = 0;
    for (const item of cartItems) {
        const dbProduct = await Product.findOne({_id:item.product})
        
        if(!dbProduct){
                
            console.log(`No product with id : ${item.product}`);
            const productId = item.product
            return productId
        }
        
        const {name, price ,image, _id} = dbProduct;
         const singleOrderItem = {
           amount:item.amount,
           name,
           price,
           image,
           product:_id,
       }
       // add item to order
       orderItems = [...orderItems,singleOrderItem]
       
       // calculate subtotal
       subtotal += item.amount * price
    }
 
    const total = tax + shippingFee + subtotal
    
    return  {total, subtotal, orderItems}
}
catch(err){
    console.log(err);
    throw err
}
}



connect().then(() => {
    channel.consume("ORDER", (data) => {
        // console.log(JSON.parse(data.content));
        const{ cartItems, tax, shippingFee} = JSON.parse(data.content);
        createOrder(cartItems, tax, shippingFee)
        .then(val => {
                // if (val.product === null) {
                //     const productId = val.productId
                //     return  channel.sendToQueue(
                //         "PRODUCT",
                //         Buffer.from(
                //             JSON.stringify({
                //                productId
                //             })
                //         )
                //     )}
                const total = val.total ;
                const subtotal = val.subtotal;
                const orderItems = val.orderItems;
                channel.sendToQueue(
                    "PRODUCT",
                    Buffer.from(
                        JSON.stringify({
                            total,
                            subtotal,
                            orderItems,
                           
                        })
                    )
                )}
           
        )
        .catch(err => console.log(err))
        .finally(() => console.log('sent to product queue'));
        
        channel.ack(data);
        
    });

});

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage
}