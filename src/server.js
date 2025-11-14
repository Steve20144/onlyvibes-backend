const express = require('express');
const cors = require('cors');
const accountRoutes = require("./routes/accountRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/accounts", accountRoutes);

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.use(cors());

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});