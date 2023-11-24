# Contributing

## Testing

### Preqrequisites

1.  Docker installed and running.
2.  pnpm v8 installed globally and `pnpm install` ran.
3.  A SingleStore Self-Managed license key.
4.  Run `pnpm exec playwright install`

### Running Tests

1.  Start a SingleStore container by running `SINGLESTORE_LICENSE=<your_singlestore_license_key> docker-compose up --force-recreate` in your terminal and wait for it to finish starting up.
2.  Clone the repository.
3.  Run `pnpm test`.

## Submitting changes

1.  Fork the repository.
2.  Create a branch from `main` with a descriptive name.
3.  Make your changes.
4.  Test your changes.
5.  Commit your changes.
6.  Push your changes to your fork.
7.  Create a pull request to the `main` branch of the repository.
8.  Set `SINGLESTORE_LICENSE` to your SingleStore license key in the GitHub Actions secrets.
9.  Make sure the tests pass in the pull request.
10. Wait for a maintainer to review your pull request.
11. If the maintainer requests changes, make the changes and push them to your fork.
12. Once the maintainer approves your pull request, they will merge it into the `main` branch.
