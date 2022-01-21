import DiscordJS, { Intents, MessageEmbed, TextChannel } from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()

// i probably shouldn't keep everything in a single index.ts file lol. i'll fix this later

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

let scoreboard: any = {};
let config: any = {};


client.on('ready', () => {
    loadConfigFromFile();
    loadScoreBoardFromFile();
})

const loadConfigFromFile = () => {
    const fs = require('fs');
    const path = 'config.json';

    if (fs.existsSync(path)) {
        //file exists
        fs.readFile(path, (err: any, data: any) => {
            console.log('Config found - loading into memory');
            if (err) {
                throw err;
            }
            config = JSON.parse(data.toString());
            console.log(config);

            // if no timezone, set default to LA
            if (!config.timezone) {
                config.timezone = 'America/Los_Angeles'
                writeConfigToFile();
            }

            // if a channel id is present in config, start scheduler for midnight notification in channel
            if (config.channelid) {
                client.channels.fetch(config.channelid);
                setNotificationSchedule();
            }
        });
    } else {
        console.log('No config found - creating blank config');
        writeConfigToFile();
    }
}

const writeConfigToFile = () => {
    const fs = require('fs');
    const path = 'config.json';

    fs.writeFile(path, JSON.stringify(config), (err: any) => {
        if (err) {
            throw err;
        }
        console.log('Config written to file')
    })
}

const loadScoreBoardFromFile = () => {
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
            for (const id in scoreboard) {
                client.users.fetch(id)
            }
            console.log('Bot Ready!')
        });
    } else {
        console.log('No scoreboard found - creating blank scoreboard');
        writeScoreBoardToFile();
    }
}

const writeScoreBoardToFile = () => {
    const fs = require('fs');
    const path = 'score.json';

    fs.writeFile(path, JSON.stringify(scoreboard), (err: any) => {
        if (err) {
            throw err;
        }
        console.log('Scoreboard written to file')
    })
}

const updateScoreBoardScore = (userid: any, points: number, increment: boolean) => {

    // create a new scoreboard entry
    if (!scoreboard[userid]) {
        scoreboard[userid] = []

        scoreboard[userid][0] = points;
        scoreboard[userid][1] = 1;
    } else {
        scoreboard[userid][0] += points;
        if (increment)
            scoreboard[userid][1]++;
    }

    writeScoreBoardToFile();

    return scoreboard[userid];
}

const setScoreBoardAttempts = (userid: any, attempts: number) => {
    scoreboard[userid][1] = attempts;
    writeScoreBoardToFile();
    return scoreboard[userid];
}

const setNotificationChannel = (channelid: any) => {
    if (channelid) {
        config.channelid = channelid;
    } else {
        delete config.channelid;
    }
    writeConfigToFile();
}

const setNotificationTimezone = (timezone: any) => {
    if (timezone) {
        config.timezone = timezone;
    } else {
        config.timezone = 'America/Los_Angeles';
    }
    writeConfigToFile();
}

const setNotificationSchedule = () => {
    // midnight post temp
    const schedule = require('node-schedule');
    const rule = new schedule.RecurrenceRule();
    rule.hour = 0;
    rule.minute = 0;
    rule.tz = config.timezone;


    const job = schedule.scheduleJob(rule, function () {

        if (config.channelid) {
            const dailyEmbed = generateScoreBoardEmbed('NEW WORDLE CHALLENGE');
            (client.channels.cache.get(config.channelid) as TextChannel).send({ content: dailyEmbed.userListEmbed.replace(/\n/g, ' ') });
            (client.channels.cache.get(config.channelid) as TextChannel).send({ embeds: [dailyEmbed.embed] });
        }
    });

    console.log(`Bot schedule to send message at ${rule.hour}:${rule.minute} ${rule.tz}`);
}



const generateScoreBoardEmbed = (title: string) => {

    // sort results
    let scoreArray = []
    for (const key in scoreboard) {
        scoreArray.push([key, scoreboard[key][0]]);
    }
    scoreArray = scoreArray.sort(sort2d);

    let userListEmbed = '';
    let scoreListEmbed = '';
    let averageListEmbed = '';
    let attemptsListEmbed = '';
    let allPlayersList = [];

    let topPlayersList = [];
    let topScoreCount = 0;
    let topScore = -1;
    let maxTopPlayers = 1;
    for (const entry of scoreArray) {
        userListEmbed += `${client.users.cache.get(entry[0])}\n`;

        // get top 3 places
        if (topScoreCount < maxTopPlayers) {
            if (topScore == -1) {
                topScore = entry[1];
                topPlayersList.push(client.users.cache.get(entry[0]));
            } else if (parseInt(entry[1]) == topScore) {
                topPlayersList.push(client.users.cache.get(entry[0]));
            }
            else if (parseInt(entry[1]) != topScore) {
                topScore = entry[1];
                topScoreCount++;
                if (topScoreCount < maxTopPlayers) {
                    topPlayersList.push(client.users.cache.get(entry[0]));
                }
            }
        }
        allPlayersList.push(entry[0]);

        scoreListEmbed += `${entry[1]}\n`;
        attemptsListEmbed += `${scoreboard[entry[0]][1]}\n`;
        let avg = Math.abs((parseFloat(entry[1]) / parseFloat(scoreboard[entry[0]][1])) - 7).toFixed(1);
        // averageListEmbed += `${(parseFloat(entry[1]) / parseFloat(scoreboard[entry[0]][1])).toFixed(2)}\n`;
        averageListEmbed += `${avg.replace('.0', '')}/6\n`;

    }


    const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`:green_square: :green_square: :green_square: ${title} :green_square: :green_square: :green_square:`)
        .setURL('https://www.powerlanguage.co.uk/wordle/')
        .setDescription('https://www.powerlanguage.co.uk/wordle/')
        .addFields(
            { name: 'User', value: userListEmbed, inline: true },
            { name: 'Score', value: scoreListEmbed, inline: true },
            { name: 'Avg', value: averageListEmbed, inline: true }
        );

    return {
        embed: embed,
        userListEmbed: userListEmbed,
        topPlayersList: topPlayersList,
        allPlayersList: allPlayersList
    };
}

