import { Kafka } from "kafkajs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import AIService from "./AI.js";

const app = express();
const HOST = "0.0.0.0";
const port = 3008;
app.use(express.json());

const kafka = new Kafka({
  clientId: "QuidditchPitchServer",
  brokers: ["kafka:29092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "quidditch-group" });
const prisma = new PrismaClient();

// Effector topics excluding Quidditch Pitch itself
const effectors = [
  "great-lib-messages",
  "gryffindor-messages",
  "hagrids-messages",
  "herbology-messages",
  "muggle-messages",
  "platform-messages",
];

async function startProducer() {
  await producer.connect();
  console.log("✅ Producer connected to Kafka");
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "quidditch-messages", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return console.log("Empty message, skipping");

      const data = JSON.parse(value);
      console.log("Received message:", data);

      try {
        // Fetch current Quidditch Pitch characters
        const state = await prisma.state.findFirst({
          where: { place: "quidditchPitch" },
        });
        let charactersInPitch = state?.Character || [];

        if (data.type === "Initiate" || data.type === "React") {
          // Add incoming characters
          if (data.incomingCharacters?.length) {
            charactersInPitch = Array.from(
              new Set([...charactersInPitch, ...data.incomingCharacters])
            );
          }

          // Update DB
          await prisma.state.updateMany({
            where: { place: "quidditchPitch" },
            data: { Character: charactersInPitch },
          });

          // Run AIService to decide outgoing characters
          const { AiResponse, effector } = await AIService(
            { Character: charactersInPitch },
            effectors[Math.floor(Math.random() * effectors.length)]
          );
                    console.log("===AI RESPONSE WHICH HAS CHARS: ",AIService)
          

          // Remove moved characters from pitch
          const updatedCharacters = charactersInPitch.filter(
            (c) => !AiResponse.chars.includes(c)
          );
          await prisma.state.updateMany({
            where: { place: "quidditchPitch" },
            data: { Character: updatedCharacters },
          });

          // Send React message to next effector
          const MessageBody = {
            type: "React",
            incomingCharacters: AiResponse.chars,
            reactionByEffector: "Quidditch Pitch",
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
  res.send("hi from Quidditch Pitch");
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
