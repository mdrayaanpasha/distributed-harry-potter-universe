import {Kafka} from "kafkajs";
import express from "express";


const app = express();
const HOST = '0.0.0.0';
const port = 3003
app.use(express.json())

const kafka = new Kafka({
  clientId: 'HagridsHutServer',
  brokers: ['kafka:29092']
});


const producer = kafka.producer()

async function startProducer(){
    await producer.connect();
    console.log("--PRODUCER INITIATED--")
}

const consumer = kafka.consumer({groupId : "hagrids-group"})

async function startConsumer(){
    await consumer.connect();
    await consumer.subscribe({topic:"hagrids-messages",fromBeginning:true});

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