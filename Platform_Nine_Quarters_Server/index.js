import {Kafka} from "kafkajs";
import express from "express";


const app = express();
const port = 3007
app.use(express.json())

const kafka = new Kafka({
    clientId: "PlatformNineQuartersServer",
  brokers: ['kafka:29092']
})


const consumer = kafka.consumer({groupId : "platform-group"})

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
const HOST = '0.0.0.0';
const producer = kafka.producer();

async function startProducer(){
    await producer.connect();
    console.log("--PRODUCER INITIATED--")
}

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