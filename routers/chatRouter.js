const express  = require('express')
const auth = require('../middlewares/auth')
const chatController = require('../controllers/chatController/chatController')
const router = express.Router()

router.post('/accessChat',auth.verifyChatToken,chatController.accessChat)
router.get('/traineeDetails',auth.verifyChatToken,chatController.getUsers)
router.get('/allDetails',auth.verifyChatToken,chatController.getAllDetails)
router.post('/addMessage',auth.verifyChatToken,chatController.addMessage)

module.exports = router