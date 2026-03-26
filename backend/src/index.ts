import "dotenv/config";
import app from "./app";

const port = Number(process.env["PORT"] || "5000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
