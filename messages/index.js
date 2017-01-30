"use strict";

//var builder = require("botbuilder");
global.builder = require('botbuilder');
global.lodash = require('lodash');
var botbuilder_azure = require("botbuilder-azure");
var request = require('request');
var winston = require('winston');
var path = require('path');
var utilfunctions = require('./utilfunctions');
var getCars = require('./getcars');
var template = require('./templates');
var data = require("./data.json");

var filename = path.join(__dirname, 'somefile.log');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: filename })
    ]
  });

logger.log('info', 'check if file is working or not');


//a middleware to check the overall request and response time difference including network latency and node modules etc.
// var middle_func=function(req, res, next ){
//     var startTime = process.hrtime();
//     var end = res.end;
//     var ended = false;

//     res.end = function(chunk, encoding) {
//         if(ended) {
//             return;
//         }
//         ended = true;
//         end.call(this, chunk, encoding);

//         var diff = process.hrtime(startTime);
//         var responseTime = (diff[0] * 1e9 + diff[1]) / 1e6;
//         console.log('Performance time for sending response including node processing time and luis call time %d ms', responseTime);
//         logger.log('info', 'Performance time for sending response including node processing time and luis call time %d ms',responseTime);
//     };
//     var c = connector.listen();
//     c(req,res);
// });


var useEmulator = (process.env.NODE_ENV == 'development');
//slogger.log('info',"data", JSON.stringify(process.env));




var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

var context = {};
var conversation;

bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));
// bot.use(builder.Middleware.firstRun({version: 1.0, dialogId: '*:/firstRun' }));
bot.use(builder.Middleware.sendTyping());
bot.set("autoBatchDelay",0);


//========================================
//Facebook Thread Settings
//========================================

utilfunctions.facebook_thread_setting.greeting('Hello!  I will help you find the best car for you.');
utilfunctions.facebook_thread_setting.get_started('Hello');
utilfunctions.facebook_thread_setting.menu([{
    "type": "postback",
    "title": "Explore Categories",
    "payload": "categories"
}, {
    "type": "postback",
    "title": "Find my match",
    "payload": "Find my match"
}, {
    "type": "web_url",
    "title": "Toyota Website",
    "url": "http://www.toyota.com/"
}, ]);

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });


//==========================================================
//Bot events
//==========================================================


//sending greetings mesage when bot is added to convrsation
bot.on('conversationUpdate', function (message) {
    console.log("---------Bot is first added to conversation---------");
    logger.log('info',"Bot is first added to conversation");
    

});

bot.on('contactRelationUpdate', function (message) {
    console.log("---------conversation conversationUpdate---------");
    logger.log('info',"conversation conversationUpdate");
    console.log(message);
});
bot.on('receive', function (message) {
    if(global.startTimeLuis >0){global.startTimeLuis=0;}
     global.startTimeLuis = process.hrtime();
    
    console.log("---------receive---------");
    logger.log('info',"Receive event fired");
    logger.log('info',"Receive message",JSON.stringify(message));
    if(typeof message.type!=='undefined' && message.type==='message'){
        logger.log('info',"Receive event fired");
        logger.log('info',"Receive event fired @ ",JSON.stringify(new Date().getTime()));
    }
    console.log(message);
});
bot.on('send', function (message) {
    console.log("---------send---------");
    logger.log('info',"Send event fired");
    logger.log('info',"Send message",JSON.stringify(message));
    var diff = process.hrtime(global.startTimeLuis );
    var luisResponseTime = (diff[0] * 1e9 + diff[1]) / 1e6;
    logger.log('info',"Response time from Luis including network latency is %d s %s",diff[0],message.type);
    

    console.log(message);
    if(typeof message.type!=='undefined' && message.type==="message"){
        logger.log('info',"Send event fired");
        logger.log('info',"send event fired @ ",JSON.stringify(new Date().getTime()));
    }
});

//=========================================================
// Bots Dialogs
//=========================================================

//const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/de69bc89-856d-446b-85ac-03adb848a2a4?subscription-key=1a1df6e10ac446d5b596d993bca258ae&verbose=true';
// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(process.env.LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('Greeting',[
        function(session,args,next){
            session.send('Hello');
            //session.endDialog();

            var btArr = ['Yes','May be later'];
            var title = "I'm here to help you find your perfect Toyota. Ready to get started?"
            var msgAttachment = template.buttontemplate(session, btArr, title);
            var msg = new builder.Message(session)
                .attachments([msgAttachment]);

            session.send(msg);
            session.endDialog();

        }
    ])
    .matches('Yes',[
        function(session,args,next){
            session.send("We'll start with an easy one.");
           //session.endDialog();
            session.send("Where are you headed?");

            var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(lodash.invokeMap(data['mainCategory']['button'],template.genericTemplate,session));

            session.send(msg);
            session.endDialog();
        }
    ])
    .matches('may_be_later',[
        function (session,args,next) {
            session.send("Sounds good! Check back when you're ready to dive in.");
            session.send("Cool. Chat with you soon");
            session.endDialog();
        }
    ])
    .matches('off_to_work',[
        function(session,args,next){
            session.send("Ok, time to find a way to get you there!");
            session.send("How do you plan to use your vehicle?");

            var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(lodash.invokeMap(data['off_to_work']['button'],template.genericTemplate,session));

            session.send(msg);

            session.endDialog();

        }
    ])
    .matches('commuting_to_work',[
        function(session,args,next){
            session.send("Let's make it an enjoyable drive.");
            session.send("Where are you headed every day?");

            var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(lodash.invokeMap(data['commute_to_work']['button'],template.genericTemplate,session));

            session.send(msg);
            session.endDialog();

        }
    ])
    .matches('going_to_the_office',[
        function(session,args,next){
            session.send("Perfect! Let's get you to work");
            session.send("So what's most important about making your trip?");

            var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(lodash.invokeMap(data['going_to_the_office']['button'],template.genericTemplate,session));

            session.send(msg);
            session.endDialog();
        }
    ])
    .matches('being_comfortable',[
        function(session,args,next){
            session.send("For getting to work in comfort, I'd recommend");
            
            var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(lodash.invokeMap(data['being_comfortable']['button'],template.multiButtonGenericTemplate,session));

            session.send(msg);
            session.endDialog();
        }
    ])
    //.matches('Help', builder.DialogAction.send('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\''))
    .onDefault((session) => {
        session.send("I'm sorry, I didn't understand that.");
        session.send("Could you choose from one of the available responses?");
        session.endDialog();
    });

bot.dialog('/', intents);



if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default:  connector.listen()}
}
