const mongoose = require('mongoose');


const productSchema = new mongoose.Schema ({

    name:{
        type: String,
        trim: true,
        required: [true, 'Please provide name' ],
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    price:{
        type: Number,
        required: [true, 'Please provide product price' ],
        default: 0,
    },
    description:{
        type: String,
        required: [true, 'Please provide product description'],
        maxlength: [1000, 'Name cannot be more than 1000 characters']
    },
    image:{
        type: String,
        default: '/uploads/example.jpeg'
    },
    category:{
        type: String,
        required: [true, 'Please provide product category'],
        enum: ['office', 'kitchen', 'bedroom'],
    },
    company:{
        type: String,
        required: [true, 'Please provide product company'],
        enum:{
            values: ['ikea', 'liddy', 'marcos'],
            message: '{VALUE} is not supported',
        } 
    },
    colors:{
        type: [String],
        default:['#222'],
        required: true,
    },
    featured:{
        type: Boolean,
        default: false,
    },
    freeShipping:{
        type: Boolean,
        default: false,
    },
    inventory:{
        type: Number,
        required: true,
        default: 15,
    },
    averageRating:{
        type: Number,
        default: 0,
    },
    numOfReviews:{
        type: Number,
        default: 0,
    },
    user: {
        type: String,
        required: true,
    }


}, {timestamps: true, toJSON:{virtuals:true}, toObject:{virtuals:true}})

//virtuals does not affect the remove hook
productSchema.virtual('reviews',{
    ref:'Review',
    localField:'_id',
    foreignField: 'product',
    justOne: false,
    match : {rating : 5}
})

productSchema.pre('remove', async function () {
    await this.model('Review').deleteMany({product: this._id})
})

module.exports = mongoose.model('product', productSchema)