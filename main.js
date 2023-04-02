const Telegraph = require('telegraf');
// Telegraph.Markup
const bot = new Telegraph('5661441497:AAGgnAe6_LvpY0CnFOpUats-Z6BEOPFt8jU', { polling: true });
const lib = require("./index");
const express = require("express");
const app = express();

app.listen(3000, () => {
    console.log('Connection created!!')
});
app.get('/', (req, res) => {
    res.send("GET Request Called")
})

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://asmita:asmita@cluster0.3clvb.mongodb.net/bot?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
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

const startMess = "Hello! I am like your personal Amazon price tracker assistant!&#128512;\n\nYou can send me link of Any Product available on Amazon and I will Track it's Price for you&#10004;\n\n I will make sure to send you an alert when the Price of that product drops&#9996;!!"
bot.start((ctx) => {
    ctx.replyWithHTML(startMess);
});

const PRODUCTS = [];
const regex = new RegExp('untrack_[0-9]*[a-z]*')
bot.hears(regex,async(ctx)=>{
    console.log(ctx.match.input.slice(9,))
    const productId = ctx.match.input.slice(9,);
    const user = ctx.from.id;
    const userData = await Request.findOne({ username: user })
    userData.products=userData.products.filter((product)=>{
        if(product._id!=productId)
        {
            return product
        }
    })
    await userData.save();
    // console.log(updatedData)
    ctx.reply("Successfully untracked the product")

})
bot.command('list',async(ctx)=>{
    let i=1
    const user = ctx.from.id;
    let msg =``;
    const userData = await Request.findOne({ username: user })
    if(userData.products.length==0)
    {
        msg +=`Your list is empty!!\nCurrently, I am not tracking price of any product&#128220\n\nYou can send me link of any product of Amazon.I will make sure to send you an alert when the price of that product drops&#128519;`
    }
    else
    {
        msg += `Here the list I am tracking for you!`
        userData.products.forEach(product => {
            msg += `\n&#128073;${i}. ${product.url}\n To untrack click: /untrack_${product._id}\n\n`
            i++
        })
    }
    bot.telegram.sendMessage(ctx.from.id, msg, {
        parse_mode: "html"
    })
})
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
               continue
            }
            Flag=1;
            console.log(ctx.message);
            const msg = `Got a valid URL!Now Fetching Price\n&#128519;Please wait....` 
            bot.telegram.sendMessage(ctx.from.id, msg, {
                parse_mode: "html"
            })
            //ctx.reply("Got a valid URL!Now Fetching Price\n	&#128519;Please wait....")
            
            const userData = await Request.findOne({ username: user })
            if(userData) {
                let flag = 0
                userData.products.forEach(product=>{
                    if(product.url == input) {
                        flag = 1
                    }
                })
                if(flag == 1) {
                    const x = `&#128526;I am already tracking price of this product \n` + input + `\n<b>Current price :Rs ${gotPrice}</b>\n<i>I will send you alert when the price of this product drops!!&#128521;</i>`
                    bot.telegram.sendMessage(ctx.from.id, x, {
                        parse_mode: "html"
                    })
                    //ctx.reply("I am already tracking this product");
                }
                else {//got a new product for an existing user
                    await Request.updateOne(
                        { username: user },
                        { "$push": { "products": { url: input, price: gotPrice } } }
                    )
                    PRODUCTS.push({
                        username : user,
                        url : input,
                        price : gotPrice
                    })
                    const x = `Yayy! <b>Product found</b>&#128512; \n` + input + `\n<b>Current price :Rs ${gotPrice}</b>\n<i>I have started tracking price of this product.I will send you alert when the price of this product drops!!&#128521;</i>`
                    bot.telegram.sendMessage(ctx.from.id, x, {
                        parse_mode: "html"
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
                const x = `Yayy! <b>Product found</b>&#128512; \n` + input + `\n<b>Current price :Rs ${gotPrice}</b>\n<i>I have started tracking price of this product.I will send you alert when the price of this product drops!!&#128521;</i>`
                bot.telegram.sendMessage(ctx.from.id, x, {
                    parse_mode: "html"
                })
                const y=`To get list of all products that i am tracking for you,Click /list`
                bot.telegram.sendMessage(ctx.from.id, y, {
                    parse_mode: "html"
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
    
   

