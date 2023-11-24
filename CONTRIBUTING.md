# Testing

## Preqrequisites

1. Docker installed and running.
2. pnpm v8 installed globally and `pnpm install` ran.
3. A SingleStore Self-Managed license key.

## Running Tests

1. Start a SingleStore container by running `SINGLESTORE_LICENSE=<your_singlestore_license_key> docker-compose up` in your terminal and wait for it to finish starting up.
2. Clone the repository.
3. Run `pnpm test`.
