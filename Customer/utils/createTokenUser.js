

const createTokenUser = (user) => {
     return {username: user.name, userId: user._id, role: user.role}
     
}

module.exports = createTokenUser