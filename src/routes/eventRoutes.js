const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.get('/events', eventController.listEvents);
router.post('/events', eventController.createEvent);
router.get('/events/:eventId', eventController.getEvent);
router.put('/events/:eventId', eventController.updateEvent);
router.delete('/events/:eventId', eventController.deleteEvent);

module.exports = router;
