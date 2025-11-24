import express from "express";
import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js"; // your AI module

const app = express();
const PORT = 3002;
const HOST = "0.0.0.0";
app.use(express.json());

const kafka = new Kafka({
  clientId: "GryffindorTowerServer",
  brokers: ["kafka:29092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "gryffindor-group" });
const prisma = new PrismaClient();

// Helper: pick random effector excluding Gryffindor itself
const effectors = [
  "hagrids-messages",
  "herbology-messages",
  "muggle-messages",
  "platform-messages",
  "quidditch-messages",
  "great-lib-messages"
];

async function startProducer() {
  await producer.connect();
  console.log("✅ Producer connected to Kafka");
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "gryffindor-messages", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return console.log("Empty message received, skipping");

      const data = JSON.parse(value);
      console.log("Received message:", data);

      try {
        // Fetch current Gryffindor characters
        const state = await prisma.state.findFirst({
          where: { place: "gryffindorTower" },
        });
        let charactersInTower = state?.Character || [];

        if (data.type === "Initiate" || data.type === "React") {
          // Add incoming characters if any
          if (data.incomingCharacters?.length) {
            charactersInTower = Array.from(
              new Set([...charactersInTower, ...data.incomingCharacters])
            );
          }

          // Update DB
          await prisma.state.updateMany({
            where: { place: "gryffindorTower" },
            data: { Character: charactersInTower },
          });

          // Run AIService to decide next characters moving out
          const effector = effectors[Math.floor(Math.random() * effectors.length)];          

          const AiResponse = await AIService(
            { Character: charactersInTower },
            effector
          );

          // Remove moved characters from tower
          const updatedCharacters = charactersInTower.filter(
            (c) => !AiResponse.chars.includes(c)
          );

          await prisma.state.updateMany({
            where: { place: "gryffindorTower" },
            data: { Character: updatedCharacters },
          });

          // Send React message to next effector
          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Gryffindor Tower",
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
  res.send("hi from Gryffindor Tower");
});

app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);

  try {
    await startProducer();
    await startConsumer();
    console.log("✅ Kafka producer & consumer ready");
  } catch (err) {
    console.error("❌ Error starting Kafka:", err);
  }
});
