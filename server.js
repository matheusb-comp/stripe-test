const express = require('express');
const bodyParser = require('body-parser');
const request = require('./fetch-request.js');

const STRIPE_API_BASE = 'https://api.stripe.com/v1/';
const SENDINBLUE_API_BASE = 'https://api.sendinblue.com/v3/';

const app = express();

async function sendEmail(email, name = null, fileName = null) {
  const token = process.env.SENDINBLUE_API_TOKEN;
  if (!token) throw new Error('No API token to send email!');

  const emailObject = {
    sender: { email: 'no-reply@example.org', name: 'Little Robot' },
    to: [
      { email, name: name || 'Your Name' },
    ],
    subject: 'Hi, is everything ok?',
    htmlContent: "<html><head></head><body><p>Faça o download <a href='https://matheusb-comp.github.io/stripe-test/mini-tigre.zip'>aqui</a>.</p></body></html>",
  };

  const url = SENDINBLUE_API_BASE + 'smtp/email';
  const config = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': token,
    },
    body: JSON.stringify(emailObject),
  };
  try {
    const res = await request(url, config);
  } catch (e) {
    console.log('ERROR SENDING EMAIL:', e);
    throw e;
  }
}

async function getCustomer(id) {
  const token = process.env.STRIPE_API_TOKEN;
  if (!token) throw new Error('No API token to communicate wiht Stripe!');

  const url = STRIPE_API_BASE + 'customers/' + id;
  const config = {
    headers: { 'Authorization': 'Bearer ' + token },
  };
  try {
    const res = await request(url, config);
    return res.data;
  } catch (e) {
    console.log('ERROR GETTING CUSTOMER:', e);
    throw e;
  }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (_, res) {
  res.send('Hello World!');
});

app.post('/stripe-webhook', async function (req, res) {
  try {
    console.log('req path:', req.path);
    console.log('req body:', req.body);
    const data = (req.body.data || {}).object;

    console.log('Getting customer...');
    const customer = await getCustomer(data.customer);
    console.log('Customer:', customer);

    const email = customer.email || 'matheusb.comp@gmail.com';
    console.log('Sending mail to', email, 'name:', data.customer);
    const emailRes = await sendEmail(email, data.customer);

    console.log('done! res:', emailRes);
    res.status(204).send(null);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(process.env.PORT, function () {
  console.log('== Listening on ', process.env.PORT, '==');
});
