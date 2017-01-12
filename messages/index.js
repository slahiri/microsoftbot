"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var watson = require('watson-developer-cloud');
var request = require('request');
var winston = require('winston');
 var path = require('path');

var filename = path.join(__dirname, 'somefile.log');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: filename })
    ]
  });

logger.log('info', 'check if file is working or not');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

const workspace_id = 'c8b97c89-ea70-4208-a868-05659609705e';
var context = {};
var conversation;

bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));
bot.use(builder.Middleware.firstRun({version: 1.0, dialogId: '*:/firstRun' }));
bot.use(builder.Middleware.sendTyping());

var requestdata=require('./persistent-menu.json');
console.log(requestdata);
request({
    url:'https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAACZCubvsNZCEBANkGEyfJZCF4WRWoFcsILLjJNFNDkBxFaTVIEJ1y5ZB2ZARGDZCpluv6nXVwEXSd8NAwcJlcm0SgX3sedOZAgbKdXGiWe5jQvLAY7BIKZBfZCCWGx3H3tC0GwcSw1chT4vQRlrxT1YMhEVRPi9gn1joNmK4KK9hBwZDZD',
    method:"POST",
    json:true,
    headers: {
        "content-type": "application/json",
    },
    body: requestdata
}, function(err,res,body){
    //console.log(err);
    //ssconsole.log(res);
    console.log(body);
});

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog("/firstRun",[function(session){
    console.log("---first run message--");
    session.send("HI i m bot to select your car");
    session.endDialog();
    next();
}]);
bot.dialog('/',[
    function(session){
        console.log(typeof session.message.text);
        console.log(session.userData);
        if(typeof session.message.text !='undefined'){console.log("---");console.log(session.message.text);}
        if(typeof session.message.text=='undefined' || session.message.text=='' || session.message.text==null)
        {
            session.send("Hi... I'm the Microsoft Bot Framework demo bot for Facebook. I can show you everything you can use our Bot Builder SDK to do on Facebook.");
            //session.endDialog();
            next();
        }else
        {
        	logger.log('info', 'conversation api calling');
            if(!conversation)
            {
                conversation = watson.conversation({
                    username: 'c725ffde-2e55-4de5-9b8e-d906a5e87690',
                    password: '4pYI2ggJyeVP',
                    version_date: '2016-09-20',
                    version: 'v1'
                });
            }
            
            
            //var conversation = watson.conversation({
            //    username: 'ade4d4aa-2f93-47e2-9435-2dd4ec9beb80',
            //    password: 'GHHpOGwKN8Sw',
             //   version_date: '2016-09-20',
            //    version: 'v1'
            //});
            session.userData.context.layout = '';
            session.userData.context.buttons = '';
            conversation.message({
                workspace_id:workspace_id,
                input:{'text':((typeof session.message.text!='undefined')?session.message.text:'')},
                context:((typeof session.userData.context!='undefined' && session.userData.context!='' )?session.userData.context:{})
            },function(err, response){
                if(err){
                    logger.log('info', '----------conversation err reply----');
                    logger.log('info',JSON.stringify(err, null, 2));
                    console.log(JSON.stringify(err));
                    session.send("Hi ..cannot be started");
                }
                console.log("-----------------respose-------------");
                console.log(response);
                logger.log('info', '----------conversation reply----');
                logger.log('info',SON.stringify(response, null, 2));
                //console.log(JSON.stringify(response, null, 2));
                //session.send(response.output.text.join('\n'));
                response.output.text.forEach(function(ele){
                     session.send(ele);
                });
                
                if(typeof response.context.layout!='undefined' && response.context.layout!='')
                {
                    console.log("layout==="+response.context.layout);
                    if(response.context.layout=='button'){
                        session.beginDialog('/btnTemp',response);
                    }
                    else if(response.context.layout=='quick_replies'){
                        session.beginDialog('/quickreplies',response);
                    }
                    else if(response.context.layout=='generic'){
                        session.beginDialog('/genericTemp',response);
                    }
                }                               
                session.userData.context = response.context;
               
            });
        }
    }
]);

bot.dialog('/quickreplies',[
    function(session,args,next){
        console.log(session);console.log("------quickreplies----------");
        console.log(args);
        builder.Prompts.choice(session,"Select options",args.context.buttons);
       
    },
    function (session, result) {
        if(result.response)
        {
            session.beginDialog('/');
        }
        
        
    },
   
]);

bot.dialog('/btnTemp',[
    function(session,args,next){
        console.log(session);console.log("------button----------");
        console.log(args);
        //builder.Prompts.choice(session,"Select options",args.context.buttons);
        var msgAttachment=[];
        var choiceStr='';
        if(typeof args!='undefined' && args!=''){
            args.context.buttons.forEach(function(ele){
                console.log(ele);
                var attachment = new builder.HeroCard(session)
                                    .title(args.output.text.join('\n'))
                                    .buttons(builder.CardAction.imBack(session, ele,ele));
                               
                msgAttachment.push(attachment);
                choiceStr+=ele+"|";
             });
             choiceStr=choiceStr.substr(0,(choiceStr.length-1));
             var msg = new builder.Message(session)
            .attachments(msgAttachment);
            session.send(msg);
        }     
       
    },
    function (session, result) {
        if(result.response)
        {
            session.beginDialog('/');
        }
        
        
    },
   
]);
bot.dialog('/genericTemp',[
    function(session,args,next){
        console.log(session);console.log("------button----------");
        console.log(args);
        
        var attachmentArr =[];
        var choiceStr='';
        if(typeof args.context.buttons!='undefined' && args.context.buttons!='')
        {
           args.context.buttons.forEach(function(ele){
               var obj = new builder.HeroCard(session)
                        .images([
                            builder.CardImage.create(session, "https://botkit-facebook.mybluemix.net/images/"+ele+".jpg")
                        ])
                        .buttons([
                            //builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
                            builder.CardAction.imBack(session, ele, ele)
                        ]);
                attachmentArr.push(obj);
                choiceStr+=ele+"|";
               
           }) ;
           choiceStr=choiceStr.substr(0,(choiceStr.length-1));
            
        }
        var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(attachmentArr);
        builder.Prompts.choice(session, msg, choiceStr);
    },
    function (session, results) {
        /*var action, item;
        var kvPair = results.response.entity.split('|');
        switch (kvPair[0]) {
            case 'select':
                action = 'selected';
                break;
        }
        switch (kvPair[1]) {
            case '100':
                item = "the Space Needle";
                break;
            case '101':
                item = "Pikes Place Market";
                break;
            case '102':
                item = "the EMP Museum";
                break;
        }*/
        session.beginDialog('/');
    }
    
   
]);

// bot.dialog('/', function (session) {
//     session.send('You said ' + session.message.text);
// });

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
