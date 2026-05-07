const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOTS_DIR = '/Users/SaraK/workspace/Inventory-Management/playwright-test-tmp/screenshots'
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', err => consoleErrors.push('[pageerror] ' + err.message))

  // ── STEP 1: Navigate to root ──────────────────────────────────────
  console.log('\n=== STEP 1: Navigate to http://localhost:3000 ===')
  const resp = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  console.log('HTTP status:', resp.status())
  const title = await page.title()
  console.log('Page title:', title)
  const h1 = await page.locator('h2, h1').first().textContent().catch(() => '(none)')
  console.log('First heading:', h1.trim())

  // ── STEP 2: Find and click Restocking nav link ────────────────────
  console.log('\n=== STEP 2: Check nav bar for Restocking link ===')
  const navLinks = await page.locator('nav a, .nav a, .sidebar a, a[href]').allTextContents()
  console.log('Nav links found:', navLinks.map(t => t.trim()).filter(Boolean))

  const restockingLink = page.locator('a', { hasText: /restocking/i }).first()
  const linkExists = await restockingLink.count()
  console.log('Restocking link count:', linkExists)

  if (linkExists > 0) {
    const href = await restockingLink.getAttribute('href')
    console.log('Restocking link href:', href)
    await restockingLink.click()
    await page.waitForLoadState('networkidle')
    console.log('Clicked Restocking link. Current URL:', page.url())
  } else {
    console.log('No Restocking link found in nav. Navigating directly.')
    await page.goto('http://localhost:3000/restocking', { waitUntil: 'networkidle' })
  }

  // ── STEP 3: Restocking page checks ───────────────────────────────
  console.log('\n=== STEP 3: Restocking page checks ===')
  await page.waitForTimeout(1500) // give Vue time to render

  // Loading / error check
  const errorEl = await page.locator('.error').count()
  const loadingEl = await page.locator('.loading').count()
  console.log('Error element visible:', errorEl > 0)
  console.log('Loading element visible:', loadingEl > 0)

  // Budget slider
  const slider = page.locator('input[type="range"]')
  const sliderCount = await slider.count()
  console.log('Budget slider present:', sliderCount > 0)
  if (sliderCount > 0) {
    const min = await slider.getAttribute('min')
    const max = await slider.getAttribute('max')
    const val = await slider.inputValue()
    console.log(`Slider min=${min} max=${max} current=${val}`)
  }

  // Table rows
  const rows = page.locator('.restocking-table tbody tr')
  const rowCount = await rows.count()
  console.log('Table rows (items):', rowCount)
  if (rowCount > 0) {
    // Print first 3 rows
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      const rowText = await rows.nth(i).textContent()
      console.log(`  Row ${i+1}:`, rowText.replace(/\s+/g, ' ').trim())
    }
  }

  // Stat cards (3 cards)
  const statCards = page.locator('.stat-card')
  const statCount = await statCards.count()
  console.log('Stat card count:', statCount)
  for (let i = 0; i < statCount; i++) {
    const label = await statCards.nth(i).locator('.stat-label').textContent().catch(() => '?')
    const value = await statCards.nth(i).locator('.stat-value').textContent().catch(() => '?')
    console.log(`  Stat card ${i+1}: "${label.trim()}" = "${value.trim()}"`)
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-restocking-initial.png'), fullPage: true })
  console.log('Screenshot saved: 01-restocking-initial.png')

  // ── STEP 4: Move budget slider to ~50% ───────────────────────────
  console.log('\n=== STEP 4: Move budget slider to ~50% ===')
  if (sliderCount > 0) {
    const maxVal = parseFloat(await slider.getAttribute('max') || '0')
    const halfVal = Math.round(maxVal / 2 / 100) * 100 // round to nearest 100 (step=100)
    console.log(`Setting slider to ${halfVal} (50% of ${maxVal})`)
    await page.evaluate((val) => {
      const input = document.querySelector('input[type="range"]')
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, halfVal)
    await page.waitForTimeout(500)
    const newVal = await slider.inputValue()
    console.log('Slider new value after JS set:', newVal)
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-restocking-slider-50pct.png'), fullPage: true })
  console.log('Screenshot saved: 02-restocking-slider-50pct.png')

  // Check excluded rows
  const excludedRows = await page.locator('.row-excluded').count()
  const inBudgetBadges = await page.locator('.badge.success').count()
  const excludedBadges = await page.locator('.badge.neutral').count()
  console.log('Excluded rows (opacity 0.45):', excludedRows)
  console.log('"In Budget" badges:', inBudgetBadges)
  console.log('"Excluded" badges:', excludedBadges)

  // Stat cards after slider move
  const statCards2 = page.locator('.stat-card')
  for (let i = 0; i < await statCards2.count(); i++) {
    const label = await statCards2.nth(i).locator('.stat-label').textContent().catch(() => '?')
    const value = await statCards2.nth(i).locator('.stat-value').textContent().catch(() => '?')
    console.log(`  Stat card ${i+1} (after slider): "${label.trim()}" = "${value.trim()}"`)
  }

  // ── STEP 6: Click Place Order ─────────────────────────────────────
  console.log('\n=== STEP 6: Click Place Order button ===')
  const placeOrderBtn = page.locator('.place-order-btn, button:has-text("Place Order")')
  const btnCount = await placeOrderBtn.count()
  console.log('Place Order button count:', btnCount)
  if (btnCount > 0) {
    const btnText = await placeOrderBtn.first().textContent()
    const isDisabled = await placeOrderBtn.first().isDisabled()
    console.log('Button text:', btnText.trim())
    console.log('Button disabled:', isDisabled)
    if (!isDisabled) {
      await placeOrderBtn.first().click()
      await page.waitForTimeout(800)
    } else {
      console.log('Button is disabled (0 items in budget). Trying to restore full budget first.')
      // Restore slider to full to enable button, then click
      if (sliderCount > 0) {
        const maxVal = parseFloat(await slider.getAttribute('max') || '0')
        await page.evaluate((val) => {
          const input = document.querySelector('input[type="range"]')
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
          nativeInputValueSetter.call(input, val)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }, maxVal)
        await page.waitForTimeout(500)
        await placeOrderBtn.first().click()
        await page.waitForTimeout(800)
      }
    }
  }

  // ── STEP 7: Screenshot success state ─────────────────────────────
  const successBanner = await page.locator('.success-banner').count()
  const orderPlacedBtnText = await placeOrderBtn.first().textContent().catch(() => '')
  console.log('Success banner visible:', successBanner > 0)
  console.log('Button text after click:', orderPlacedBtnText.trim())
  if (successBanner > 0) {
    const bannerText = await page.locator('.success-banner').textContent()
    console.log('Success banner text:', bannerText.trim())
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-restocking-order-placed.png'), fullPage: true })
  console.log('Screenshot saved: 03-restocking-order-placed.png')

  // ── STEP 8: Navigate to /orders ───────────────────────────────────
  console.log('\n=== STEP 8: Navigate to /orders ===')
  await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  console.log('Current URL:', page.url())

  // ── STEP 9: Submitted Orders section ─────────────────────────────
  console.log('\n=== STEP 9: Submitted Orders section ===')
  const submittedSection = await page.locator('.submitted-orders-card').count()
  console.log('"Submitted Orders" card present:', submittedSection > 0)

  if (submittedSection > 0) {
    const cardHeaderText = await page.locator('.submitted-orders-card .card-header').textContent()
    console.log('Submitted Orders card header:', cardHeaderText.replace(/\s+/g, ' ').trim())
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-orders-submitted.png'), fullPage: true })
  console.log('Screenshot saved: 04-orders-submitted.png')

  // ── STEP 10: Verify order details ────────────────────────────────
  console.log('\n=== STEP 10: Verify order details ===')
  const rstRows = page.locator('tr:has(td:has-text("RST-"))')
  const rstRowCount = await rstRows.count()
  console.log('RST order rows found:', rstRowCount)

  if (rstRowCount > 0) {
    const firstRowText = await rstRows.first().textContent()
    console.log('First RST row text:', firstRowText.replace(/\s+/g, ' ').trim())

    // Check for RST- order number
    const orderNumEl = page.locator('.submitted-orders-card td strong')
    const orderNum = await orderNumEl.first().textContent().catch(() => '')
    console.log('Order number:', orderNum.trim())
    const startsWithRST = orderNum.trim().startsWith('RST-')
    console.log('Order number starts with RST-:', startsWithRST)

    // Check for 14 days lead time
    const allCellTexts = await page.locator('.submitted-orders-card td').allTextContents()
    const leadTimeCell = allCellTexts.find(t => t.includes('14'))
    console.log('Lead time "14 days" found in cells:', !!leadTimeCell, leadTimeCell ? `("${leadTimeCell.trim()}")` : '')

    // Check status
    const processingEl = page.locator('.submitted-orders-card td:has-text("Processing")')
    const processingCount = await processingEl.count()
    console.log('"Processing" status visible:', processingCount > 0)

    // Items count
    const itemsSummary = page.locator('.submitted-orders-card .items-summary')
    const itemsSummaryCount = await itemsSummary.count()
    if (itemsSummaryCount > 0) {
      const summaryText = await itemsSummary.first().textContent()
      console.log('Items summary text:', summaryText.trim())
    }
  } else {
    console.log('No RST- order rows found. The order may not have persisted (page navigation reset state).')
    // Check if there's any submitted orders card at all
    const allTableRows = await page.locator('.submitted-orders-card tbody tr').count()
    console.log('Submitted orders table rows:', allTableRows)
  }

  // ── Console errors summary ────────────────────────────────────────
  console.log('\n=== Console Errors Collected ===')
  if (consoleErrors.length === 0) {
    console.log('None')
  } else {
    consoleErrors.forEach((e, i) => console.log(`  Error ${i+1}:`, e))
  }

  await browser.close()
  console.log('\n=== Testing complete ===')
})()
