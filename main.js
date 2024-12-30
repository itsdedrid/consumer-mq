// receive.js
import amqplib from 'amqplib'
import { createQueue, changeQueue } from './function.js'

async function receiveMessage() {
  const rabbitMQHost = process.env.RABBITMQ_HOST || 'localhost'
  const connection = await amqplib.connect(`amqp://${rabbitMQHost}:5672`)
  const channel = await connection.createChannel()

  const queue = 'queue' // Queue name

  await channel.assertQueue(queue, { durable: true }) // Ensure the queue exists

  console.log('Waiting for messages in queue:', queue)

  channel.consume(
    queue,
    async (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString()

        try {
          const data = JSON.parse(messageContent)
          if (data.queueId == null) {
            const createdQueue = await createQueue(
              data.studentId,
              data.reqId,
              data.timeslotId,
              data.period,
              data.uid,
            )
            console.log('Inserted into database:', createdQueue)
          } else {
            const changedQueue = await changeQueue(
              data.queueId,
              data.studentId,
              data.reqId,
              data.timeslotId,
              data.period,
              data.uid,
            )
            console.log('Change and inserted into database:', changedQueue)
          }
          channel.ack(msg)
        } catch (error) {
          console.error('Failed to process message:', error)

          // Optionally, reject the message (without re-queuing)
          channel.nack(msg, false, false)
        }
      }
    },
    { noAck: false }, // Ensure acking is enabled
  ) // Set noAck: false to ensure acking messages
}

receiveMessage().catch(console.error)
