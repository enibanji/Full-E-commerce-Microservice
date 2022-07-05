const User = require('../models/User')
const {StatusCodes} = require('http-status-codes')
const {CustomAPIError,
    UnauthenticatedError,
    NotFoundError,
    BadRequestError,} = require('../errors')
const {createTokenUser,attachCookieToResponse} = require('../utils')


const register = async(req,res) => {
    const {email,name,password} = req.body
    const emailAlreadyExist = await User.findOne({email})
    if (emailAlreadyExist) {
        throw new BadRequestError('Email already in use')
    }
    //first registered user is admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin': 'user';
   
    const user = await User.create({name,email,password,role})
    const tokenUser = createTokenUser(user)
    // const token = createJWT({payload:tokenUser})
    // const token = user.createJWT()
   
    // set up cookie
    // const oneDay = 1000*60*60*24 //one day set up
    // res.cookie('token',token,{
    //     httpOnly:true,
    //     expires: new Date(Date.now() + oneDay) 
    // })
    attachCookieToResponse({res,user:tokenUser})

    res.status(StatusCodes.CREATED).json({user:tokenUser})
}

const login = async(req,res) => {
    const {email,password} = req.body;
    if (!email || !password) {
        throw new BadRequestError('Please provide email and password')
    }
    const user = await User.findOne({email})
    if (!user) {
        throw new UnauthenticatedError('Invalid credentials')
    }
    const checkPassword = await user.comparePassword(password)
    if (!checkPassword) {
        throw new UnauthenticatedError('Invalid credentials')
    }
    const tokenUser = createTokenUser(user)
    attachCookieToResponse({res,user:tokenUser})
    res.status(StatusCodes.OK).json({user:tokenUser})
}

const logout = async(req,res) => {
   res.cookie('token','logout',{
       httpOnly:true,
       expires: new Date(Date.now()),
   });
   
    res.status(StatusCodes.OK).json({msg : 'user logged out'})
}

module.exports = {register,login,logout}