import {Kafka} from "kafkajs";
import express from "express";


const app = express();
const port = 3001
const HOST = '0.0.0.0';
app.use(express.json())

const kafka = new Kafka({
  clientId: 'GreatLibraryServer',
  brokers: ['kafka:29092']
});

const producer = kafka.producer();

async function startProducer(){
    await producer.connect();
    console.log("connected server to kafka!!")
}



const consumer = kafka.consumer({groupId : "library-group"})

async function startConsumer(){
    await consumer.connect();
    await consumer.subscribe({topic:"great-lib-messages",fromBeginning:true});


    console.log("serverb actively listenning");
    await consumer.run({
        eachMessage : async({topic,partition,message}) =>{
            console.log("=====================")
            console.log(`recieved this: ${message.value.toString()}`)


            /*
            message can be either initate or an action.

            1. Initiate.
              - pick an effector.
              - then say what was happenning with you with the characters you have.
              - then which decided to go to the effector place.
            
            2. React.
             - you will get the new characters within you or not.
             - so update your state.
             - make sure the next effector you choose isnt yourself!
             - send the message to them.


             ASSUME:

            messsage.value = {
              type:<Initiate,React>,
              incomingCharacters:[],
              reactionByEffecctor
            }  
            */
            
        }
    })
}



app.get("/test",async(req,res)=>{
    res.send("hi from great lib")
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