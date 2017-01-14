"use strict";

require('dotenv').load();
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var watson = require('watson-developer-cloud');
var request = require('request');
var winston = require('winston');
 var path = require('path');
 var utilfunctions = require('./utilfunctions');
 var getCars = require('./getcars');

var filename = path.join(__dirname, 'somefile.log');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: filename })
    ]
  });

logger.log('info', 'check if file is working or not');

var useEmulator = (process.env.NODE_ENV == 'development');
logger.log('info',"data", JSON.stringify(process.env));
logger.log('info', 'appId',process.env['MicrosoftAppId']);
logger.log('info', 'appPassword',process.env['MicrosoftAppPassword']);
logger.log('info', 'stateEndpoint',process.env['BotStateEndpoint']);
logger.log('info', 'openIdMetadata',process.env['BotOpenIdMetadata']);

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

//=========================================================
// Bots Dialogs
//=========================================================


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
            logger.log('info',"conversion object");
            if(!conversation)
            {
                 conversation = watson.conversation({
                    username: process.env['CONVERSATION_USERNAME'],
                    password: process.env['CONVERSATION_PASSWORD'],
                    version_date: '2016-09-20',
                    version: 'v1'
                });
            }
             logger.log('info',"conversion object data",JSON.stringify(conversation));
            
            if(typeof session.userData.context!='undefined'){
                session.userData.context.layout = '';
                session.userData.context.buttons = '';    
            }

            //gettting data of cars according to category [in future this data will be fetched from database or other storage]
            if(response.context.method=="getCars"){
                response.context.buttons = getCars.getCarsByCategory(response.context.category);
                response.context.method='';
                response.context.category='';
            }
                
            
            logger.log('info', '----------conversation.message stagew----');
            logger.log('info', 'message text',session.message.text);

            //IBM watson conversation api call
            conversation.message({
                workspace_id:process.env['WORKSPACE_ID'],
                input:{'text':((typeof session.message.text!='undefined')?session.message.text:'')},
                context:((typeof session.userData.context!='undefined' && session.userData.context!='' )?session.userData.context:{})
            },function(err, response){
                // error response
                if(err){
                    logger.log('info', '----------conversation err reply----');
                    logger.log('info','error message',JSON.stringify(err, null, 2));
                    session.send("Sorry bot chat has some issue.");
                }

                logger.log('info', '----------conversation reply----');
                logger.log('info',"success data",JSON.stringify(response, null, 2));
                response.output.text.forEach(function(ele){
                     session.send(ele);
                });
                
                if(typeof response.context.layout!='undefined' && response.context.layout!='')
                {
                    console.log("layout==="+response.context.layout);
                    if(response.context.layout=='button'){
                        response.output.text.forEach(function(ele){
                                session.send(ele);
                        });
                        session.beginDialog('/btnTemp',response);
                    }
                    else if(response.context.layout=='quick_replies'){
                        session.beginDialog('/quickreplies',response);
                    }
                    else if(response.context.layout=='generic'){
                        response.output.text.forEach(function(ele){
                                session.send(ele);
                        });
                        session.beginDialog('/genericTemp',response);
                    }
                    else if(response.context.layout=='Category Cars'){
                        response.output.text.forEach(function(ele){
                                session.send(ele);
                        });
                        session.beginDialog('/categorycarsTemp',response);
                    }
                    else if(response.context.layout=='text'){
                        response.output.text.forEach(function(ele){
                                session.send(ele);
                        });
                    }
                }                               

                //maintaing context of conversation
                session.userData.context = response.context;  
               
            });
        }
    }
]);

//************************************
// Quick replies dialogue Template
//************************************

bot.dialog('/quickreplies',[
    function(session,args,next){
        console.log(session);console.log("------quickreplies----------");
        console.log(args);
        builder.Prompts.choice(session,"Select options",args.context.buttons);
       
    },
    function (session, result) {
        if(result.response)
        {
             session.endDialog();
            session.beginDialog('/');
        }
        
        
    },
   
]);

//************************************
// Button dialogue Template
//************************************

bot.dialog('/btnTemp',[
    function(session,args,next){
        console.log(session);console.log("------button----------");
        console.log(args);
        //builder.Prompts.choice(session,"Select options",args.context.buttons);
        var msgAttachment=[],msgbutton=[];
        var choiceStr='';
        if(typeof args!='undefined' && args!=''){
            args.context.buttons.forEach(function(ele){
                 console.log(ele);
                 var  button  = builder.CardAction.imBack(session, ele,ele);
                
                               
                msgbutton.push(button);
                choiceStr+=ele+"|";
             });
             choiceStr=choiceStr.substr(0,(choiceStr.length-1));
             var msgAttachment = new builder.HeroCard(session)
                                    .title('Select option')
                                    .buttons(msgbutton);
             var msg = new builder.Message(session)
            .attachments([msgAttachment]);
            builder.Prompts.choice(session, msg, choiceStr);
        }      
       
    },
    function (session, result) {
        if(result.response)
        {
             session.endDialog();
            session.beginDialog('/');
        }
        
        
    },
   
]);

//***********************************
//Generic Template
//*********************************
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
                        .title(ele)
                        .images([
                            builder.CardImage.create(session, "https://botkit-facebook.mybluemix.net/images/"+ele.replace(/ +/g, "")+".jpg")
                        ])
                        .buttons([
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
        
         session.endDialog();
        session.beginDialog('/');
    }
    
   
]);

//*********************************************
// Car category url template
//*********************************************

bot.dialog('/categorycarsTemp',[
    function(session,args,next){
        console.log("------categorycarsTemp----------");
        console.log(args);
        var carUrls = getCars.getCarUrls();
      
        var attachmentArr =[];
        var choiceStr='';
        if(typeof args.context.buttons!='undefined' && args.context.buttons!='')
        {
           args.context.buttons.forEach(function(ele){
               var obj = new builder.HeroCard(session)
                       .title(ele)
                        .images([
                            builder.CardImage.create(session, "https://botkit-facebook.mybluemix.net/images/"+ele.replace(/ +/g, "")+".jpg")
                        ])
                        .buttons([
                            builder.CardAction.openUrl(session, carUrls[ele].explore, ele),
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
        session.endDialog();
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
