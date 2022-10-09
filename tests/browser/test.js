/**
 * Super simple smoke test that just opens an empty web page
 * and runs the `main.ts` script in it (bundled with esbuild).
 * The script executes a query with SingleStoreDataApiDialect
 * and writes the result to a span in the browser.
 *
 * inspired by Sami Koskimäki's browser test @ kysely.
 */

const assert = require('assert')
const path = require('path')
const {chromium, firefox} = require('playwright')

;(async () => {
  let browser

  try {
    const expected = JSON.stringify({
      id: 1,
      first_name: 'Jennifer',
      middle_name: null,
      last_name: 'Aniston',
      age: 25,
      gender: 'female',
    })

    browser = await chromium.launch({
      headless: true,
      logger: {
        isEnabled: () => true,
        log: console.log.bind(console),
      },
      // proxy: {
      //   server: 'localhost:8080',
      //   bypass: '<-loopback>',

      // },
    })

    const page = await browser.newPage()

    await page.route(
      (url) => url.host === 'localhost:9000',
      async (route, req) =>
        route.fulfill({
          response: await page.request.fetch(req),
        }),
    )

    await page.goto(`file://${path.join(__dirname, 'index.html')}`)

    await page.waitForSelector('#result', {timeout: 60_000})

    const actual = await page.$eval('#result', (element) => element.innerHTML)

    assert(actual === expected, 'failed to build a query!')
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await browser?.close()
  }

  console.log('works in the browser!')
})()
