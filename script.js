const pup = require('puppeteer');
const number = 'Your-Number';

//Resturant Name
let restaurant = process.argv[2];

//Array of Order
let order = [];
order = process.argv.slice(3);

//Replacing "_" with spaces in the names
restaurant = restaurant.replace('_',' ');
let order2 = [];
order.map((i,idx)=>{
    let temp =  i.replace('_',' ');
    order2.push(temp);
});

//For input while script runs
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

//Main function start
async function main(){
    let browser = await pup.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"]
    });
    let pages = await browser.pages();
    tab = pages[0];

    //Homepage
    await tab.goto("https://www.zomato.com/");

    //Login
    await tab.waitForSelector(".sc-3o0n99-5.hWdTmm",{visible: true});
    let a = await tab.$$(".sc-3o0n99-5.hWdTmm");
    await a[0].click();

    //Enter Number
    await tab.waitForSelector(".sc-60vv3c-0.fyGVHZ",{visible: true});
    await tab.type(".sc-60vv3c-0.fyGVHZ",number);
    let button = await tab.$$(".sc-1kx5g6g-1.elxuhW");
    await button[1].click();
    await new Promise((resolve,reject)=>{ //Waiting for OTP.
        console.log('Waiting for OTP')
        setTimeout(resolve,20000);
    })
    console.log("OTP Done.")

    //Select Home Address
    await tab.click(".rbbb40-0.fQZfgq");
    await tab.waitForSelector(".sc-hCaUpS.sc-koErNt.fweBtR",{visible: true});
    await tab.click(".sc-hCaUpS.sc-koErNt.fweBtR");
    // await tab.type(".sc-jtggT.jfmXPt",restaurant);
    // await tab.waitForSelector(".sc-cJOK",{visible: true});
    // let options = await tab.$$(".sc-cJOK div");
    // await options[0].click();
    // await tab.waitForNavigation({waitUntil: "networkidle2"});
    // await tab.goto('https://www.zomato.com/ncr/delivery-in-shahdara');
    // let divs = await tab.$$(".sc-18n4g8v-0.gAhmYY");
    // divs[1].click();
    //let input = await tab.$("input[placeholder='Search for restaurant, cuisine or a dish']");

    //Enter Resturant Name
    await tab.type("input[placeholder='Search for restaurant, cuisine or a dish']",restaurant);
    let divs = await tab.$$(".sc-18n4g8v-0.gAhmYY");
    divs[1].click();

    //Wait for list to load and click first
    await tab.waitForSelector(".sc-ejGVNB.fcSSwx",{visible: true});
    divs = await tab.$$(".sc-ejGVNB.fcSSwx");
    divs[0].click();
    await tab.waitForNavigation({waitUntil: "networkidle2"});

    //Go to order online tab
    let url = tab.url();
    await tab.goto(url+'/order');

    //Extract whole menu's heading
    let h4s = await tab.$$("h4");
    let h4 = [];
    for(let i=0;i<h4s.length;i++){
        let temp = await tab.evaluate(function(ele){
            return ele.innerText;
        },h4s[i]);

        //Comparing with Given Order
        for(let o=0;o<order2.length;o++){
            if(temp!=null && temp.localeCompare(order2[o])==0){

                //Order Found
                let parent = (await h4s[i].$x('..'))[0];
                parent = (await parent.$x('..'))[0];
                let parentdivs = await parent.$$("div");

                //Add Button
                parentdivs[parentdivs.length-1].click();

                //Destroying current order from list for preventing selecting more than once.
                order2[o]=order2[o]+'-';

                //Add button from modal
                await tab.waitForSelector(".re4bd0-11.oRYSe",{visible: true});
                let section = await tab.$$(".re4bd0-11.oRYSe"); 
                let maindiv = await section[0].$$("div");
                let allbuttons = [];
                for(let j of maindiv){
                    let temp = await j.$$("button");
                    if(temp!=null){
                        for(let k of temp){
                            allbuttons.push(k);
                        }
                    }
                }
                allbuttons[allbuttons.length-1].click();              
            }
        }
        h4.push(temp);
    }

    //All orders added to cart

    //Continue Button
    let finalspans = await tab.$$("span[tabindex='-1'] span");
    
    for(let i of finalspans){
        let temp = await tab.evaluate((ele)=>{
            if(ele != null){
                return ele.innerText;
            }
        },i);
        if(temp.localeCompare('Continue')==0){
            i.click();
            //console.log('true');
            break;
        }
    }
    await tab.waitForNavigation({waitUntil: "networkidle2"});

    //Final Page
    let amount=0;

    //Extract Amount
    let p = await tab.$$("p");
    for(let i of p){
        let temp = await tab.evaluate((ele)=>{
            return ele.innerText;
        },i);
        if(temp.localeCompare("Grand Total")==0){
            let pkaparent = (await i.$x('..'))[0];
            let nextdiv = await pkaparent.$$("div");
            let nextspan = await nextdiv[0].$$("span");
            amount = await tab.evaluate((ele)=>{
                return ele.innerText;
            },nextspan[0]);
            break;
        }
    }
    
    //Place order button
    let placeOrder = await tab.$$(".rbbb40-1.MxLSp.sc-1kx5g6g-0.gyojlT");


    //Saving Screenshot of order
    await tab.screenshot({path: 'orders/order.png'});


    console.log('Amout = '+amount);
    console.log('Check the order in order history & please confirm');


    //Final Confirmation By User.
    readline.question('Want to confirm the order(Y/N)', option => {
    if(option=='y' ||option=='Y'){
        console.log('Thank You!, Order Placed');
        //placeOrder.click();  //This button will place the order.
    }else{
        console.log('Ok...Will meet Again');
    }

    readline.close();

    tab.close();
    
    });
}


main();