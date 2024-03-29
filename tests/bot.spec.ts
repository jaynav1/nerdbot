import { test, expect } from '@playwright/test';
import { nextTurn, getPersonId } from '../services/tmdb';

test.use({
    viewport: { width: 1920, height: 1080 },
});
test.setTimeout(1800000)

test('bot', async ({ page, context }) => {
    //find game
    await page.goto('https://www.cinenerdle2.app/battle');
    await page.getByText('FIND GAME').click();
    
    //test with friend
    //await page.goto('https://www.cinenerdle2.app/battle?gameid=71-NDZ91D43');
    //await page.getByText('ACCEPT CHALLENGE?').click();

    await expect(page.locator('.battle-searching-container')).not.toBeVisible({ timeout: 40000 });
    await page.getByText('READY').click();
    await expect.soft(page.locator('.battle-board')).toBeVisible({ timeout: 35000 });

    //array of strings
    let movieList: string[] = [];
    let personDictionary: { [key: number]: number; } = {};
    let bannedPeople: number[] = [];
    
    //game loop
    for (let i = 0; i < 1000; i++) {
        const movie = await page.locator('.battle-movie').first();

        if (await movie.locator('.battle-board-game-over').nth(0).isVisible()) {
            console.log('Game over');
            break;
        }
        
        const movieName = (await movie.locator('.battle-board-movie').innerText()).split('\n').pop();
        console.log(movieName);
        movieList.push(movieName);

        // if (await movie.locator('.battle-board-connections').isVisible()) {

        //     await movie.locator('.battle-board-connection').last().click();

        //     const links = await movie.locator('.connection-name')
        //     if (await links.count() > 3) {
        //         for (let i = 3; i < await links.count(); i++) {
        //             const linkName = await links.nth(i).innerText();
        //             //console.log(linkName);

        //         }
        //     } else {
        //         for (let i = 0; i < await links.count(); i++) {
        //             const linkName = await links.nth(i).innerText();
        //             //console.log(linkName);
        //         }
        //     }
        // }

        if (await movie.locator('.battle-board-connections').isVisible()) {
            await movie.locator('.battle-board-connection').last().click();
            const links = await movie.locator('.connection-name')
            if (await links.count() > 3) { var linkOffset = 3; } else { var linkOffset = 0; }
            for (let i = linkOffset; i < await links.count(); i++) {
                const linkName = await links.nth(i).innerText();
                const personID = await getPersonId(linkName);
                if (personDictionary[personID]) {
                    personDictionary[personID]++;
                    if (personDictionary[personID] === 3) {
                        bannedPeople.push(personID);
                    }
                } else {
                    personDictionary[personID] = 1;
                }
            }
        }

        const relatedMovies = await nextTurn(movieName, bannedPeople, movieList, 2);
        if (await page.locator('.opponents-turn').isVisible()) {
            await expect.soft(page.locator('.opponents-turn')).not.toBeVisible({ timeout: 20000 });
        } else {
            
            while (await page.locator('.battle-board-submit').isVisible()) {

                await page.waitForTimeout(Math.random() * 1500 + 1500);
                var randomMovie = relatedMovies[Math.floor(Math.random() * relatedMovies.length)];

                movieList.push(randomMovie);
                await page.getByPlaceholder('SUBMIT MOVIE').pressSequentially(randomMovie, { delay: Math.random() * 50 + 50});
                if (Math.random() > 0.5) {
                    await page.waitForTimeout(Math.random() * 1000 + 500);
                    await page.locator('.battle-board-submit').click();
                } else {
                    await page.keyboard.press('Enter');
                }
                await page.waitForTimeout(1500);
            }
        }
    }
});

test('search movie', async () => {
    //const movie = await searchMovie('Madame Web (2024)');
    //console.log(movie);
    
    //const credits = await getMovieCredits(movie.id);
    
    //const relatedMovies = await getAllRelatedMovies(credits);

    const relatedMovies = await nextTurn('Madame Web (2024)', [], [], 2);
    console.log(relatedMovies);
});
