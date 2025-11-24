import { Kafka } from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js";

const app = express();
const HOST = "0.0.0.0";
const port = 3003;
app.use(express.json());

const kafka = new Kafka({
  clientId: "HagridsHutServer",
  brokers: ["kafka:29092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "hagrids-group" });
const prisma = new PrismaClient();

// Effector topics excluding Hagrid's Hut itself
const effectors = [
  "great-lib-messages",
  "gryffindor-messages",
  "herbology-messages",
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
  await consumer.subscribe({ topic: "hagrids-messages", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return console.log("Empty message, skipping");

      const data = JSON.parse(value);
      console.log("Received message:", data);

      try {
        // Fetch current Hagrid's Hut characters
        const state = await prisma.state.findFirst({
          where: { place: "hagridsHut" },
        });
        let charactersInHut = state?.Character || [];

        if (data.type === "Initiate" || data.type === "React") {
          // Add incoming characters
          if (data.incomingCharacters?.length) {
            charactersInHut = Array.from(
              new Set([...charactersInHut, ...data.incomingCharacters])
            );
          }

          // Update DB
          await prisma.state.updateMany({
            where: { place: "hagridsHut" },
            data: { Character: charactersInHut },
          });

          // Run AIService to decide next characters moving out
          const { AiResponse, effector } = await AIService(
            { Character: charactersInHut },
            effectors[Math.floor(Math.random() * effectors.length)]
          );
          console.log("===AI RESPONSE WHICH HAS CHARS: ",AIService)

          // Remove moved characters from hut
          const updatedCharacters = charactersInHut.filter(
            (c) => !AiResponse.chars.includes(c)
          );
          await prisma.state.updateMany({
            where: { place: "hagridsHut" },
            data: { Character: updatedCharacters },
          });

          // Send React message to next effector
          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Hagrid's Hut",
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
  res.send("hi from Hagrid's Hut");
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
