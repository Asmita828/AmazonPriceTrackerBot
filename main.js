const Telegraph = require('telegraf');
const bot = new Telegraph('5661441497:AAGgnAe6_LvpY0CnFOpUats-Z6BEOPFt8jU');
const lib = require("./index");

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/amazonTracker',{ useNewUrlParser:true, useUnifiedTopology: true})
    .then(()=>{
        console.log("CONNECTION OPEN!!")
    })
    .catch(err=>{
        console.log("OH NO ERROR!!!!")
        console.log(err);
    })

const requestSchema= new mongoose.Schema({
    username:String,
    urls:[String]
})
const Request=mongoose.model('Request',requestSchema);
const isValidUrl = urlString => {
    var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
    return !!urlPattern.test(urlString);
}

const startMess ="Hello! I am like your personal Amazon price tracker assistant.I will help you save money in your shopping!!You can send me link of Any Product available on Amazon and I will Track it's Price for you. I will make sure to send you an alert when the Price of that product drops!!"
bot.start((ctx) => {
    ctx.reply(startMess);
    //user = ctx.from.id;
});

const USERS=[]
const PRODUCTS = [];

bot.use((ctx) => {
    const user = ctx.from.id;
    if (ctx.updateSubTypes[0]=== "text")
    {
        ctx.reply("This is a text");
        const input=ctx.message.text;
        const inputArray=input.split(" ");
        inputArray.forEach(input => 
        {
            if(isValidUrl(input))
            {
                //console.log("*");
                //console.log(ctx.from.id)

                Request.find({ username: user, urls: { "$in": [input] } }, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else
                    {
                        if(data)
                        {
                            ctx.reply("I am already tracking this product");
                            console.log(data);
                        }
                        else
                        {
                            Request.exists({ username: user }, function (err, doc) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    if (doc) {
                                        Request.updateOne(
                                            { username: user },
                                            { "$push": { "urls": input } },
                                            function (err, result) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    console.log(result);
                                                }
                                            }
                                        )
                                    }
                                    else {
                                        const dbEntry = new Request({
                                            username: user,
                                            urls: [input]
                                        })
                                        dbEntry.save()
                                            .then((dbEntry) =>
                                                console.log(dbEntry)
                                            )
                                            .catch((err) => {
                                                console.log(err);
                                                console.log("can't save info")
                                            })
                                    }
                                }
                            })
                        }
                    }

                });
            }
            else
            {
                ctx.reply("Sorry! I don't understand");
            }
        });
        //console.log();  
    }
    else
    {
        ctx.reply("Sorry! I don't understand");
    }
})

bot.launch()
    .then(()=>{
        Request.find({}, function (err, users) {
            //console.log(users);
            users.forEach(function (user) {
               const urls=user.urls;
               urls.forEach(url=>{
                if(PRODUCTS.includes(url)==false)
                {
                    PRODUCTS.push(url);
                }
               })
            });
            
        })
        // PRODUCTS.forEach(product=>{
        //     lib.FetchPrice(product);
        // })
        // setTimeout(Track, 300);
    })
    .catch((err)=>{
        console.log("OOPS!!");
    })

