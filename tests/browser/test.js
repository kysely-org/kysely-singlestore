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
const {chromium} = require('playwright')

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

    browser = await chromium.launch({headless: true})

    const page = await browser.newPage()

    await page.goto(`file://${path.join(__dirname, 'index.html')}`)

    await page.waitForSelector('#result', {timeout: 5_000})

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
