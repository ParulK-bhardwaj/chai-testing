const express = require('express')
const router = express.Router();

const Message = require('../models/message')
const User = require('../models/user')

/** Route to get all messages. */
router.get('/', (req, res) => {
    Message.find().then((messages) => {
        return res.json({messages})
    })
    .catch((err) => {
        throw err.message
    });
})

/** Route to get one message by id. */
router.get('/:messageId', (req, res) => {
    Message.findById(req.params.messageId)
        .then(message => {
            return res.json(message)
        })
        .catch(err => {
            throw err.message
        })
})

/** Route to add a new message. */
router.post('/', (req, res) => {
    let message = new Message(req.body)
    message.save()
    .then(message => {
        return User.findById(message.author)
    })
    .then(user => {
        console.log(user)
        user.messages.unshift(message)
        return user.save()
    })
    .then(_ => {
        return res.send(message)
    }).catch(err => {
        throw err.message
    })
})

/** Route to update an existing message. */
router.put('/:messageId', (req, res) => {
    const { title, body } = req.body;
    Message.findByIdAndUpdate(req.params.messageId, { title, body }, { new: true })
        .then((updatedMessage) => {
            return res.json({ message: updatedMessage });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

/** Route to delete a message. */
router.delete('/:messageId', (req, res) => {
    Message.findByIdAndDelete(req.params.messageId).then(() => {
        return res.json({
            'message': 'Message Successfully deleted.',
            '_id': req.params.userId
        })
    })
    .catch((err) => {
        throw err.message
    })
})

module.exports = router