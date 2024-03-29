# The Byte Shop

A Pedagogical SPV Example

A Stageline ("testnet") deployment of this repository is available at [https://staging-byte-shop.babbage.systems](https://staging-byte-shop.babbage.systems)

Cool Bytes can be purchased if you have a [CoolCert](https://github.com/p2ppsr/coolcert) certificate.

Also check out the [Byte Shop User Interface frontend](https://github.com/p2ppsr/byte-shop-ui)!

## What Is This?

Step right up! Buy your very own unique set of random bytes! For the low low price of only 100 satoshis each, we are selling bytes of random data. Minimum 10 per order. Exclusions apply. Batteries not included. Made in China, just kidding not really. **Must pay in BSV with FULL SPV, yes really**!

### Ok, what is this *REALLY*?

This is an open-source example of a merchant running a server to accept SPV payments in Bitcoin over the internet in exchange for digital goods or services—in this case, pseudo-random bytes of data. This is a reference implementation of a simple Babbage app server.

It uses the Babbage suite of tools to peroform the purchase of the bytes. The buyer sends a request for a number of bytes to be purchased from the merchant. The merchant returns an invoice to the buyer for the number of bytes requested. Provided the buyer sends the merchant the correct payment, as detailed on the invoice, the merchant returns the bytes and a note thanking the buyer for their purchase.

## Spinning Up

Clone the repo with Docker installed.

Generate a `SERVER_PRIVATE_KEY` (64 random hex digits, 256-bits) and put it into the `docker-compose.yml` file. This is the key that will receive Bitcoin when your server sells its random bytes.

Run `docker compose up`
- Your API will run on port **3001**
- Your database will be available on port **3002**
  - Username: `root`
  - Password: `test`
  - Database: `bytes`
- A web SQL database viewer (PHPMyAdmin) is on port **3003**

To interact with this API, spin up a copy of the [Byte Shop UI](https://github.com/p2ppsr/byte-shop-ui) in parallel with this system.

## Deploying

You can see some brief guidance on [deploying this server with Google Cloud Run](DEPLOYING.md).

## License

The license for the code in this repository is the Open BSV License.
