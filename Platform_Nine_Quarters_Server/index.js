import { Kafka } from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js";

const app = express();
const HOST = "0.0.0.0";
const port = 3007;
app.use(express.json());

const kafka = new Kafka({
  clientId: "PlatformNineQuartersServer",
  brokers: ["kafka:29092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "platform-group" });
const prisma = new PrismaClient();

// Effector topics excluding Platform Nine Quarters itself
const effectors = [
  "great-lib-messages",
  "gryffindor-messages",
  "hagrids-messages",
  "herbology-messages",
  "muggle-messages",
  "quidditch-messages",
];

async function startProducer() {
  await producer.connect();
  console.log("✅ Producer connected to Kafka");
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "platform-messages", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return console.log("Empty message, skipping");

      const data = JSON.parse(value);
      console.log("Received message:", data);

      try {
        // Fetch current characters from DB
        const state = await prisma.state.findFirst({
          where: { place: "platform9Quarters" },
        });
        let charactersInPlace = state?.Character || [];

        if (data.type === "Initiate" || data.type === "React") {
          // Add incoming characters
          if (data.incomingCharacters?.length) {
            charactersInPlace = Array.from(
              new Set([...charactersInPlace, ...data.incomingCharacters])
            );
          }

          // Update DB
          await prisma.state.updateMany({
            where: { place: "platform9Quarters" },
            data: { Character: charactersInPlace },
          });

          // Run AIService to decide outgoing characters
          const { AiResponse, effector } = await AIService(
            { Character: charactersInPlace },
            effectors[Math.floor(Math.random() * effectors.length)]
          );

          console.log("AI RESPONSE THAT HAS CHARS!! AND ALSO EFFECTORS===\n",AiResponse,effector)

          // Remove moved characters from place
          const updatedCharacters = charactersInPlace.filter(
            (c) => !AiResponse.chars.includes(c)
          );
          await prisma.state.updateMany({
            where: { place: "platform9Quarters" },
            data: { Character: updatedCharacters },
          });

          // Send React message to next effector
          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Platform Nine Quarters",
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
  res.send("hi from Platform Nine Quarters");
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
