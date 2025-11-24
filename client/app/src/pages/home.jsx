import { Kafka } from "kafkajs";
import { useEffect } from "react";

const kafka = new Kafka({
  clientId: "UI",
  brokers: ["kafka:29092"]
});

const consumer = kafka.consumer({ groupId: "muggle-group" });

const effectors = [
  "great-lib-messages",
  "gryffindor-messages",
  "hagrids-messages",
  "herbology-messages",
  "platform-messages",
  "muggle-messages",
  "quidditch-messages"
];

export async function startConsumer() {
  await consumer.connect();

  for (const topic of effectors) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      console.log(value);
    }
  });
}

useEffect(()=>{
    startConsumer();
},[])


export default function Home(){
    return(
        <>
        <h1>Hello this is home</h1>
        </>
    )
}