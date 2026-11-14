const { Telegraf, Markup } = require('telegraf');

// Твоят нов официален токен за бота t.me/letqshtio_stroy_bot
const TOKEN = '9233149050:AAFORg-gUlWQTEUkCIEGmMX8xwOf5cOy1oU';
const bot = new Telegraf(TOKEN);

// Памет за обекти, сайтове и целеви групи за авто-спам
let clientSites = [];
let targetGroups = []; 

// Строителният рекламен текст за ремонтните услуги на Mario Lom
const promoText = `🚨 ТЪРСИШ МАЙСТОР ЗА РЕМОНТ С ГАРАНЦИЯ? 🚨

👉 Декоративни мазилки и поръчкови VIP ремонти!
👉 Боядисване и перфектна шпакловка!
🏆 13 ГОДИНИ опит в бранша!

🎁 БЕЗПЛАТЕН оглед и оферта за твоя обект!
📍 Работим в София, Перник и региона.

🧱🔨 VIP СТРОИТЕЛНИ УСЛУГИ И ЛУКСОЗНИ РЕМОНТИ!
✨ Декоративни мазилки, луксозни ремонти, боядисване и прецизна шпакловка!
✅ 13 години реален стаж, безплатен оглед и оферта на място!

📞 Връзка с нас (Телефон / Viber): +359883200460
Пиши или звъни още днес! 🚀`;

let waitingForSite = {};

// Главна команда /start с интерактивно Меню
bot.start((ctx) => {
    const userId = ctx.from.id;
    console.log(`[КОНЗОЛА] Потребител ${userId} стартира строителния бот.`);

    ctx.reply(
        `🤖 **VIP Строителен Бот - Мениджър**\n\nИзбери опция от менюто по-долу:`,
        Markup.keyboard([
            ['🌐 Добави сайт / обект', '📊 Статус и Отчет'],
            ['🚀 Пусни Реклама Сега', '⚙️ Настройки за Авто-Спам']
        ]).resize()
    );
});

bot.hears('🌐 Добави сайт / обект', (ctx) => {
    waitingForSite[ctx.from.id] = true;
    ctx.reply('✍️ Моля, изпрати линка на новия сайт или описанието на обекта, който искаш да добавиш към портфолиото.');
});

bot.hears('📊 Статус и Отчет', (ctx) => {
    const report = `📊 **ПОСТОЯНЕН ОТЧЕТ НА БОТА:**\n` +
                   `- Добавени сайтове/обекти: ${clientSites.length}\n` +
                   `- Целеви групи за спам: ${targetGroups.length}\n` +
                   `- Автоматични публикации дневно: 3 пъти на ден (на всеки 8 часа)\n` +
                   `- Статус на промоцията: 🟢 АКТИВНА И РАБОТЕЩА`;
    
    console.log(`[КОНЗОЛА ОТЧЕТ] Заявка за отчет от ${ctx.from.id}. Обекти: ${clientSites.length}`);
    ctx.reply(report, { parse_mode: 'Markdown' });
});

bot.hears('🚀 Пусни Реклама Сега', async (ctx) => {
    ctx.reply('🚀 Изпращам рекламата към всички запазени групи и чатове...');
    console.log(`[КОНЗОЛА] Ръчно стартиране на рекламна кампания от ${ctx.from.id}`);

    let sent = 0;
    const targets = [...new Set([...targetGroups, ctx.chat.id])];
    for (const target of targets) {
        try {
            await bot.telegram.sendMessage(target, promoText);
            sent++;
        } catch (e) {
            console.log(`[ГРЕШКА ПРИ СПАМ] Неуспешно пращане към ${target}: ${e.message}`);
        }
    }
    ctx.reply(`✅ Рекламата беше разпространена успешно до ${sent} цели!`);
});

bot.hears('⚙️ Настройки за Авто-Спам', (ctx) => {
    ctx.reply(`⚙️ **Автоматичен режим (24/7):**\n` +
              `Ботът е настроен да пуска автоматично рекламата **3 пъти на ден** в добавените групи.\n` +
              `За да добавиш група в списъка за авто-спам, добави бота като администратор в желаната Telegram група и напиши командата \`/addgroup\`.`);
});

bot.command('addgroup', (ctx) => {
    const chatId = ctx.chat.id;
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        if (!targetGroups.includes(chatId)) {
            targetGroups.push(chatId);
            console.log(`[КОНЗОЛА] Нова група добавена за авто-спам: ${chatId} (${ctx.chat.title})`);
            ctx.reply(`✅ Тази група беше добавена успешно към списъка за автоматично споделяне (3 пъти дневно)!`);
        } else {
            ctx.reply(`ℹ️ Тази група вече е в списъка.`);
        }
    } else {
        ctx.reply(`⚠️ Тази команда се използва вътре в самите Telegram групи, където искаш да се спами!`);
    }
});

bot.on('text', (ctx, next) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    if (waitingForSite[userId]) {
        clientSites.push(text);
        waitingForSite[userId] = false;
        console.log(`[КОНЗОЛА] Добавен нов сайт/обект: ${text}`);
        return ctx.reply(`✅ Успешно добавен нов сайт/обект в портфолиото:\n${text}\n\nМожеш да видиш общия брой през менюто "Статус и Отчет".`);
    }
    return next();
});

// Таймер за автоматично пращане 3 пъти на ден (на всеки 8 часа)
const INTERVAL_8_HOURS = 8 * 60 * 60 * 1000; 

setInterval(async () => {
    console.log(`[АВТО-СПАМ 24/7] Стартиране на автоматично споделяне към ${targetGroups.length} групи...`);
    
    for (const groupChatId of targetGroups) {
        try {
            await bot.telegram.sendMessage(groupChatId, `🔔 [АВТОМАТИЧНА ПУБЛИКАЦИЯ]\n\n` + promoText);
            console.log(`[УСПЕХ] Автоматично изпратено в група ID: ${groupChatId}`);
        } catch (err) {
            console.log(`[ГРЕШКА АВТО-СПАМ] Неуспешно пращане в група ${groupChatId}: ${err.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}, INTERVAL_8_HOURS);

bot.launch();
console.log('🚀 VIP Строителният Бот (t.me/letqshtio_stroy_bot) е напълно стартиран!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
