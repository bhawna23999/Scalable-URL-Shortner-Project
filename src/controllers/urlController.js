const urlModel = require("../model/urlModel");
const shortid = require("shortid")
const redis = require("redis");


const isValid = function(value){
    if(typeof value === 'undefined' || value === null) return false
    if(typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const isValidRequestBody = function(requestBody){
    return Object.keys(requestBody).length > 0
}


const { promisify } = require("util")

//Connect to redis
const redisClient = redis.createClient(
    10982,
    "redis-10982.c246.us-east-1-4.ec2.cloud.redislabs.com",
    { no_ready_check: true}
);
redisClient.auth("dGdtGmV1L3V2lEW8itMmqlPLuVWFr4Et", function (err){
    if (err) throw err;
})

redisClient.on("connect", async function(){
    console.log("Connected to Redis..")
})

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)


const shorten = async function(req,res){

    try
    {
        let requestBody = req.body

        if(!(isValidRequestBody)){
            return res.status(400).send({status:false, message:'Please enter Details'})
        }

        // Extract Param
        const {longUrl} = requestBody 

        if(!isValid(longUrl)){
            return res.status(400).send({status:false, message:'Long-Url is Required'})
        }

        if(!/^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/gm.test(longUrl)){
            return res.status(400).send({status:false, message:'Plese enter valid Url'})
        }

        const findUrl = await urlModel.findOne({longUrl:longUrl})

        if(findUrl){
            return res.status(200).send({status:false, message:"This Url is already Registered"})
        }

        let baseUrl = 'http://localhost:3000'

        if(!/^(ftp|http|https):\/\/[^ "]+$/.test(baseUrl)){
            return res.status(400).send({status:false, message:"Please send valid base url"})
        }

        let urlCode = shortid.generate()

        let shortUrl = baseUrl + "/" + urlCode

        requestBody.urlCode = urlCode

        requestBody.shortUrl = shortUrl
 
        await urlModel.create(requestBody)

        let urlData = await urlModel.findOne({urlCode:urlCode}).select("longUrl shortUrl urlCode")
        res.status(201).send({status:true, data:urlData})

    }
    catch(err)
    {
        console.log(err.message)
        res.status(500).send({status:false, Error:err.message})
    }

    
}
    

const getUrlCode = async function(req,res){

    try
    {
        let urlCode = req.params.urlCode

        let cachedUrlData = await GET_ASYNC(`${urlCode}`)
    
        if(cachedUrlData){
            return res.status(302).redirect(JSON.parse(cachedUrlData))
        }
    
        let findUrl = await urlModel.findOne({urlCode:urlCode}) 
    
        if(!findUrl){
            return res.status(404).send({status:false, message:`This ${req.params.urlCode} Url Code is not found.`})
        }
    
        await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl.longUrl))
        res.status(200).redirect( findUrl.longUrl)

    }
    catch(err)
    {
        console.log(err.message)
        res.status(500).send({status:false, Error:err.message})

    } 
}





module.exports = {shorten, getUrlCode}