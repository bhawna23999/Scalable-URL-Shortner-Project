const mongoose = require('mongoose')


const urlSchema = new mongoose.Schema({

    longUrl : {type:String, required:true, trim:true, lowercase:true},
    shortUrl : {type:String, required:true, unique:true, trim:true, lowercase:true},
    urlCode : { type:String, unique:true, required:true, lowercase:true, trim:true},

},{timestamps:true})


module.exports = mongoose.model("Url", urlSchema)