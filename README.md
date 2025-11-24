
# 🏰 Distributed Harry Potter Universe  
A distributed backend simulation where characters travel between microservices through Kafka messaging.  
No frontend. Only spells, asynchronous owl messages, and AI driven decisions.

## 🧙‍♂️ What Is This  
A Distributed System themed as the Wizarding World.  
Each location is a microservice. Characters are serialized into JSON and transported by Kafka topics.  
AI determines who moves next and where they go.

## ⚙️ Core Components  
**The Brain**  
Generative AI selects character movement.  

**The Transport**  
Apache Kafka delivers character messages.  

**The Memory**  
PostgreSQL with Prisma stores state.

## ⚡ Architecture  
```mermaid
graph TD
    subgraph Infrastructure
        Docker(Docker Compose)
        Kafka(Kafka Broker)
        Postgres(PostgreSQL DB)
    end

    subgraph Magical Services
        Master(Master Server)
        Gryff(Gryffindor)
        Hagrid(Hagrid's Hut)
        Lib(Library)
        Pitch(Quidditch)
        Platform(Platform 9 3/4)
    end

    Master -->|1. initiate| Kafka
    Kafka -->|2. Deliver Character| Gryff
    Gryff -->|3. AI Logic Decision| Kafka
    Kafka -->|4. Move Character| Hagrid
    Hagrid -->|5. Loop Continues| Kafka
````

## 🐳 Quick Start

All services are containerized.

### Prerequisites

* Docker Desktop
* Git

### 1. Clone

```bash
git clone https://github.com/your-username/distributed-harry-potter-universe.git
cd distributed-harry-potter-universe
```

### 2. Start the Universe

```bash
docker-compose up --build
```

### 3. Initiate

```bash
curl http://localhost:3008/initate
```

## 📜 Live Logs

Expect real time story events:

```
🦁 Gryffindor Tower  
Incoming Students: Harry, Ron  
Departing: Harry -> Quidditch Pitch

🧹 Quidditch Pitch  
Flying in: Harry  
Harry moves to Hagrid's Hut
```

## 🛠 Tech Stack

| Icon | Tech       | Role               |
| ---- | ---------- | ------------------ |
| 🐳   | Docker     | Containerization   |
| 🦉   | Kafka      | Messaging          |
| 🟢   | Node.js    | Microservices      |
| 🐘   | PostgreSQL | Database           |
| 🔺   | Prisma     | ORM                |
| 🧠   | GenAI      | Logic and movement |

## 📂 Services

| Service        | Port | Description                |
| -------------- | ---- | -------------------------- |
| Master Server  | 3008 | Controller and API gateway |
| Great Library  | 3001 | Scroll processing          |
| Gryffindor     | 3002 | Common room logic          |
| Hagrid's Hut   | 3003 | Creature logic             |
| Herbology      | 3004 | Greenhouse logic           |
| Muggle World   | 3005 | London logic               |
| Platform 9 3 4 | 3006 | Transportation logic       |
| Quidditch      | 3007 | Sports logic               |
| Postgres       | 5434 | Database                   |

## 🛑 Shutdown

```bash
docker-compose down
```

---

# 📡 Sample Kafka Log Output

```
✅ Kafka producer and consumer ready

🕊️ From: Quidditch Pitch
👥 Character Came: [ 'Padma', 'Dennis', 'Vincent', 'Gregory' ]
📖 Scene: Tension rises as Cho and Sirius argue about Quidditch strategies. Fred and Lee commentate humorously. Padma observes quietly, while Dennis, Vincent and Gregory seem disinterested.
════════════════════════════════════════════════════════════
🕊️ Sent To: platform-messages
📦 Constructed Message Body
👥 Transffered Characters: Dennis, Vincent, Gregory
📖 Scene: Neville struggles with Herbology texts. McGonagall advises Padma on Ancient Runes. Dennis distracts Crabbe and Goyle.
════════════════════════════════════════════════════════════

🕊️ From: Platform Nine Quarters
👥 Character Came: [ 'Bill', 'Hermione', 'Narcissa', 'Vincent', 'Gregory' ]
📖 Scene: Cornelius argues with Remus and Tonks. Luna comforts Dennis.
════════════════════════════════════════════════════════════
🕊️ Sent To: muggle-messages
📦 Constructed Message Body
👥 Transffered Characters: Hermione, Bill
📖 Scene: Debate on historical spell creation that ends with a split.
════════════════════════════════════════════════════════════

🕊️ From: Platform Nine Quarters
👥 Character Came: [ 'Remus', 'Tonks', 'Bill' ]
📖 Scene: Order business discussed among chaos. Hermione debates Cornelius.
════════════════════════════════════════════════════════════
🕊️ Sent To: quidditch-messages
📦 Constructed Message Body
👥 Transffered Characters: Neville, Padma, Tonks, Bill
📖 Scene: Research tension regarding family histories and Quidditch opinions.
════════════════════════════════════════════════════════════

🕊️ From: Quidditch Pitch
👥 Character Came: [ 'Cho', 'Sirius', 'Tonks' ]
📖 Scene: Gryffindor and Ravenclaw practice separately. Sirius and Tonks cause chaos.
════════════════════════════════════════════════════════════
🕊️ Sent To: muggle-messages
📦 Constructed Message Body
👥 Transffered Characters: Remus, Tonks, Sirius
📖 Scene: Ethical debate about revealing wizarding secrets to Muggles.
════════════════════════════════════════════════════════════

🕊️ From: Platform Nine Quarters
👥 Character Came: [ 'Luna', 'Dennis', 'Parvati', 'Padma' ]
📖 Scene: Anticipation as students discuss Hogwarts and future plans.
════════════════════════════════════════════════════════════
🕊️ Sent To: herbology-messages
📦 Constructed Message Body
👥 Transffered Characters: Dennis, Luna, Cho, Parvati, Padma
📖 Scene: Study session disagreements that lead to a move to the greenhouses.
════════════════════════════════════════════════════════════

🕊️ From: Muggle World
👥 Character Came: [ 'Voldemort', 'Snape' ]
📖 Scene: Voldemort questions Snape. Percy argues about tea etiquette. Remus watches.
════════════════════════════════════════════════════════════
🕊️ Sent To: hagrids-messages
📦 Constructed Message Body
👥 Transffered Characters: Narcissa, Vincent, Gregory
📖 Scene: Voldemort interrogates Snape about Dumbledore. McGonagall observes. Narcissa pleads for Draco.
════════════════════════════════════════════════════════════
```
