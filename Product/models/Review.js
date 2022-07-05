const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min:1,
        max:5,
        required: [true, 'Please provie rating']
    },
    title: {
        type: String,
        trim: true,
        required: [true, 'Please provie title'],
        maxlength: 100,
    },
    comment: {
        type: String,
        required: [true, 'Please provie review text']
    },
    user: {
        type: String,
        required: true,
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
        required: true,
    }
}, {timestamps: true})

ReviewSchema.index({ product: 1, user: 1}, {unique: true});

ReviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
        {
            $match: {
              product: productId
            }
          }, {
            $group: {
              '_id': null, //or $product (the id being used to group), null is used because the match already creates the list needed in this case , 
              averageRating: {
                $avg: '$rating'
              }, 
              numOfReviews: {
                $sum: 1
              }
            }
          }
    ]);
 console.log(result);   
try {
    await this.model('product').findOneAndUpdate(
        {_id:productId},
        {
            averageRating: Math.ceil(result[0]?.averageRating || 0),
            numOfReviews: result[0]?.numOfReviews || 0,
        });
} catch (error) {
    console.log(error);
}
}


ReviewSchema.post('save', async function (){
    await this.constructor.calculateAverageRating(this.product)
});

ReviewSchema.post('remove', async function (){
    await this.constructor.calculateAverageRating(this.product)
})

module.exports = mongoose.model('Review', ReviewSchema)