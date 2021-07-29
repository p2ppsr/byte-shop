# The Byte Shop

A Pedagogical SPV Example

## What Is This?

Step right up! Buy your very own unique set of random bytes! For the low low price of only 100 satoshis each, we are selling bytes of random data. Minimum 10 per order. Exclusions apply. Batteries not included. Made in China, just kidding not really. **Must pay in BSV with FULL SPV, yes really**!

### Ok, what is this *REALLY*?

This is an open-source example of a merchant running a server to accept SPV payments in Bitcoin over the internet in exchange for digital goods or services—in this case, pseudo-random bytes of data.

It uses Paymail and the Babbage suite of tools. The merchant configures the server with their Paymail address, where they will receive their satoshis. The server proxies requests to Paymail, checking that the payments were accepted and furnishing the goods to the customer if so.

This works with legacy wallets as well, but will print warnings to the console if the merchant's paymail server is incapable of accepting SPV envelopes. Wallets like MoneyButton and HandCash do not yet support SPV envelopes, but if you have a [Babbage Desktop](https://projectbabbage.com) account, you are good to go.

## Setting Up

This runs on the infinitely-scalable Google App Engine platform. You will need a database, an App Engine project and GitHub Actions configured for your repo.

Create a Google Cloud service account and download its credentials.

Create a Cloud SQL instance (MySQL is what has been tested) and create a new user. Make note of the username, password, host name and the database you want to use.

You will need `gcloud` command line tools set up. You will need to run `gcloud login` and configure it to use the correct project.

Go to GitHub repository settings and populate the repository secrets defined in `.github/workflows/deploy.staging.yml` and `.github/workflows/deploy.production.yml`.

Modify `dispatch.yml` in your fork of the repo with the domains you want to use. Deploy it with `gcloud app deploy dispatch.yml`

You will need to deploy the production branch before the master branch, as the first service must always be `default`.

You will need to migrate both the staging and production databases to create the schema after deployment. Use the migrate route with the migration key you have configured.

## License

The license for the code in this repository is the Open BSV License.
