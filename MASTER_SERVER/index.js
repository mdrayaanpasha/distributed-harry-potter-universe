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
