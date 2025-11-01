-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "place" TEXT NOT NULL,
    "Character" TEXT[],

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "log" TEXT NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);
