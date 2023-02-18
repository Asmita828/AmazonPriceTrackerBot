const axios = require("axios")
const cheerio = require("cheerio")

async function FetchPrice(productUrl){
    console.log("Entered in fetch price");
    return await axios
        .get(productUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
            },
        })
        .then(async ({ data }) => {
            //console.log("**");
            const $ = cheerio.load(data);
            let gotThePrice = $(".a-price-whole").text();
            if(gotThePrice)
            {
                const price = gotThePrice.split(".")[0].match(/\d+/g).join("");
                console.log(price);
                return price;
            }
            else
            {
                return -1;
            }
        });
};

module.exports = {FetchPrice };