const setChampRoles = () => {
    // const scoreBoardEmbed = generateScoreBoardEmbed('');
    // const topPlayersList = scoreBoardEmbed.topPlayersList;
    // const allPlayersList = scoreBoardEmbed.allPlayersList;

    // let role = client.guilds.cache.get()

    // for (const player of allPlayersList) {
    //     console.log(player);
    //     client.guilds
    // }

    // console.log(topPlayersList);
}

client.on('messageCreate', (message) => {

    // Check if admin
    const isAdmin = message.member?.permissions.has("ADMINISTRATOR");

    // Check for Wordle Score
    const wordleRegex = /Wordle \d{3} ([\dX])\/6\*?\n{0,2}[⬛🟩🟨⬜🟧🟦]{5}/;
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

        const updatedScore = updateScoreBoardScore(message.author.id, wordleScore, true);

        // reply with score
        message.reply({
            content: `${wordleScore} points for ${message.author} (${updatedScore[0]} total pts, ${updatedScore[1]} attempts)`
        })

    }

    // leaderboard command
    if (message.content === '!w scores') {
        const leaderboardEmbed = generateScoreBoardEmbed('LEADERBOARD');
        message.channel.send({ embeds: [leaderboardEmbed.embed] });
    }

    // fun LOTR stories
    if (message.content === '!w story') {
        const randomQuote = require('random-lotr-movie-quote');
        // console.log(randomQuote());
        message.channel.send({ content: `${randomQuote().char}: ${randomQuote().dialog}` });
        message.delete();
    }


    // admin commands 
    if (isAdmin) {

        // just debug stuff
        if (message.content === '!w debug') {

            const exampleEmbed = generateScoreBoardEmbed('NEW WORDLE CHALLENGE');
            message.channel.send({ content: exampleEmbed.userListEmbed.replace(/\n/g, ' ') });
            message.channel.send({ embeds: [exampleEmbed.embed] });

            setChampRoles();
        }

        // manual update score
        if (message.content.includes('!w x')) {
            const updateRegex = /!(\d+)> *([+-]\d+)/
            const updateParse = message.content.match(updateRegex);

            if (updateParse) {
                console.log(updateParse);
                const userid = updateParse[1];
                const score = parseInt(updateParse[2]);
                const updatedScore = updateScoreBoardScore(userid, score, false);

                // reply with score
                message.channel.send({
                    content: `[Admin] ${score} points for ${client.users.cache.get(userid)} (${updatedScore[0]} total pts, ${updatedScore[1]} attempts)`
                })
            }
        }

        // manual attempt set
        if (message.content.includes('!w attempts')) {
            console.log(message.content);
            const updateRegex = /!(\d+)> *(\d+)/
            const updateParse = message.content.match(updateRegex);

            if (updateParse) {
                console.log(updateParse);
                const userid = updateParse[1];
                const attempts = parseInt(updateParse[2]);
                const updatedAttempts = setScoreBoardAttempts(userid, attempts);

                // reply with score
                message.channel.send({
                    content: `[Admin] Set ${attempts} attempts for ${client.users.cache.get(userid)} (${updatedAttempts[0]} total pts, ${updatedAttempts[1]} attempts)`
                })
            }
        }

        // configure wordle channel
        if (message.content.includes('!w channel')) {
            console.log(message.content);
            const channelRegex = /#(\d+)/;
            const channelParse = message.content.match(channelRegex);

            if (channelParse) {
                const channelid = channelParse[1];
                setNotificationChannel(channelid);
                message.reply({
                    content: `[Config] Wordle channel set to ${client.channels.cache.get(channelid)}`
                })
            } else if (message.content.includes('remove')) {
                setNotificationChannel(null);
                message.reply({
                    content: `[Config] Wordle channel removed`
                })
            }

            // todo print error if no channel provided
        }

        // configure timezone
        if (message.content.includes('!w tz')) {
            console.log(message.content);
            const tzRegex = /tz (.+)/;
            const tzParse = message.content.match(tzRegex);

            console.log(tzParse);

            if (tzParse) {
                const tz = tzParse[1];
                if (tz == 'remove') {
                    setNotificationTimezone(null);
                    message.reply({
                        content: `[Config] Wordle timezone reset to ${config.timezone}`
                    })
                } else {
                    setNotificationTimezone(tz);
                    message.reply({
                        content: `[Config] Wordle timezone set to ${tz}`
                    })
                }
            }

            // todo print error if no valid tz provided
        }

        // TODO create command to designate a wordle champ role
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
