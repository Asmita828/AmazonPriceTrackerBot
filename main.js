const Telegraph = require('telegraf');
// Telegraph.Markup
const bot = new Telegraph('5661441497:AAGgnAe6_LvpY0CnFOpUats-Z6BEOPFt8jU', { polling: true });
const lib = require("./index");

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/amazonTracker', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("CONNECTION OPEN!!")
    })
    .catch(err => {
        console.log("OH NO ERROR!!!!")
        console.log(err);
    })

const requestSchema = new mongoose.Schema({
    username: String,
    products: [
        {
            url: String,
            price: Number
        }
    ]
})
const Request = mongoose.model('Request', requestSchema);
const isValidUrl = urlString => {
    var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
    return !!urlPattern.test(urlString);
}

const startMess = "Hello! I am like your personal Amazon price tracker assistant.You can send me link of Any Product available on Amazon and I will Track it's Price for you. I will make sure to send you an alert when the Price of that product drops!!"
bot.start((ctx) => {
    ctx.reply(startMess);
});

const PRODUCTS = [];

bot.use(async (ctx)=>{
    const user = ctx.from.id;
    const inputFromUser = ctx.message.text;
    const inputArray = inputFromUser.split(" ");
    var Flag =0;
    console.log(inputArray);
    for(let  index in inputArray){
        const input=inputArray[index];
        if(isValidUrl(input)) {
            const gotPrice = await lib.FetchPrice(input);
            if(gotPrice == -1) {
                //console.log("moti3")
                //ctx.reply("This is not a valid url")
               // return
               continue
            }
            Flag=1;
            console.log(ctx.message);
            ctx.reply("Got a valid URL!")
            
            const userData = await Request.findOne({ username: user })
            if(userData) {
                let flag = 0
                userData.products.forEach(product=>{
                    if(product.url == input) {
                        flag = 1
                    }
                })
                if(flag == 1) {
                    ctx.reply("I am already tracking this product");
                }
                else {
                    await Request.updateOne(
                        { username: user },
                        { "$push": { "products": { url: input, price: gotPrice } } }
                    )
                    PRODUCTS.push({
                        username : user,
                        url : input,
                        price : gotPrice
                    })
                }
            }
            else{
                const dbEntry = new Request({
                    username: user,
                    products: [{ url: input, price: gotPrice }]
                    //urls: [input]
                })
                await dbEntry.save();
                PRODUCTS.push({
                    username: user,
                    url: input,
                    price: gotPrice
                })
            }
        }
    }
    if(Flag === 0) {
        ctx.reply("We haven't got any valid URL")
    }
})

const notify=(price,username)=>{
    console.log("congooooooooooooooooooo");
}

const Track=async ()=>{
    PRODUCTS.map(async (prod) => {
        const newPrice = await lib.FetchPrice(prod.url);
        if(newPrice<prod.price)
        {
            prod.price=newPrice;

            //updating new price in db
            const data = await Request.findOne({ username:prod.username })
            const products=data.products;
            products.forEach(product=>{
                if(product.url==prod.url)
                {
                    product.price=newPrice;
                }
            })
            await data.save();
            notify(newPrice,prod.username);
        }
    });
    setTimeout(Track, 300000);
}

bot.launch()
    .then(async ()=>{
        let users = await Request.find();
        users.forEach((user)=>{
            user.products.forEach((product)=>{
                let obj={};
                obj.username=user.username;
                obj.url=product.url;
                obj.price=product.price;
                PRODUCTS.push(obj);
            })
        })
        Track()
    })
    
   

