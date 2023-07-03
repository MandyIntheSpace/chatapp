const express = require('express')
const router = express.Router()

router.get('/chat', (req, res) => {
    res.send('The server is up and running')
})

module.exports = router;