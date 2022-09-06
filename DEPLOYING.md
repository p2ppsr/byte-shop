## Setting Up Deployment

**DISCLAIMER:** Deploy this however you want. Babbage thinks Google Cloud Run with GitHub Actions is a great place for new developers to get started deploying scalable, containerized applications. If you have other instructions or scripts you'd like to add or improve, for alternative deployment setups, you're welcome to PR them!

### Rough Notes

This runs on the GCP (Google Cloud Platform) within Cloud Run (Docker) containers. You will need a GCP account using IAM, that includes running a database, and your GitHub Actions configured for your fork of this repo.

In addition, you will need `gcloud` command line tools set up. You will need to run `gcloud auth login` and configure it to use the correct project. To do this, run `gcloud config configurations create your-cfg-name`, then `gcloud config set account your-email@domain.tld` and finally `gcloud config set project your-project-id`.

Create a Cloud SQL instance (MySQL is what has been tested) and create a new DB user. Also, create a new database inside the new instance. Make note of the username, password, host name and database name you want to use. Alternatively, you can use another database hosting solution.

Go to the GCP console and select a region. Use the same region as your Cloud SQL instance for best performance. Once the GCP application has been created, go to Settings and add two custom domains: one for staging and one for production.

Go to GitHub repository settings and populate the repository secrets defined in `.github/workflows/deploy.yml`.

- STAGING_KNEX_DB_CONNECTION is a JSON object describing the connection to your staging database. For example, `{"port":3306,"host":"10.1.1.1","user":"yourstagingusername","password":"yourstagingpassword","database":"your_staging_db"}`
- PROD_KNEX_DB_CONNECTION is a JSON object describing the connection to your production database. For example, `{"port":3306,"host":"10.1.1.1","user":"yourprodusername","password":"yourprodpassword","database":"your_prod_db"}`
- STAGING_MIGRATE_KEY and PROD_MIGRATE_KEY are the migration keys that can be used by the server administrator with the `/migrate` API endpoints to run new database migrations. Since staging and production use different databases, their migrations are handled separately, and different migration keys should be used for each.
- GCP_DEPLOY_CREDS is the text of the JSON file that you downloaded when you created the access key for the service account

After this is done, write a commit and push it to `master`. Check that both the GCP staging and production deployments succeeded in GitHub Actions.

Once you have successfully deployed your staging and production GCP applications, use your GCP console to 'Add Domains' so you can use your custom domains by pointing them to your newly deployed applications.

Once your custom domains are working, you will need to migrate both the staging and production databases to create the schema after deployment. Use the `/migrate` API endpoints on both deployments with the migration keys you have configured.