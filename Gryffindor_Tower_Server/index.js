import express from "express";
import { Kafka } from "kafkajs";

const app = express();
const port = 3000;
app.use(express.json())

// Kafka configuration
const kafka = new Kafka({
    clientId:"serverA",
    brokers:["localhost:9092"]
})

const producer = kafka.producer();

async function startProducer(){
    await producer.connect();
    console.log("connected server 1 to kafka!!")
}

startProducer();


app.post("/message-to-kafka",async(req,res)=>{
    const { mess } = req.body;

    try {
        await producer.send({
            topic:"magic-messages",
            messages:[{value:mess}]
        })
        console.log("message sent!!")
        res.json({message:"sent"})
    } catch (error) {
        console.log(error);
        res.json({error})
    }
})

app.listen(port,()=>{
    console.log("app running on http://localhost:3000")
})