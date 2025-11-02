import express from "express";
import { Kafka } from "kafkajs";

const app = express();
const port = 3002;
const HOST = '0.0.0.0';
app.use(express.json())

// Kafka configuration
const kafka = new Kafka({
  clientId: 'GryffindorTowerServer',
  brokers: ['kafka:29092']
});


const producer = kafka.producer();

async function startProducer(){
    await producer.connect();
    console.log("connected server 1 to kafka!!")
}


async function startConsumer(){
    const consumer = kafka.consumer({groupId:"gryffindor-group"});
    await consumer.connect();
    await consumer.subscribe({topic:"gryffindor-messages",fromBeginning:true});
}


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

app.get("/test",async(req,res)=>{
    res.send("hi from gryf tower")
})

app.listen(port, HOST, async () => {
  console.log(`🚀 Server running at http://localhost:${port}`);

  try {
    await startProducer();
    await startConsumer();
    console.log("✅ Kafka producer & consumer ready");
  } catch (err) {
    console.error("❌ Error starting Kafka:", err);
  }
});