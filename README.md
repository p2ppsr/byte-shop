# The Byte Shop

A Pedagogical SPV Example

## What Is This?

Step right up! Buy your very own unique set of random bytes! For the low low price of only 100 satoshis each, we are selling bytes of random data. Minimum 10 per order. Exclusions apply. Batteries not included. Made in China, just kidding not really. **Must pay in BSV with FULL SPV, yes really**!

### Ok, what is this *REALLY*?

This is an open-source example of a merchant running a server to accept SPV payments in Bitcoin over the internet in exchange for digital goods or services—in this case, pseudo-random bytes of data. This is a reference implementation of a simple Babbage app.

It uses the Babbage suite of tools to peroform the purchase of the bytes. The buyer sends a request for a number of bytes to be purchased. The merchant returns an invoice to the buyer for the number of bytes requested. Provided the buyer sends the merchant the correct payment as detailed on the invoice, the merchant returns the bytes and a note thanking the buyer for their purchase.

## Setting Up

This runs on the Google Cloud platform. You will need a Google Cloud account using IAM that includes running a database and GitHub Actions configured for your fork of this repo.

You will need `gcloud` command line tools set up. You will need to run `gcloud auth login` and configure it to use the correct project. To do this, run `gcloud config configurations create your-cfg-name`, then `gcloud config set account your-email@domain.tld` and finally `gcloud config set project your-project-id`.

Create a Cloud SQL instance (MySQL is what has been tested) and create a new user. Also create a new database inside the new instance. Make note of the username, password, host name and database name you want to use. Alternatively, you can use another database hosting solution.

Go to the Google Cloud console and select a region. Use the same region as your Cloud SQL instance for best performance. Once the Google Cloud application has been created, go to Settings and add two custom domains: one for staging and one for production.

Go to GitHub repository settings and populate the repository secrets defined in `.github/workflows/deploy.staging.yml` and `.github/workflows/deploy.production.yml`.

- STAGING_NODE_ENV is `staging`
- PROD_NODE_ENV is `production`
- STAGING_ROUTING_PREFIX and PROD_ROUTING_PREFIX are not needed unless you want them
- STAGING_HOSTING_DOMAIN is the domain name you configured for staging
- PROD_HOSTING_DOMAIN is the domain name you configured for production
- STAGING_KNEX_DB_CONNECTION is a JSON object describing the connection to your staging database. For example, `{"port":3306,"host":"10.1.1.1","user":"yourstagingusername","password":"yourstagingpassword","database":"your_staging_db"}`
- PROD_KNEX_DB_CONNECTION is a JSON object describing the connection to your production database. For example, `{"port":3306,"host":"10.1.1.1","user":"yourprodusername","password":"yourprodpassword","database":"your_prod_db"}`
- STAGING_KNEX_DB_CLIENT and PROD_KNEX_DB_CLIENT are both `mysql`
- STAGING_MIGRATE_KEY and PROD_MIGRATE_KEY are the migration keys that can be used by the server administrator with the `/migrate` API endpoints to run new database migrations. Since staging and production use different databases, their migrations are handled separately, and different migration keys should be used for each.
- STAGING_GCP_PROJECT_ID and PROD_GCP_PROJECT_ID are usually the same, unless you have different Google Cloud projects for each deployment. Set them to the project ID where App Engine is running.
- GCP_DEPLOY_CREDS is the text of the JSON file that you downloaded when you created the access key for the service account

After this is done, write a commit and push it to the `production` branch. Check that the Google Cloud production deployment succeeded in GitHub Actions. After it works, pull your new commit into `master` and ensure that the `staging` deployment succeeds. You will need to deploy the production branch before the master branch, as the first Google Cloud service must always be `default`.

Once you have successfully deployed your `staging` and `production` apps, use your Google Cloud console to 'Add Domains' so you can use your custom domains by pointing them to your newly deployed apps.

Once your custom domains are working, you will need to migrate both the staging and production databases to create the schema after deployment. Use the `/migrate` API endpoints on both deployments with the migration keys you have configured.

## License

The license for the code in this repository is the Open BSV License.
