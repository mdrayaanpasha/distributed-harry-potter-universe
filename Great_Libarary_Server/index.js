import {Kafka} from "kafkajs";
import express from "express";


const app = express();
const port = 3001
app.use(express.json())

const kafka = new Kafka({
    clientId:"serverB",
    brokers:["localhost:9092"]
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


startConsumer();

app.listen(port,()=>{
console.log(`running on http://localhost:${port}`)
})