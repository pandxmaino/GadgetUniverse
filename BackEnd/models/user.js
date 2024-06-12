const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [40, 'Your name cannot exceed 40 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minLength: [6, 'Your password must be at least 6 characters long'],
        select: false // Hide password from user
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
},
    {
        timestamps: true
    })

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
})

// Return JWT token 
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_TOKEN, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

// Compare user password 
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {

    // Generate token 
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set token expire time
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken;
}

module.exports = mongoose.model('User', userSchema);