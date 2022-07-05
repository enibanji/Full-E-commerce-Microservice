
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
// const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema ({
    name:{
        type: String,
        required: [true,'Please provide name'],
        minlength: 3,
        maxlength: 50,
    },
    email:{
        type: String,
        required: [true,'Please provide email'],
        validate:{
            validator: validator.isEmail,
            message:'Please provide valid email'
        },
        unique: true,
    },
    password:{
        type: String,
        required: [true,'Please provide Password'],
        minlength: 6,
    },
    role:{
        type: String,
        enum: ['admin','user'],
        default: 'user'
    },
})

userSchema.pre('save', async function () {
    // console.log(this.modifiedPaths());
    // console.log(this.isModified('name'));
    if(!this.isModified('password')) return
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
})

// userSchema.methods.createJWT = function() {
//     const tokenUser = {username:this.name,userId:this._id,role:this.role}
//     const token = jwt.sign({tokenUser},process.env.JWT_SECRET,{expiresIn:process.env.JWT_LIFETIME})
//     return token
// }

userSchema.methods.comparePassword = async function (canditatePassword) {
    const isMatch = await bcrypt.compare(canditatePassword, this.password)
    return isMatch
}

module.exports = mongoose.model('User', userSchema)