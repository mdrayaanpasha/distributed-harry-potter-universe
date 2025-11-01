import {Kafka} from "kafkajs";
import express from "express";


const app = express();
const HOST = '0.0.0.0';
const port = 3003
app.use(express.json())

const kafka = new Kafka({
    clientId: "serverB",
    brokers: ["kafka:9092"] // <-- Use the service name 'kafka'
})

const consumer = kafka.consumer({groupId : "hogwarts-group"})

async function startConsumer(){
    await consumer.connect();
    await consumer.subscribe({topic:"magic-messages",fromBeginning:true});

    console.log("serverb actively listenning");
    await consumer.run({
        eachMessage : async({topic,partition,message}) =>{
            console.log("=====================")
            console.log(`recieved this: ${message.value.toString()}`)
        }
    })
}


app.get("/test",async(req,res)=>{
    res.send("hi from hag hut")
})


startConsumer();

app.listen(port,HOST,()=>{
console.log(`running on http://localhost:${port}`)
})