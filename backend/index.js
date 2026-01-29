const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  console.log("REGISTER DATA:", name, email, password);

  res.json({
    message: "Register received",
    name,
    email,
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
