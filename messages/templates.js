//var builder = require('botbuilder');
//var lodash = require('lodash');
var getCars = require('./getcars');

var CardActionBack =function(sessionobj){
	return  builder.CardAction.imBack(sessionobj,this,this);
	
};
var buttontemplate=function (sessionobj,buttondata, title){
	if(buttondata.length>0){
        return new builder.HeroCard(sessionobj)
                .title(title)
                .buttons(lodash.invokeMap(buttondata,CardActionBack,sessionobj));

    }
}

var genericTemplate=function(sessionobj){
	return new builder.HeroCard(sessionobj)
            .title("-")
            .images([
            	builder.CardImage.create(sessionobj, process.env.BASE_URL+"/images/"+this.replace(/ +/g, "")+".jpg")
            ])
            .buttons([
            	builder.CardAction.imBack(sessionobj,  this, this)
            ]);
}
var multiButtonGenericTemplate=function(sessionobj){
	var carUrls = getCars.getCarUrls();
	return new builder.HeroCard(sessionobj)
            .title(this)
            .images([
            	builder.CardImage.create(sessionobj, process.env.BASE_URL+"/images/"+this.replace(/ +/g, "")+".jpg")
            ])
            .buttons([
            	builder.CardAction.openUrl(sessionobj, carUrls[this].explore, 'Explore'),
                builder.CardAction.openUrl(sessionobj, carUrls[this].build, 'Build'),
            ]);
}


module.exports.buttontemplate = buttontemplate;
module.exports.genericTemplate = genericTemplate;
module.exports.multiButtonGenericTemplate = multiButtonGenericTemplate;
