const User = require ('../models/User')
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const {createTokenUser,attachCookieToResponse,checkPermissions} = require('../utils')

const getAllUsers = async (req,res) => {
    const users = await User.find({role:'user'}).select('-password');
    res.status(StatusCodes.OK).json({users, total: users.length})
}

const getSingleUser = async (req,res) => {
    
    // alternative code to getSingleUSer
    // const {id} = req.params
    // const user = await User.findById(id).select('-password');

    const user = await User.findOne({_id:req.params.id}).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`No user with id ${req.params.id}`)
    }
    checkPermissions(req.user, user._id)    
    res.status(StatusCodes.OK).json({ user })
}

const updateUser = async (req,res) => {
    const {name,email} = req.body
    if (!name || !email) {
        throw new CustomError.BadRequestError('Please provide name and email')
    }
    const user = await User.findOne({_id:req.user.userId});
    
    user.email = email;
    user.name = name;

    await user.save();

    const tokenUser = createTokenUser(user)
    attachCookieToResponse({res,user:tokenUser})
    res.status(StatusCodes.OK).json({user: tokenUser, msg:'update successful'})
}

const showCurrentUser = async (req,res) => {
    res.status(StatusCodes.OK).json({ user: req.user })
}



const updateUserPassword= async (req,res) => {
    const {oldPassword, newPassword} = req.body
    if(!oldPassword || !newPassword) {
        throw new CustomError.BadRequestError('Please provide old and new password')
    }
    const user = await User.findOne({_id:req.user.userId})
    const checkPassword = await user.comparePassword(oldPassword)
    if (!checkPassword) {
        throw new CustomError.UnauthenticatedError('Password is wrong')
    }
    user.password = newPassword
    await user.save()
    res.status(StatusCodes.OK).json({msg: 'password change successful'})
    
}

module.exports = {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
}

// //update use with findOneandUpdate
// const updateUser = async (req,res) => {
//     const {name,email} = req.body
//     if (!name || !email) {
//         throw new CustomError.BadRequestError('Please provide name and email')
//     }
//     const user = await User.findOneAndUpdate({_id:req.user.userId},{email,name},{new:true, runValidators: true})
//     const tokenUser = createTokenUser(user)
//     attachCookieToResponse({res,user:tokenUser})
//     res.status(StatusCodes.OK).json({user: tokenUser, msg:'update successful'})
// }