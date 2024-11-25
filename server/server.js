const express = require('express')
const app = express()

app.get("/api", (req, res) => {
    res.json({ "user" : ["userOne", "userTwo"] })
}
)

app.listen(5000, () => {console.log("listening on port 5000")})