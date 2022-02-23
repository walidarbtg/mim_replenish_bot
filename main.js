const cron = require("node-cron")
const Slimbot = require("slimbot")
const { ethers } = require("ethers")
const ust_degenbox_abi =require("./ust_degenbox_abi.json")
const mim_replenish_bot_token = "5096807137:AAFZM0DFkBsw7ObYlwfrvDpd8iFdV0bhAt0"
const setup_arg = "!setup"
const help_arg = "!help"
const stop_arg = "!stop"
const channel_id = "-1001683340411"
let chat_id
let minimum_mim_amount
let interval_minute
let job

// Ethereum
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", "mainnet");

const mim_token_address = "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3"
const ust_degenbox_address = "0xd96f48665a1410C0cd669A88898ecA36B9Fc2cce"
const ust_cauldron = "0x59E9082E068Ddb27FC5eF1690F9a9f22B32e573f"

const ust_degenbox_contract = new ethers.Contract(ust_degenbox_address, ust_degenbox_abi, provider)

// Telegram Bot
const slimbot = new Slimbot(mim_replenish_bot_token)

slimbot.on('message', message => {
    chat_id = message.chat.id
    if(message.text.includes(setup_arg))
    {
        args = message.text.slice(setup_arg.length, message.text.length).split(",")
        minimum_mim_amount = args[0]
        interval_minute = args[1]

        job = cron.schedule("*/" + interval_minute.replace(' ', '') + " * * * *", function(){
            get_mim_availabe(minimum_mim_amount)
        })
        job.start()
        slimbot.sendMessage(chat_id, "Ready")
    }
    else if(message.text.includes(help_arg))
    {
        slimbot.sendMessage(chat_id, "!setup minimum_amount, interval_minutes")
    }
    else if(message.text.includes(stop_arg))
    {
        job.stop()
    }
});
slimbot.startPolling()

function get_mim_availabe(minimum_mim_amount) {
    ust_degenbox_contract.balanceOf(mim_token_address, ust_cauldron).then((resolved, rejected) => {
        if(resolved){
            mim_available = ethers.utils.formatEther(resolved)

            if(parseFloat(mim_available) >= parseFloat(minimum_mim_amount))
            {
                message = parseFloat(mim_available).toFixed(2) + " MIM available in UST Degenbox"
                slimbot.sendMessage(channel_id, message)
            }       
        } else {
            console.log("error")
        }
    })
}