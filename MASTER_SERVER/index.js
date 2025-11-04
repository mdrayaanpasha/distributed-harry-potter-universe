import { Kafka } from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = 3008;
const HOST = "0.0.0.0";

const kafka = new Kafka({
  clientId: "MasterServer",
  brokers: ["kafka:29092"],
});

const producer = kafka.producer();
const prisma = new PrismaClient();

async function startProducer() {
  await producer.connect();
  console.log("-- PRODUCER INITIATED --");
}

app.use(express.json());

app.get("/test", async (req, res) => {
  res.json({ message: "yello there you piece of code!!" });
});


const topicsMap = {
    greatLibrary: {
        name:"library-group",
        characters:[]
    } ,
    gryffindorTower: {
        name:"gryffindor-messages",
        characters:[],
    },
    hagridsHut: {
        name:"hagrids-group",
        characters:[],
    },
    herbologyGreenHouse: {
        name:"herbology-group",
        characters:[],
    },
    muggleWorld: {
        name:"muggle-group",
        characters:[],
    },
    platform9Quarters: {
        name:"platform-group",
        characters:[],
    },
    quidditchPitch: {
        name:"quidditch-group",
        characters:[],
    }
}

const characters = ["Harry","Ron","Hermione","Draco","Hagrid","Dumbledore","Snape","McGonagall","Luna","Neville","Fred","George","Ginny","Voldemort","Sirius","Remus","Alastor","Dobby","Cedric","Cho","Severus","Bellatrix","Lucius","Narcissa","Tonks","Kingsley","Cornelius","Fleur","Bill","Charlie","Percy","Oliver","Lee","Dean","Parvati","Lavender","Padma","Marcus","Gregory","Vincent","Dennis","Zacharias"];

const keys = Object.keys(topicsMap);


app.get("/initate",async(req,res)=>{

    // randomly assiging characters to places/topics.
    for(let key in topicsMap){
        const topicInfo = topicsMap[key];
        //pick and delete 6 characters randomly from characters array
        for(let i=0;i<6;i++){
            const randomIndex = Math.floor(Math.random() * characters.length);
            const character = characters.splice(randomIndex, 1)[0];
            topicInfo.characters.push(character);
        }
    }

    console.log("==RANDOMLY ASSIGNED CHARACTERS==")

 
  //delete existing data from the DB.    
  await prisma.state.deleteMany({});
  await prisma.logs.deleteMany({});

  console.log("==DELETED DATA IF EXISTS==")

//     // model State{
//   id        Int      @id @default(autoincrement())
//   place String
//   Character String[]
// }

    //create data on randomly assinged data and insert it in DB.
    for(let key in topicsMap){
        const topicInfo = topicsMap[key];
        await prisma.state.create({
            data:{
                place: key,
                Character: topicInfo.characters
            }
        })
    }

    console.log("==INSERTED DATA IN DB==");

    const topics = ["library-group","gryffindor-messages","hagrids-group","herbology-group","muggle-group","platform-group","quidditch-group"]


   /*

    SEND THIS TO THE EFFECTOR QUEUE:
       messsage.value = {
              type:<Initiate,React>,
              incomingCharacters:[],
              reactionByEffector
            }  
   */    
  const Data = {
    type:"Initiate",
    IncomingCharacters:[],
    reactionByEffector:""
  }

  //pick random effector.
  const effectorIdx = Math.floor(Math.random() * topics.length);
  const effector = "great-lib-messages";

  try {
    const D = await producer.send({
      topic:effector,
      messages:[{value:JSON.stringify(Data)}]
    })
    console.log("==SUCCESSFUL SENT DATA TO SERVER DETAILS: == ",D);
    res.status(200).json({
      message:"data sent",
      preview:D
    });

  } catch (error) {
    console.log("an error incurred: ",error);
    res.status(500).json({error});

  }




})

app.get("/states",async(req,res)=>{
    const data = await prisma.state.findMany();
    res.json({data});
})

app.delete("/reset",async(req,res)=>{
    const data = await prisma.state.deleteMany({});
    const logData = await prisma.logs.deleteMany({});
    res.json({status:"reset done", data, logData});
});

app.post("/send", async (req, res) => {
  const { message } = req.body;
  try {
    await producer.send({
      topic: "magic-messages",
      messages: [{ value: message }],
    });
    res.json({ status: "sent", message });
  } catch (err) {
    console.error("Error producing message:", err);
    res.status(500).json({ error: "Kafka send failed" });
  }
});

app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  try {
    await startProducer();
    console.log("✅ Kafka producer ready");
  } catch (err) {
    console.error("❌ Error starting Kafka:", err);
  }
});

process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down...");
  await producer.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});
