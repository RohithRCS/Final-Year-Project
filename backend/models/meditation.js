const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const meditationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    emoji: {
        type: String,
        required: true,
    },
    backgroundColor: {
        type: String,
        required: true,
    },
    youtubeId: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.meditationId = ret._id;  // Rename _id to meditationId
            delete ret._id;  // Optionally remove the default _id field from output
        }
    }
});

const Meditation = mongoose.model('Meditation', meditationSchema);

module.exports = Meditation;

