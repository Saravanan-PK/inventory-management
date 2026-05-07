const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOTS_DIR = '/Users/SaraK/workspace/Inventory-Management/playwright-test-tmp/screenshots'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Go to restocking, place order, then navigate via Vue Router (click link, not hard navigate)
  await page.goto('http://localhost:3000/restocking', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Place order at full budget (all 3 items)
  const slider = page.locator('input[type="range"]')
  const maxVal = parseFloat(await slider.getAttribute('max') || '0')
  console.log('Slider max (full budget):', maxVal)

  await page.evaluate((val) => {
    const input = document.querySelector('input[type="range"]')
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeInputValueSetter.call(input, val)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, maxVal)

  await page.waitForTimeout(300)
  const btn = page.locator('.place-order-btn')
  console.log('Button text before click:', (await btn.textContent()).trim())
  await btn.click()
  await page.waitForTimeout(1000)
  console.log('Button text after click:', (await btn.textContent()).trim())

  // NOW click the nav link (Vue Router navigation, keeps singleton state)
  const ordersNavLink = page.locator('nav a, a[href="/orders"]', { hasText: /^orders$/i }).first()
  const ordersLinkByHref = page.locator('a[href="/orders"]').first()
  const ordersLinkAny = page.locator('a').filter({ hasText: /^Orders$/ }).first()

  let navigated = false
  for (const link of [ordersNavLink, ordersLinkByHref, ordersLinkAny]) {
    const count = await link.count()
    if (count > 0) {
      console.log('Clicking Orders nav link...')
      await link.click()
      navigated = true
      break
    }
  }
  if (!navigated) {
    console.log('No Orders nav link found, using goto')
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle' })
  }

  await page.waitForTimeout(1500)
  console.log('Current URL after nav:', page.url())

  // Check Submitted Orders section
  const submittedCard = await page.locator('.submitted-orders-card').count()
  console.log('Submitted Orders card visible:', submittedCard > 0)

  if (submittedCard > 0) {
    const cardText = await page.locator('.submitted-orders-card').textContent()
    console.log('Submitted orders card content:', cardText.replace(/\s+/g, ' ').trim().substring(0, 500))
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-orders-via-nav-click.png'), fullPage: true })
  console.log('Screenshot saved: 05-orders-via-nav-click.png')

  // Expand items details
  const details = page.locator('.submitted-orders-card details')
  const detailsCount = await details.count()
  console.log('Item details elements:', detailsCount)
  if (detailsCount > 0) {
    await details.first().click()
    await page.waitForTimeout(300)
    const items = await page.locator('.submitted-orders-card .item-entry').allTextContents()
    console.log('Item entries after expanding:')
    items.forEach((t, i) => console.log(`  Item ${i+1}:`, t.replace(/\s+/g, ' ').trim()))
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-orders-expanded-items.png'), fullPage: true })
  console.log('Screenshot saved: 06-orders-expanded-items.png')

  await browser.close()
})()
