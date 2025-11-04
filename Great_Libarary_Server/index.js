import {Kafka} from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js";
const prisma = new PrismaClient();


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




async function InitiateProcess(){
  /*
  const Data = {
    type:"Initiate",
    IncomingCharacters:[],
    reactionByEffector:""
  }
  */

  /*
  STEP 1: 
  1. get all my characters from database.
  2. pick an effector, to whom im gonna send my next message!!!
  3.  send them to llm to get a response on whats happening to them here
      and who decided to go to my effector.
  4. delete characters from my place who wanted to go.
  5. add logs in DB.

  DB SCHEMA:

  model State {
    id        Int      @id @default(autoincrement())
    place     String
    Character String[]
  }
  
  model logs {
    id        Int      @id @default(autoincrement())
    timestamp DateTime @default(now())
    log       String
  }



  */

  //STEP 1: getting all my characters from DB.

const myCharacters = await prisma.state.findFirst({
  where: { place: "greatLibrary" },
  select: { Character: true },
});

console.log("CHARACTERS IN MY DB: ",myCharacters);

const topics = ["hagrids-messages","herbology-messages","muggle-messages","platform-messages","quidditch-messages"];

const effectorIdx = Math.floor(Math.random() * topics.length);
const effector = topics[effectorIdx];

console.log("MY EFFECTOR",effector);

const AiResponse = await AIService(myCharacters,effector);

/*

AiResponse looks like this:
 {
    chars:parsed.characters,
    summ:parsed.summary
  }
*/

const updatedCharacters = myCharacters.Character.filter(
  c => !AiResponse.chars.includes(c)
);

await prisma.state.updateMany({
  where: { place: "greatLibrary" },
  data: { Character: { set: updatedCharacters } },
});


return {AiResponse,effector}


}
async function startConsumer(){
    await consumer.connect();
    await consumer.subscribe({topic:"great-lib-messages",fromBeginning:true});


    console.log("serverb actively listenning");
    await consumer.run({
        eachMessage : async({topic,partition,message}) =>{
            console.log("=====================")
            const messageValue = message.value ? message.value.toString() : null;

            if (messageValue) {
                console.log(`recieved this: ${messageValue}`);
                const data = JSON.parse(messageValue);
                console.log("JSON VERSION OF DATA: ", data);
                

                //send message to the queue if it wasnt initiate type.
                if(data.type==="Initiate"){
                 const {AiResponse,effector} = await InitiateProcess();
                 const MessageBody = {
                  type:"React",
                  incomingCharacters:AiResponse.chars,
                  reactionByEffector:"Great Library",
                  ActionEntailed:AiResponse.summ
                 }
                 try{
              await producer.send({
  topic: effector,
  messages: [
    { value: JSON.stringify(MessageBody) }
  ]
});

                 console.log("===MESSAGE SENT====",d)
                 }catch(error){
                  console.log(error);
                 }

                }
            } else {
                console.log("Received null or empty message value, skipping processing.");
            }


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
              reactionByEffector
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