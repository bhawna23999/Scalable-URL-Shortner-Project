const urlModel = require("../model/urlModel")


const isValid = function(value){
    if(typeof value === 'undefined' || value === null) return false
    if(typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const isValidRequestBody = function(requestBody){
    return Object.keys(requestBody).length > 0
}


const shorten = async function(req,res){

    let requestBody = req.body

    if(!(isValidRequestBody)){
        return res.status(400).send({status:false, message:'Please enter Details'})
    }

    //Extract Params
    const {urlCode, longUrl, shortUrl} = requestBody 

    if(!isValid(urlCode)){
        return res.status(400).send({status:false, message:'Url-Code is Required'})
    }

    if(!isValid(longUrl)){
        return res.status(400).send({status:false, message:'Long-Url is Required'})
    }

    if(!/^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/gm.test(longUrl)){
        return res.status(400).send({status:false, message:'Plese enter valid Url'})
    }

    if(!isValid(shortUrl)){
        return res.status(400).send({status:false, message:'Short-Url id required'})
    }

    let urlCreated = await urlModel.create(requestBody)
    res.status(201).send({status:true, data:urlCreated})

}


const getUrlCode = async function(req,res){

    const paramsId = req.params.urlCode

    if(!isValid(paramsId)){
        return res.status(400).send({status:false, message:"Please enetr valid Url-Code"})
    }

    let findUrl = await urlModel.findOne({urlCode:paramsId})

    if(!findUrl){
        return res.status(404).send({status:false, message:`This ${paramsId} Url Code is not found.`})
    }

    res.status(200).send({status:true, data:findUrl})
}



module.exports = {shorten, getUrlCode}