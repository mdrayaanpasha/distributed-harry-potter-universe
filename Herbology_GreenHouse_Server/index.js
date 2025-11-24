import { Kafka } from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js";

const app = express();
const port = 3004;
const HOST = "0.0.0.0";
app.use(express.json());

const kafka = new Kafka({
  clientId: "HerbologyGreenHouseServer",
  brokers: ["kafka:29092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "herbology-group" });
const prisma = new PrismaClient();

// Other effectors excluding this server
const effectors = [
  "great-lib-messages",
  "gryffindor-messages",
  "hagrids-messages",
  "muggle-messages",
  "platform-messages",
  "quidditch-messages",
];

async function startProducer() {
  await producer.connect();
  console.log("✅ Producer connected to Kafka");
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "herbology-messages", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return console.log("Empty message, skipping");

      const data = JSON.parse(value);
      console.log("Received message:", data);

      try {
        // Fetch current characters from DB
        const state = await prisma.state.findFirst({
          where: { place: "herbologyGreenHouse" },
        });
        let charactersInPlace = state?.Character || [];

        if (data.type === "Initiate" || data.type === "React") {
          // Merge incoming characters
          if (data.incomingCharacters?.length) {
            charactersInPlace = Array.from(
              new Set([...charactersInPlace, ...data.incomingCharacters])
            );
          }

          // Update DB
          await prisma.state.updateMany({
            where: { place: "herbologyGreenHouse" },
            data: { Character: charactersInPlace },
          });

          // AI decides who leaves and what happens
          const AiResponse = await AIService(
            { Character: charactersInPlace },
            effectors[Math.floor(Math.random() * effectors.length)]
          );


          let effector = effectors[Math.floor(Math.random() * effectors.length)]


          console.log("AI RESPONSE: == ",AiResponse,"\n EFFECTOR: ",effector);

          // Remove moved characters
          const updatedCharacters = charactersInPlace.filter(
            (c) => !AiResponse.chars.includes(c)
          );
          await prisma.state.updateMany({
            where: { place: "herbologyGreenHouse" },
            data: { Character: updatedCharacters },
          });

          // Send React message to next effector
          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Herbology Greenhouse",
            ActionEntailed: AiResponse.summ,
          };

          await producer.send({
            topic: effector,
            messages: [{ value: JSON.stringify(MessageBody) }],
          });

          console.log("Sent React message:", MessageBody);
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    },
  });
}

app.get("/test", async (req, res) => {
  res.send("hi from Herbology Greenhouse");
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
