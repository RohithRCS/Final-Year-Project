const mongoose = require('mongoose');
const { Schema, model } = mongoose;  

const chatSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    Firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
    },
    PhoneNumber:{
        type: Number,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    Height: {
        type: Number,
        required: true,
    },
    weight: {
        type: Number,
        required: true,
    },
    DOB: {
        type: Date,
        required: true,
    },
    favoriteSongs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song'
    }],
    favoriteGames: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    }],
    favouriteMeditation:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meditation'
    }],
    favouriteExercise:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
    }],
    chats: [chatSchema],
    preferences: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Preference'
    },
});


userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
      delete returnedObject.passwordHash
    }
});
  
const User = model('User', userSchema, 'users');

module.exports = User;