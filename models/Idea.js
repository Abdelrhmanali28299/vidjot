const mongoose = require('mongoose')
const Schema = mongoose.Schema

let idea = new Schema({
    title: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const modelClass = mongoose.model('ideas', idea)

module.exports = modelClass;