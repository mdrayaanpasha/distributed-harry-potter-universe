import { Kafka } from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js";

const prisma = new PrismaClient();
const app = express();
const port = 3001;
const HOST = "0.0.0.0";

app.use(express.json());

const kafka = new Kafka({
  clientId: "GreatLibraryServer",
  brokers: ["kafka:29092"],
});

const effectors = [
  "gryffindor-messages",
  "hagrids-messages",
  "muggle-messages",
  "platform-messages",
  "herbology-messages",
  "quidditch-messages"
];


const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "library-group" });

async function startProducer() {
  await producer.connect();
  console.log("✅ Connected server to Kafka");
}

async function InitiateProcess() {
  const myCharactersRecord = await prisma.state.findFirst({
    where: { place: "greatLibrary" },
    select: { Character: true },
  });

  const myCharacters = myCharactersRecord?.Character || [];


  const topics = [
    "hagrids-messages",
    "herbology-messages",
    "muggle-messages",
    "platform-messages",
    "quidditch-messages",
  ];

  const effector = topics[Math.floor(Math.random() * topics.length)];
  // const effector = "herbology-messages";


  const AiResponse = await AIService({ Character: myCharacters }, effector);

  const updatedCharacters = myCharacters.filter(
    (c) => !AiResponse.chars.includes(c)
  );

  await prisma.state.updateMany({
    where: { place: "greatLibrary" },
    data: { Character: { set: updatedCharacters } },
  });

  return { AiResponse, effector };
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "great-lib-messages", fromBeginning: true });

  console.log("✅ Server actively listening");
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const messageValue = message.value?.toString();
      if (!messageValue) return console.log("Received null/empty message, skipping.");

      const data = JSON.parse(messageValue);

      try {
        if (data.type === "Initiate") {
          const AiResponse = await InitiateProcess();
          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Great Library",
            ActionEntailed: AiResponse.summ,
          };

           let effector = effectors[Math.floor(Math.random() * effectors.length)]


          await producer.send({
            topic: effector,
            messages: [{ value: JSON.stringify(MessageBody) }],
          });



        } else if (data.type === "React") {
          const incomingCharacters = data.incomingCharacters || [];

           console.log("🕊️ From:", data.reactionByEffector);
          console.log("👥 Character Came:", data.incomingCharacters || "None");
          console.log("📖 Scene:", data.ActionEntailed);
          console.log("═".repeat(60) + "\n");

          const myCharactersRecord = await prisma.state.findFirst({
            where: { place: "greatLibrary" },
            select: { Character: true },
          });
          const myCharacters = myCharactersRecord?.Character || [];

          const mergedCharacters = Array.from(new Set([...myCharacters, ...incomingCharacters]));

          await prisma.state.updateMany({
            where: { place: "greatLibrary" },
            data: { Character: { set: mergedCharacters } },
          });

            const {AiResponse,effector} = await InitiateProcess();


          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Great Library",
            ActionEntailed: AiResponse.summ,
          };

          console.log("🕊️ Sent To:", effector);
          console.log("📦 Constructed Message Body");
          console.log("👥 Transffered Characters:", MessageBody.incomingCharacters.join(", ") || "None");
          console.log("📖 Scene:", MessageBody.ActionEntailed);
          console.log("═".repeat(60) + "\n");

          await producer.send({
            topic: effector,
            messages: [{ value: JSON.stringify(MessageBody) }],
          });
        
        }
      } catch (err) {
        console.error("❌ Error processing message:", err);
      }
    },
  });
}

app.get("/test", async (req, res) => {
  res.send("hi from great lib");
});

app.listen(port, HOST, async () => {
  console.log(`🚀 Server running at http://${HOST}:${port}`);
  try {
    await startProducer();
    await startConsumer();
    console.log("✅ Kafka producer & consumer ready");
  } catch (err) {
    console.error("❌ Error starting Kafka:", err);
  }
});
