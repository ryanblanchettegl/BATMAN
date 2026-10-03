const { open, go, overflow, flash } = require('./helper');
(async () => {
  for (const mode of ['desk', 'phone']) {
    const { browser, page, errs } = await open({ mode, promo: null, file: process.env.EWF_OUT || 'index' });
    console.log(mode, 'title overflow:', await overflow(page) || 'none');
    await page.click('[data-t="scr"][data-v="select"]'); console.log(mode, 'select overflow:', await overflow(page) || 'none');
    await page.click('[data-t="pick"][data-v="OWN"]'); await page.fill('#fed-name', 'Test Fed'); console.log(mode, 'fed setup overflow:', await overflow(page) || 'none');
    await page.click('[data-t="unpick"]'); await page.click('[data-t="pick"][data-v="pdw"]'); await page.fill('#bname', 'Ryan'); await page.click('[data-t="begin"]');
    await page.waitForSelector('main.main'); console.log(mode, 'in game:', await page.$eval('.status', e => e.innerText.replace(/\n/g, ' ')));
    console.log(mode, 'errors:', errs.length ? errs : 'none');
    await browser.close();
  }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
