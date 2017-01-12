"use strict";

require('dotenv').load();
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
            logger.log('info',"conversion object");
            // if(!conversation)
            // {
                conversation = watson.conversation({
                    username: 'c725ffde-2e55-4de5-9b8e-d906a5e87690',
                    password: '4pYI2ggJyeVP',
                    version_date: '2016-09-20',
                    version: 'v1'
                });
            // }
            
            
            //var conversation = watson.conversation({
            //    username: 'ade4d4aa-2f93-47e2-9435-2dd4ec9beb80',
            //    password: 'GHHpOGwKN8Sw',
             //   version_date: '2016-09-20',
            //    version: 'v1'
            //});
            session.userData.context.layout = '';
            session.userData.context.buttons = '';
            logger.log('info', '----------conversation.message stagew----');
            logger.log('info', 'message text',session.message.text);
            conversation.message({
                workspace_id:workspace_id,
                input:{'text':((typeof session.message.text!='undefined')?session.message.text:'')},
                context:((typeof session.userData.context!='undefined' && session.userData.context!='' )?session.userData.context:{})
            },function(err, response){
                if(err){
                    logger.log('info', '----------conversation err reply----');
                    logger.log('info','error message',JSON.stringify(err, null, 2));
                    console.log(JSON.stringify(err));
                    session.send("Hi ..cannot be started");
                }
                console.log("-----------------respose-------------");
                console.log(response);
                logger.log('info', '----------conversation reply----');
                logger.log('info',"success data",JSON.stringify(response, null, 2));
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

// {"level":"info","message":"data {\"APP_POOL_CONFIG\":\"C:\\\\DWASFiles\\\\Sites\\\\testfbbot\\\\Config\\\\applicationhost.config\",\"APP_POOL_ID\":\"testfbbot\",\"COMPUTERNAME\":\"RD0003FF93512B\",\"EDGE_NATIVE\":\"D:\\\\Program Files (x86)\\\\SiteExtensions\\\\Functions\\\\1.0.10690\\\\bin\\\\edge\\\\x86\\\\edge_nativeclr.node\",\"PROCESSOR_ARCHITEW6432\":\"AMD64\",\"PUBLIC\":\"D:\\\\Users\\\\Public\",\"AZURE_TOMCAT85_CMDLINE\":\"-Dport.http=%HTTP_PLATFORM_PORT% -Djava.util.logging.config.file=\\\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.5.6\\\\conf\\\\logging.properties\\\" -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Dsite.logdir=\\\"d:/home/LogFiles/\\\" -Dsite.tempdir=\\\"d:\\\\home\\\\site\\\\workdir\\\" -classpath \\\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.5.6\\\\bin\\\\bootstrap.jar;D:\\\\Program Files (x86)\\\\apache-tomcat-8.5.6\\\\bin\\\\tomcat-juli.jar\\\" -Dcatalina.base=\\\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.5.6\\\"  -Djava.io.tmpdir=\\\"d:\\\\home\\\\site\\\\workdir\\\" org.apache.catalina.startup.Bootstrap\",\"ProgramFiles(x86)\":\"D:\\\\Program Files (x86)\",\"ALLUSERSPROFILE\":\"D:\\\\local\\\\ProgramData\",\"PROCESSOR_ARCHITECTURE\":\"x86\",\"CommonProgramW6432\":\"D:\\\\Program Files\\\\Common Files\",\"CommonProgramFiles(x86)\":\"D:\\\\Program Files (x86)\\\\Common Files\",\"AZURE_JETTY93_CMDLINE\":\"-Djava.net.preferIPv4Stack=true -Djetty.port=%HTTP_PLATFORM_PORT% -Djetty.base=\\\"D:\\\\Program Files (x86)\\\\jetty-distribution-9.3.13.v20161014\\\" -Djetty.webapps=\\\"d:\\\\home\\\\site\\\\wwwroot\\\\webapps\\\"  -jar \\\"D:\\\\Program Files (x86)\\\\jetty-distribution-9.3.13.v20161014\\\\start.jar\\\" etc\\\\jetty-logging.xml\",\"PROCESSOR_LEVEL\":\"6\",\"ProgramFiles\":\"D:\\\\Program Files (x86)\",\"PATHEXT\":\".COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC;.PY\",\"USERPROFILE\":\"D:\\\\local\\\\UserProfile\",\"SystemRoot\":\"D:\\\\Windows\",\"OS\":\"Windows_NT\",\"PSModulePath\":\"D:\\\\Windows\\\\system32\\\\WindowsPowerShell\\\\v1.0\\\\Modules\\\\;d:\\\\Program Files\\\\Microsoft Security Client\\\\MpProvider\\\\;D:\\\\Program Files\\\\WindowsPowerShell\\\\Modules\\\\;D:\\\\Program Files (x86)\\\\Microsoft SDKs\\\\Azure\\\\PowerShell\\\\ResourceManager\\\\AzureResourceManager\\\\;D:\\\\Program Files (x86)\\\\Microsoft SDKs\\\\Azure\\\\PowerShell\\\\ServiceManagement\\\\;D:\\\\Program Files (x86)\\\\Microsoft SDKs\\\\Azure\\\\PowerShell\\\\Storage\\\\;D:\\\\Program Files\\\\Microsoft Message Analyzer\\\\PowerShell\\\\\",\"AZURE_JETTY9_CMDLINE\":\"-Djava.net.preferIPv4Stack=true -Djetty.port=%HTTP_PLATFORM_PORT% -Djetty.base=\\\"D:\\\\Program Files (x86)\\\\jetty-distribution-9.1.0.v20131115\\\" -Djetty.webapps=\\\"d:\\\\home\\\\site\\\\wwwroot\\\\webapps\\\"  -jar \\\"D:\\\\Program Files (x86)\\\\jetty-distribution-9.1.0.v20131115\\\\start.jar\\\" etc\\\\jetty-logging.xml\",\"SystemDrive\":\"D:\",\"AZURE_TOMCAT8_CMDLINE\":\"-Dport.http=%HTTP_PLATFORM_PORT% -Djava.util.logging.config.file=\\\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.0.23\\\\conf\\\\logging.properties\\\" -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Dsite.logdir=\\\"d:/home/LogFiles/\\\" -Dsite.tempdir=\\\"d:\\\\home\\\\site\\\\workdir\\\" -classpath \\\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.0.23\\\\bin\\\\bootstrap.jar;D:\\\\Program Files (x86)\\\\apache-tomcat-8.0.23\\\\bin\\\\tomcat-juli.jar\\\" -Dcatalina.base=\\\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.0.23\\\"  -Djava.io.tmpdir=\\\"d:\\\\home\\\\site\\\\workdir\\\" org.apache.catalina.startup.Bootstrap\",\"FP_NO_HOST_CHECK\":\"NO\",\"APPDATA\":\"D:\\\\local\\\\AppData\",\"Path\":\"D:\\\\home\\\\site\\\\tools;D:\\\\Program Files (x86)\\\\nodejs\\\\6.5.0;D:\\\\Windows\\\\system32;D:\\\\Windows;D:\\\\Windows\\\\System32\\\\Wbem;D:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\;D:\\\\Program Files (x86)\\\\Git\\\\cmd;D:\\\\Program Files\\\\Microsoft Network Monitor 3\\\\;D:\\\\Users\\\\Administrator\\\\AppData\\\\Roaming\\\\npm;D:\\\\Program Files (x86)\\\\nodejs\\\\;D:\\\\Program Files (x86)\\\\dotnet;D:\\\\Program Files (x86)\\\\PHP\\\\v5.6;D:\\\\Python27;\",\"USERNAME\":\"RD0003FF93512B$\",\"AZURE_JETTY93_HOME\":\"D:\\\\Program Files (x86)\\\\jetty-distribution-9.3.13.v20161014\",\"CommonProgramFiles\":\"D:\\\\Program Files (x86)\\\\Common Files\",\"AZURE_TOMCAT8_HOME\":\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.0.23\",\"PROCESSOR_IDENTIFIER\":\"Intel64 Family 6 Model 45 Stepping 7, GenuineIntel\",\"ComSpec\":\"D:\\\\Windows\\\\system32\\\\cmd.exe\",\"AZURE_JETTY9_HOME\":\"D:\\\\Program Files (x86)\\\\jetty-distribution-9.1.0.v20131115\",\"USERDOMAIN\":\"WORKGROUP\",\"AZURE_TOMCAT85_HOME\":\"D:\\\\Program Files (x86)\\\\apache-tomcat-8.5.6\",\"TEMP\":\"D:\\\\local\\\\Temp\",\"DOTNET_HOSTING_OPTIMIZATION_CACHE\":\"D:\\\\DotNetCache\",\"LOCALAPPDATA\":\"D:\\\\local\\\\LocalAppData\",\"NUMBER_OF_PROCESSORS\":\"1\",\"AZURE_TOMCAT7_CMDLINE\":\"-Dport.http=%HTTP_PLATFORM_PORT% -Djava.util.logging.config.file=\\\"D:\\\\Program Files (x86)\\\\apache-tomcat-7.0.50\\\\conf\\\\logging.properties\\\" -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Dsite.logdir=\\\"d:/home/LogFiles/\\\" -Dsite.tempdir=\\\"d:\\\\home\\\\site\\\\workdir\\\" -classpath \\\"D:\\\\Program Files (x86)\\\\apache-tomcat-7.0.50\\\\bin\\\\bootstrap.jar;D:\\\\Program Files (x86)\\\\apache-tomcat-7.0.50\\\\bin\\\\tomcat-juli.jar\\\" -Dcatalina.base=\\\"D:\\\\Program Files (x86)\\\\apache-tomcat-7.0.50\\\"  -Djava.io.tmpdir=\\\"d:\\\\home\\\\site\\\\workdir\\\" org.apache.catalina.startup.Bootstrap\",\"TMP\":\"D:\\\\local\\\\Temp\",\"ProgramData\":\"D:\\\\local\\\\ProgramData\",\"ProgramW6432\":\"D:\\\\Program Files\",\"AZURE_TOMCAT7_HOME\":\"D:\\\\Program Files (x86)\\\\apache-tomcat-7.0.50\",\"PROCESSOR_REVISION\":\"2d07\",\"windir\":\"D:\\\\Windows\",\"AzureWebJobsStorage\":\"DefaultEndpointsProtocol=https;AccountName=testfbbotue4agf;AccountKey=GgxHHtHwdPdhfo7HRa1aUIJ0z9GEjRpbGDBwdw/F4d8cCYPQcp8ZwLtP0Knx3Vos7IJVtBZbdXtXvBG9Vf38Iw==;\",\"APPSETTING_AzureWebJobsStorage\":\"DefaultEndpointsProtocol=https;AccountName=testfbbotue4agf;AccountKey=GgxHHtHwdPdhfo7HRa1aUIJ0z9GEjRpbGDBwdw/F4d8cCYPQcp8ZwLtP0Knx3Vos7IJVtBZbdXtXvBG9Vf38Iw==;\",\"AzureWebJobsDashboard\":\"DefaultEndpointsProtocol=https;AccountName=testfbbotue4agf;AccountKey=GgxHHtHwdPdhfo7HRa1aUIJ0z9GEjRpbGDBwdw/F4d8cCYPQcp8ZwLtP0Knx3Vos7IJVtBZbdXtXvBG9Vf38Iw==;\",\"APPSETTING_AzureWebJobsDashboard\":\"DefaultEndpointsProtocol=https;AccountName=testfbbotue4agf;AccountKey=GgxHHtHwdPdhfo7HRa1aUIJ0z9GEjRpbGDBwdw/F4d8cCYPQcp8ZwLtP0Knx3Vos7IJVtBZbdXtXvBG9Vf38Iw==;\",\"WEBSITE_CONTENTAZUREFILECONNECTIONSTRING\":\"DefaultEndpointsProtocol=https;AccountName=testfbbotue4agf;AccountKey=GgxHHtHwdPdhfo7HRa1aUIJ0z9GEjRpbGDBwdw/F4d8cCYPQcp8ZwLtP0Knx3Vos7IJVtBZbdXtXvBG9Vf38Iw==;\",\"APPSETTING_WEBSITE_CONTENTAZUREFILECONNECTIONSTRING\":\"DefaultEndpointsProtocol=https;AccountName=testfbbotue4agf;AccountKey=GgxHHtHwdPdhfo7HRa1aUIJ0z9GEjRpbGDBwdw/F4d8cCYPQcp8ZwLtP0Knx3Vos7IJVtBZbdXtXvBG9Vf38Iw==;\",\"FUNCTIONS_EXTENSION_VERSION\":\"~1\",\"APPSETTING_FUNCTIONS_EXTENSION_VERSION\":\"~1\",\"WEBSITE_NODE_DEFAULT_VERSION\":\"6.5.0\",\"APPSETTING_WEBSITE_NODE_DEFAULT_VERSION\":\"6.5.0\",\"BotId\":\"testfbbot_LMQ3q5uMHNs\",\"APPSETTING_BotId\":\"testfbbot_LMQ3q5uMHNs\",\"BotEnv\":\"prod\",\"APPSETTING_BotEnv\":\"prod\",\"BotStateEndpoint\":\"\",\"APPSETTING_BotStateEndpoint\":\"\",\"BotOpenIdMetadata\":\"\",\"APPSETTING_BotOpenIdMetadata\":\"\",\"MicrosoftAppId\":\"ccd75d51-a1b5-43e7-951d-13d5e35bdd67\",\"APPSETTING_MicrosoftAppId\":\"ccd75d51-a1b5-43e7-951d-13d5e35bdd67\",\"MicrosoftAppPassword\":\"TuQOdWghbeRWqjkER3xEv7j\",\"APPSETTING_MicrosoftAppPassword\":\"TuQOdWghbeRWqjkER3xEv7j\",\"SCM_POST_DEPLOYMENT_ACTIONS_PATH\":\"PostDeployScripts\",\"APPSETTING_SCM_POST_DEPLOYMENT_ACTIONS_PATH\":\"PostDeployScripts\",\"BotDevAppInsightKey\":\"ffba3a76-a6c8-4b39-9625-993d7ea53a95\",\"APPSETTING_BotDevAppInsightKey\":\"ffba3a76-a6c8-4b39-9625-993d7ea53a95\",\"ScmType\":\"GitHub\",\"APPSETTING_ScmType\":\"GitHub\",\"WEBSITE_SITE_NAME\":\"testfbbot\",\"APPSETTING_WEBSITE_SITE_NAME\":\"testfbbot\",\"WEBSITE_AUTH_ENABLED\":\"False\",\"APPSETTING_WEBSITE_AUTH_ENABLED\":\"False\",\"REGION_NAME\":\"South Central US\",\"HOME\":\"D:\\\\home\",\"HOME_EXPANDED\":\"C:\\\\DWASFiles\\\\Sites\\\\testfbbot\\\\VirtualDirectory0\",\"LOCAL_EXPANDED\":\"C:\\\\DWASFiles\\\\Sites\\\\testfbbot\",\"windows_tracing_flags\":\"\",\"windows_tracing_logfile\":\"\",\"WEBSITE_INSTANCE_ID\":\"1a5b157abb2065423db8976163ac8508b6d7269cd60533085e36d67e56cc5619\",\"WEBSITE_HTTPLOGGING_ENABLED\":\"0\",\"WEBSITE_SCM_ALWAYS_ON_ENABLED\":\"0\",\"WEBSITE_COMPUTE_MODE\":\"Dynamic\",\"WEBSITE_SKU\":\"Dynamic\",\"WEBSITE_PRIVATE_EXTENSIONS\":\"0\",\"WEBSITE_SCM_SEPARATE_STATUS\":\"1\",\"WEBSITE_IIS_SITE_NAME\":\"testfbbot\",\"SITE_BITNESS\":\"x86\",\"WEBSITE_CORS_ALLOWED_ORIGINS\":\"http://ic-devportal-local.azurewebsites.net,https://ic-devportal-scratch.ic-ase-internal.p.azurewebsites.net,https://ic-devportal-ppe.ic-ase-internal.p.azurewebsites.net,https://dev.botframework.com\",\"WEBSITE_PROACTIVE_AUTOHEAL_ENABLED\":\"True\",\"WEBSITE_DYNAMIC_CACHE\":\"0\",\"REMOTEDEBUGGINGPORT\":\"\",\"REMOTEDEBUGGINGBITVERSION\":\"vx86\",\"WEBSITE_LOCALCACHE_ENABLED\":\"False\",\"WEBSITE_MEMORY_LIMIT_MB\":\"1536\",\"WEBSOCKET_CONCURRENT_REQUEST_LIMIT\":\"35\",\"JAVA_HOME\":\"D:\\\\Program Files\\\\Java\\\\jdk1.7.0_51\",\"WEBSITE_OWNER_NAME\":\"197fd41a-b745-4f77-a657-9c68010ec136+sapient-SouthCentralUSwebspace\",\"WEBSITE_HOSTNAME\":\"testfbbot.azurewebsites.net\",\"WEBSITE_RELAYS\":\"\",\"WEBSITE_REWRITE_TABLE\":\"\",\"WEBSITE_VOLUME_TYPE\":\"AzureFiles\"}","timestamp":"2017-01-12T06:55:04.582Z"}
