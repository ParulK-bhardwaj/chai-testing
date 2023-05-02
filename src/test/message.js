require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
    // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
    mongoose.models = {}
    mongoose.modelSchemas = {}
    mongoose.connection.close()
    done()
})

const SAMPLE_OBJECT_ID = 'aaaaaaaaaaaa' // 12 byte string
const ObjectID = mongoose.Types.ObjectId;

const SAMPLE_MESSAGE_ID = new ObjectID(); // Generate a new ObjectID

describe('Message API endpoints', () => {
    beforeEach((done) => {
        const user = new User({
            username: 'username',
            password: 'password',
            _id: SAMPLE_OBJECT_ID
        });

        user.save((err, savedUser) => {
            if (err) {
                return done(err);
            }
            this.userId = savedUser._id;

            const message = new Message({
                _id: SAMPLE_MESSAGE_ID,
                title: 'Test title',
                body: 'Test message',
                author: user
            });

            message.save((err, savedMessage) => {
                if (err) {
                    return done(err);
                }
                this.messageId = savedMessage._id;
                done();
            });
        });
    });


    afterEach((done) => {
        Message.deleteOne({ _id: this.messageId }, (err) => {
            if (err) {
                return done(err);
            }
            // Remove the test User document
            User.deleteOne({ _id: this.userId }, (err) => {
                if (err) {
                    return done(err);
                }
                done();
            });
        });
    });

    it('should load all messages', (done) => {
        chai.request(app)
            .get('/messages')
            .end((err, res) => {
                if (err) { done(err) }
                expect(res).to.have.status(200)
                expect(res.body.messages).to.be.an("array")
                done()
            })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
            .get(`/messages/${this.messageId}`)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.should.be.json;
                res.body.should.have.property('body')
                res.body.should.have.property('author')
                done();
            });
    });

    it('should post a new message', (done) => {
        const newMessage = {
            title: 'New message',
            body: 'This is a new message',
            author: this.userId
        };

        chai.request(app)
            .post('/messages')
            .send(newMessage)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.should.be.json;
                res.body.should.have.property('title').equal(newMessage.title)
                res.body.should.have.property('body').equal(newMessage.body)
                res.body.should.have.property('author').equal(String(this.userId))
                done();
            });
    });

    it('should update a message', (done) => {
        const updatedMessage = {
            title: 'Updated message',
            body: 'This is an updated message'
        };

        chai.request(app)
            .put(`/messages/${this.messageId}`)
            .send(updatedMessage)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.should.be.json;
                expect(res.body.message).to.have.property('title', updatedMessage.title)

                Message.findById(this.messageId, (err, message) => {
                    expect(message).to.not.be.null
                    expect(message.title).to.equal(updatedMessage.title)
                    expect(message.body).to.equal(updatedMessage.body)
                    expect(message.author.toString()).to.equal(this.userId.toString())
                
                done();
                })
            });
    });

    it('should delete a message', (done) => {
        chai.request(app)
            .delete(`/messages/${this.messageId}`)
            .end((err, res) => {
                res.should.have.status(200)
                Message.findById(this.messageId, (err, message) => {
                    expect(message).to.equal(null)
                    done()
                });
            });
    });
});