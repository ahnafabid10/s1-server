import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const PORT = config.port;

async function bootstrap() {
  try {
    // Connect database
    await prisma.$connect();
    console.log("Database connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`s1-server is running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });

    const exitHandler = () => {
      if (server) {
        server.close(async () => {
          console.log("Server closed");
          await prisma.$disconnect();
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      exitHandler();
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Rejection:", error);
      exitHandler();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
