//Import playwright library
import { chromium, devices } from 'playwright';
//Import assert
import 'node:assert';


//emulate a mobile device
const Pixel7 = devices['Pixel 7'];

//Create a function to test the website
async function bot() {
    //Create a browser
    const browser = await chromium.launch({
        headless: false
    });
    const context = await browser.newContext({
        ...Pixel7,
    });
    const page = await context.newPage();
    //Go to the website
    loop(page);
}

async function loop(page) {
    await page.goto('https://www.cinenerdle2.app/battle');
    await page.getByText('FIND GAME').click();
    // await expect(page.locator('.battle-searching.container')).toHaveCount(0);
    const startingMovie = await page.locator('.choose-ban-text .now-playing-text').innerText();
    console.log(startingMovie);
}

bot();