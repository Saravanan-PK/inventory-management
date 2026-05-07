const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const SCREENSHOTS_DIR = '/Users/SaraK/workspace/Inventory-Management/playwright-test-tmp/screenshots'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 900 })

  await page.goto('http://localhost:3000/restocking', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Place a full-budget order
  const slider = page.locator('input[type="range"]')
  const maxVal = parseFloat(await slider.getAttribute('max') || '0')
  await page.evaluate((val) => {
    const input = document.querySelector('input[type="range"]')
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeInputValueSetter.call(input, val)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, maxVal)
  await page.waitForTimeout(300)
  await page.locator('.place-order-btn').click()
  await page.waitForTimeout(800)

  // Navigate via nav link (SPA)
  await page.locator('a[href="/orders"]').first().click()
  await page.waitForTimeout(1500)

  // Screenshot just the top portion (submitted orders section)
  const submittedCard = page.locator('.submitted-orders-card')
  const box = await submittedCard.boundingBox()
  console.log('Submitted orders card bounding box:', JSON.stringify(box))

  if (box) {
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-submitted-orders-section.png'),
      clip: { x: 0, y: 0, width: 1280, height: Math.min(box.y + box.height + 40, 900) }
    })
    console.log('Screenshot saved: 07-submitted-orders-section.png')
  }

  // Expand the items
  await page.locator('.submitted-orders-card details').first().click()
  await page.waitForTimeout(300)

  if (box) {
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-submitted-order-expanded.png'),
      clip: { x: 0, y: 0, width: 1280, height: Math.min(box.y + box.height + 200, 1200) }
    })
    console.log('Screenshot saved: 08-submitted-order-expanded.png')
  }

  // Log all order fields
  const orderNum = await page.locator('.submitted-orders-card td strong').first().textContent()
  console.log('Order number:', orderNum)
  const allCells = await page.locator('.submitted-orders-card tbody td').allTextContents()
  console.log('All order row cells:', allCells.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean))

  await browser.close()
})()
