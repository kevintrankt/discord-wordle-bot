import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()

// https://discord.com/api/oauth2/authorize?client_id=928012714025042001&permissions=8&scope=bot%20applications.commands

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

let scoreboard: any = {};

client.on('ready', () => {
    loadScoreBoard();
})

const loadScoreBoard = () => {
    const fs = require('fs');
    const path = 'score.json';

    if (fs.existsSync(path)) {
        //file exists
        fs.readFile(path, (err: any, data: any) => {
            console.log('Scoreboard found - loading into memory');
            if (err) {
                throw err;
            }
            scoreboard = JSON.parse(data.toString());
            console.log(scoreboard);
            console.log('Bot Ready!')
        });
    } else {
        console.log('No scoreboard found - creating blank scoreboard');
        writeScoreBoard();
    }
}

const writeScoreBoard = () => {
    const fs = require('fs');
    const path = 'score.json';

    fs.writeFile(path, JSON.stringify(scoreboard), (err: any) => {
        if (err) {
            throw err;
        }
        console.log('Scoreboard written to file')
    })
}

const updateScoreBoard = (user: any, points: number) => {

    // create a new scoreboard entry
    if (!scoreboard[user.username]) {
        scoreboard[user.username] = points;
    } else {
        scoreboard[user.username] += points;
    }

    writeScoreBoard();

    return scoreboard[user.username];
}

client.on('messageCreate', (message) => {

    // Check for Wordle Score
    const wordleRegex = /Wordle \d{3} ([\dX])\/6\n{0,2}[⬛🟩🟨⬜]{5}/;
    const wordleMessage = message.content.match(wordleRegex);

    if (wordleMessage) {
        console.log(wordleMessage);
        console.log(message.author);
        // Check if X/6
        let wordleScore;

        if (wordleMessage[1] == 'X') {
            wordleScore = 0;
        } else {
            wordleScore = 7 - parseInt(wordleMessage[1]);
        }

        const updatedScore = updateScoreBoard(message.author, wordleScore);

        // reply with score
        message.reply({
            content: `${wordleScore} points for ${message.author} (${updatedScore} total points)`
        })

    }

    // leaderboard command
    if (message.content === '!w scores') {
        let testUser = message.guild?.members.cache.get('572204153674137600');

        // sort results
        let scoreArray = []
        for (const key in scoreboard) {
            scoreArray.push([key, scoreboard[key]]);
        }
        scoreArray = scoreArray.sort(sort2d);

        // generate reply
        let scoreReply = '';
        for (const entry of scoreArray) {
            scoreReply += `${entry[0]}: ${entry[1]}\n`
        }

        message.reply({
            content: `${scoreReply}`
        })
    }
})

const sort2d = (a: any, b: any) => {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? 1 : -1;
    }
}

client.login(process.env.TOKEN);