const axios = require("axios")
const cheerio = require("cheerio")


const Prices = {};

const SomeFunction = (newPrice) => {
    console.log("wew! go buy nowwww.... the new price is", newPrice);
};

const FetchPrice = (productUrl) => {
    //console.log("*");
    axios
        .get(productUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
            },
        })
        .then(({ data }) => {
            //console.log("**");
            const $ = cheerio.load(data);
            let gotThePrice = $(".a-price-whole").text();
            const price=gotThePrice.split(".")[0].match(/\d+/g).join("");
            if (price) 
            {
                if (Prices[productUrl]) {
                    if (Prices[productUrl] > price) {
                        SomeFunction(price);
                    }
                }
                Prices[productUrl] = price;
                console.log(`Fetched price for ${$("#productTitle").text().trim().substr(0, 80)}...: ${price}`)
            }
            
        });
};

module.exports = { SomeFunction,FetchPrice };

// const PRODUCTS = [
//     "https://www.amazon.in/dp/B09MLWRM6Q",
//     "https://www.amazon.in/Canon-1500D-Digital-Camera-S18-55/dp/B07BS4TJ43",
// ];

const Track = () => {
    PRODUCTS.map((prod) => {
        FetchPrice(prod);
    });
    setTimeout(Track, 300);
};

Track();